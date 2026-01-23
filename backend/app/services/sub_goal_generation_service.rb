# frozen_string_literal: true

class SubGoalGenerationService
  class GenerationError < StandardError; end

  TIME_SCALE_CHILDREN = {
    "annual" => %w[quarterly monthly],
    "quarterly" => %w[monthly weekly]
  }.freeze

  SYSTEM_PROMPT = <<~PROMPT
    You are an expert goal coach and researcher with deep domain knowledge across many fields.
    When given a high-level goal, you research the topic thoroughly and create realistic sub-goals
    that break down the parent goal into achievable milestones.

    For example, for "Get a private pilot's license":
    - Research typical FAA requirements (40 flight hours minimum, written exam, medical certificate, etc.)
    - Create milestones like "Get FAA medical certificate", "Complete ground school", "Pass written exam", "Complete solo flights", "Pass practical checkride"
    - Provide realistic time estimates based on typical learning curves and requirements

    For any goal, you should:
    1. Research the domain requirements and typical pathways to achieve this goal
    2. Break it into 4-8 logical sub-goals that form a complete path
    3. Order them by dependency (what needs to happen first)
    4. Assign realistic progress percentages (when this sub-goal is done, what % of the parent is complete)
    5. Suggest appropriate time scales (quarterly, monthly, weekly) based on complexity
    6. Provide SMART field suggestions for each sub-goal

    Respond in valid JSON format only, with no additional text.
  PROMPT

  RESPONSE_FORMAT = <<~FORMAT
    Please respond with a JSON object containing:
    {
      "sub_goals": [
        {
          "title": "Sub-goal title",
          "description": "Brief description of what this involves",
          "time_scale": "monthly",
          "suggested_progress": 15,
          "due_date_percent": 15,
          "order": 1,
          "smart_fields": {
            "specific": "What exactly needs to be accomplished",
            "measurable": "How progress will be tracked",
            "achievable": "Why this is realistically possible",
            "relevant": "How this connects to the parent goal",
            "time_bound": "Time constraint for this sub-goal"
          }
        }
      ],
      "domain_insights": "Brief insights about the domain and typical timeline",
      "total_duration_estimate": "Estimated total time to complete the parent goal"
    }

    Notes:
    - time_scale should be "quarterly", "monthly", or "weekly"
    - suggested_progress is cumulative (0-100) - what % of parent goal is done when this sub-goal completes
    - due_date_percent (0-100) is when this sub-goal should be due, as a percentage of time until parent's due date
    - order determines sequence (1 = first, 2 = second, etc.)
  FORMAT

  def initialize(goal)
    @goal = goal
    @client = AnthropicClient.new
  end

  def generate
    response = @client.chat(
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: build_user_prompt }]
    )

    parse_response(response)
  rescue AnthropicClient::ApiError => e
    raise GenerationError, e.message
  rescue JSON::ParserError => e
    raise GenerationError, "Failed to parse AI response: #{e.message}"
  end

  private

  def build_user_prompt
    <<~PROMPT
      Please research and generate sub-goals for this goal:

      #{goal_context}

      #{RESPONSE_FORMAT}
    PROMPT
  end

  def goal_context
    days_until_due = @goal.due_date ? (@goal.due_date - Date.current).to_i : nil
    allowed_scales = TIME_SCALE_CHILDREN[@goal.time_scale] || %w[monthly weekly]

    <<~CONTEXT.strip
      Title: #{@goal.title}
      Description: #{@goal.description || "Not provided"}
      Time Scale: #{@goal.time_scale}
      Due Date: #{@goal.due_date || "Not set"}
      Days Until Due: #{days_until_due || "Unknown"}

      Allowed sub-goal time scales: #{allowed_scales.join(", ")}
      Generate 4-8 sub-goals that progressively work toward completing this goal.
    CONTEXT
  end

  def parse_response(response)
    json_str = extract_json(response)
    data = JSON.parse(json_str)

    validate_and_normalize(data)
  end

  def extract_json(response)
    extract_json_code_block(response) || extract_generic_code_block(response) || response
  end

  def extract_json_code_block(response)
    return unless response.include?("```json")

    response.match(/```json\s*(.*?)\s*```/m)&.captures&.first
  end

  def extract_generic_code_block(response)
    return unless response.include?("```")

    response.match(/```\s*(.*?)\s*```/m)&.captures&.first
  end

  def validate_and_normalize(data)
    {
      sub_goals: normalize_sub_goals(data["sub_goals"]),
      domain_insights: data["domain_insights"].to_s.presence || "Goal analysis complete.",
      total_duration_estimate: data["total_duration_estimate"].to_s.presence
    }
  end

  def normalize_sub_goals(sub_goals)
    return [] unless sub_goals.is_a?(Array)

    allowed_scales = TIME_SCALE_CHILDREN[@goal.time_scale] || %w[monthly weekly]

    sub_goals.first(8).filter_map.with_index do |sg, index|
      next unless sg.is_a?(Hash) && sg["title"].present?

      time_scale = normalize_time_scale(sg["time_scale"], allowed_scales)
      due_date = calculate_due_date(sg["due_date_percent"])

      {
        title: sg["title"].to_s.strip,
        description: sg["description"].to_s.presence,
        time_scale: time_scale,
        suggested_progress: sg["suggested_progress"].to_i.clamp(0, 100),
        due_date: due_date,
        order: sg["order"].to_i.positive? ? sg["order"].to_i : (index + 1),
        smart_fields: normalize_smart_fields(sg["smart_fields"])
      }
    end.sort_by { |sg| sg[:order] }
  end

  def normalize_time_scale(scale, allowed_scales)
    scale = scale.to_s.downcase
    allowed_scales.include?(scale) ? scale : allowed_scales.first
  end

  def calculate_due_date(due_date_percent)
    return nil unless @goal.due_date && due_date_percent.present?

    percent = due_date_percent.to_f.clamp(0, 100) / 100.0
    days_until_parent_due = (@goal.due_date - Date.current).to_i
    days_for_sub_goal = (days_until_parent_due * percent).round

    Date.current + days_for_sub_goal
  end

  def normalize_smart_fields(fields)
    return {} unless fields.is_a?(Hash)

    %i[specific measurable achievable relevant time_bound].index_with do |field|
      fields[field.to_s].to_s.presence
    end.compact
  end
end
