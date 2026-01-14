# frozen_string_literal: true

require "csv"

# rubocop:disable Metrics/ClassLength, Metrics/AbcSize, Metrics/MethodLength
# rubocop:disable Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity
class GoalImportService
  class ImportError < StandardError; end

  SYSTEM_PROMPT = <<~PROMPT
    You are a goal import assistant for a family planning application.
    Parse goal data and:
    1. Determine time_scale (daily, weekly, monthly, quarterly, annual)
    2. Extract and normalize SMART fields
    3. Identify person names mentioned for assignment

    Time scale inference rules:
    - "Daily", "EOD", "every day", "each day" → daily
    - "Weekly", "each week", "per week" → weekly
    - "Monthly", specific month names, "EOM" → monthly
    - "Quarterly", "Q1-Q4", multiple quarters listed → quarterly
    - "Annual", "EOY", "December" as deadline, year number → annual

    Respond with valid JSON only, no additional text.
  PROMPT

  RESPONSE_FORMAT = <<~FORMAT
    Respond with JSON:
    {
      "title": "cleaned goal title",
      "description": "brief description or null",
      "time_scale": "daily|weekly|monthly|quarterly|annual",
      "specific": "specific criteria from the goal",
      "measurable": "measurable criteria",
      "achievable": "achievability assessment",
      "relevant": "relevance explanation",
      "time_bound": "time constraint details",
      "assignee_names": ["Name1", "Name2"],
      "confidence": 0.9
    }
  FORMAT

  SUB_GOAL_PROMPT = <<~PROMPT
    You are a goal breakdown assistant. Given an annual or quarterly goal, generate practical weekly or daily task suggestions that would help achieve the goal.

    For annual goals: generate 4-6 quarterly milestones and 2-3 weekly habit suggestions
    For quarterly goals: generate 4-8 weekly tasks

    Respond with valid JSON only.
  PROMPT

  SUB_GOAL_FORMAT = <<~FORMAT
    Respond with JSON:
    {
      "milestones": [
        {"title": "...", "time_scale": "quarterly|monthly", "due_offset_days": 90}
      ],
      "weekly_tasks": [
        {"title": "...", "description": "...", "frequency": "weekly|daily"}
      ]
    }
  FORMAT

  def initialize(family:, user:, client: nil)
    @family = family
    @user = user
    @client = client
    @family_members = load_family_members
  end

  def client
    @client ||= AnthropicClient.new
  end

  def import(csv_content:, generate_sub_goals: false)
    rows = parse_csv(csv_content)
    results = process_rows(rows)

    results[:sub_goal_suggestions] = generate_all_sub_goal_suggestions(results[:goals]) if generate_sub_goals

    results
  rescue CSV::MalformedCSVError => e
    raise ImportError, "Invalid CSV format: #{e.message}"
  end

  private

  def load_family_members
    @family.members.pluck(:id, :name, :email).map do |id, name, email|
      name_parts = name.to_s.split
      first_name = name_parts.first
      last_name = name_parts.length > 1 ? name_parts[1..].join(" ") : nil
      {
        id: id,
        first_name: first_name&.downcase,
        last_name: last_name&.downcase,
        full_name: name.to_s.downcase,
        email: email&.downcase
      }
    end
  end

  def parse_csv(csv_content)
    CSV.parse(csv_content, headers: false, liberal_parsing: true)
  end

  def process_rows(rows)
    results = {
      created_count: 0,
      failed_count: 0,
      categories: [],
      goals: [],
      failures: []
    }

    current_category = nil

    rows.each_with_index do |row, index|
      row_type = detect_row_type(row)

      case row_type
      when :category
        current_category = extract_category(row)
        results[:categories] << current_category
      when :goal
        process_goal_row(row, current_category, index, results)
      end
    end

    results
  end

  def detect_row_type(row)
    return :empty if row.nil? || row.compact.empty?
    return :header if header_row?(row)

    # Category rows typically have text only in the first column
    first_col = row[0]&.to_s&.strip
    second_col = row[1]&.to_s&.strip

    if first_col.present? && second_col.blank? && row[2..].all? do |c|
      c.to_s.strip.blank?
    end && first_col.length < 50 && !first_col.match?(/^\d+$/)
      # Check if it looks like a category name (not a number, not too long)
      return :category
    end

    # If there's content in multiple columns, it's likely a goal row
    return :goal if second_col.present?

    :empty
  end

  def header_row?(row)
    first_few = row[0..5].map { |c| c.to_s.downcase.strip }
    header_keywords = %w[title specific measurable achievable relevant time-bound]
    (first_few & header_keywords).length >= 3
  end

  def extract_category(row)
    row[0].to_s.strip
  end

  def process_goal_row(row, category, index, results)
    raw_data = extract_raw_goal_data(row)
    parsed = parse_goal_with_llm(raw_data, category)

    if parsed[:error]
      results[:failures] << { row: index + 1, error: parsed[:error], raw: raw_data[:title] }
      results[:failed_count] += 1
      return
    end

    goal = create_goal(parsed, category)
    if goal.persisted?
      results[:goals] << goal_to_hash(goal, parsed)
      results[:created_count] += 1
    else
      results[:failures] << { row: index + 1, error: goal.errors.full_messages.join(", "), raw: parsed[:title] }
      results[:failed_count] += 1
    end
  rescue StandardError => e
    results[:failures] << { row: index + 1, error: e.message, raw: row[1] }
    results[:failed_count] += 1
  end

  def extract_raw_goal_data(row)
    {
      title: row[1]&.to_s&.strip,
      specific: row[2]&.to_s&.strip,
      measurable: row[3]&.to_s&.strip,
      achievable: row[4]&.to_s&.strip,
      relevant: row[5]&.to_s&.strip,
      time_bound: row[6]&.to_s&.strip
    }
  end

  def parse_goal_with_llm(raw_data, category)
    return { error: "No title provided" } if raw_data[:title].blank?

    prompt = build_parse_prompt(raw_data, category)

    response = client.chat(
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }]
    )

    parse_llm_response(response, raw_data)
  rescue AnthropicClient::ApiError => e
    { error: "AI parsing failed: #{e.message}" }
  end

  def build_parse_prompt(raw_data, category)
    members_list = @family_members.pluck(:full_name).join(", ")

    <<~PROMPT
      Parse this goal from a CSV import:

      Category: #{category || "Uncategorized"}
      Title: #{raw_data[:title]}
      Specific: #{raw_data[:specific]}
      Measurable: #{raw_data[:measurable]}
      Achievable: #{raw_data[:achievable]}
      Relevant: #{raw_data[:relevant]}
      Time-bound: #{raw_data[:time_bound]}

      Available family members for assignment: #{members_list}

      #{RESPONSE_FORMAT}
    PROMPT
  end

  def parse_llm_response(response, raw_data)
    json_str = extract_json(response)
    data = JSON.parse(json_str)

    {
      title: data["title"].presence || raw_data[:title],
      description: data["description"],
      time_scale: normalize_time_scale(data["time_scale"]),
      specific: data["specific"].presence || raw_data[:specific],
      measurable: data["measurable"].presence || raw_data[:measurable],
      achievable: data["achievable"].presence || raw_data[:achievable],
      relevant: data["relevant"].presence || raw_data[:relevant],
      time_bound: data["time_bound"].presence || raw_data[:time_bound],
      assignee_names: Array(data["assignee_names"]),
      confidence: data["confidence"].to_f
    }
  rescue JSON::ParserError => e
    { error: "Failed to parse AI response: #{e.message}" }
  end

  def extract_json(response)
    if response.include?("```json")
      response.match(/```json\s*(.*?)\s*```/m)&.captures&.first || response
    elsif response.include?("```")
      response.match(/```\s*(.*?)\s*```/m)&.captures&.first || response
    else
      response
    end
  end

  def normalize_time_scale(time_scale)
    valid_scales = Goal.time_scales.keys
    scale = time_scale.to_s.downcase.strip
    valid_scales.include?(scale) ? scale : "annual"
  end

  def create_goal(parsed, category)
    goal = Goal.new(
      family: @family,
      creator: @user,
      title: parsed[:title],
      description: [category, parsed[:description]].compact.join(" - ").presence,
      time_scale: parsed[:time_scale],
      specific: parsed[:specific],
      measurable: parsed[:measurable],
      achievable: parsed[:achievable],
      relevant: parsed[:relevant],
      time_bound: parsed[:time_bound],
      status: :not_started,
      visibility: :family,
      progress: 0
    )

    assign_users_to_goal(goal, parsed[:assignee_names]) if goal.save

    goal
  end

  def assign_users_to_goal(goal, assignee_names)
    return if assignee_names.blank?

    assignee_names.each do |name|
      user_id = match_assignee(name)
      goal.assign_user(User.find(user_id)) if user_id
    end
  end

  def match_assignee(name)
    return nil if name.blank?

    name_lower = name.downcase.strip

    # Try exact first name match
    match = @family_members.find { |m| m[:first_name] == name_lower }
    return match[:id] if match

    # Try full name match
    match = @family_members.find { |m| m[:full_name] == name_lower }
    return match[:id] if match

    # Try partial match (name contains)
    match = @family_members.find { |m| m[:full_name]&.include?(name_lower) || name_lower.include?(m[:first_name].to_s) }
    match&.dig(:id)
  end

  def goal_to_hash(goal, parsed)
    {
      id: goal.id,
      title: goal.title,
      time_scale: goal.time_scale,
      category: goal.description&.split(" - ")&.first,
      assignees: goal.assignees.map { |u| { id: u.id, name: u.first_name } },
      confidence: parsed[:confidence]
    }
  end

  def generate_all_sub_goal_suggestions(goals)
    suggestions = []

    goals.each do |goal_hash|
      next unless %w[annual quarterly].include?(goal_hash[:time_scale])

      goal = Goal.find(goal_hash[:id])
      suggestion = generate_sub_goal_suggestions(goal)
      suggestions << suggestion if suggestion
    end

    suggestions
  end

  def generate_sub_goal_suggestions(goal)
    prompt = <<~PROMPT
      Generate sub-goal suggestions for this #{goal.time_scale} goal:

      Title: #{goal.title}
      Description: #{goal.description}
      SMART Criteria:
      - Specific: #{goal.specific}
      - Measurable: #{goal.measurable}
      - Time-bound: #{goal.time_bound}

      #{SUB_GOAL_FORMAT}
    PROMPT

    response = client.chat(
      system: SUB_GOAL_PROMPT,
      messages: [{ role: "user", content: prompt }]
    )

    json_str = extract_json(response)
    data = JSON.parse(json_str)

    {
      goal_id: goal.id,
      goal_title: goal.title,
      milestones: data["milestones"] || [],
      weekly_tasks: data["weekly_tasks"] || []
    }
  rescue StandardError => e
    Rails.logger.error("Sub-goal generation failed for goal #{goal.id}: #{e.message}")
    nil
  end
end
# rubocop:enable Metrics/ClassLength, Metrics/AbcSize, Metrics/MethodLength
# rubocop:enable Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity
