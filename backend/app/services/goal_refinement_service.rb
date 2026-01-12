# frozen_string_literal: true

class GoalRefinementService
  class RefinementError < StandardError; end

  SMART_FIELDS = %i[specific measurable achievable relevant time_bound].freeze

  SYSTEM_PROMPT = <<~PROMPT
    You are a goal-setting coach specializing in SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound).
    Your role is to help users refine their goals to make them more effective and achievable.

    When analyzing a goal, provide:
    1. Suggestions for each SMART criterion
    2. Alternative title and description options
    3. Potential obstacles the user might face
    4. Milestone recommendations to break down the goal

    Be constructive, encouraging, and practical. Focus on actionable improvements.
    Respond in valid JSON format only, with no additional text.
  PROMPT

  RESPONSE_FORMAT = <<~FORMAT
    Please respond with a JSON object containing:
    {"smart_suggestions": {"specific": "...", "measurable": "...", "achievable": "...", "relevant": "...", "time_bound": "..."},
    "alternative_titles": ["Title 1", "Title 2"], "alternative_descriptions": ["Desc 1"],
    "potential_obstacles": [{"obstacle": "...", "mitigation": "..."}],
    "milestones": [{"title": "...", "description": "...", "suggested_progress": 25}],
    "overall_feedback": "..."}
  FORMAT

  def initialize(goal)
    @goal = goal
    @client = AnthropicClient.new
  end

  def refine
    response = @client.chat(
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: build_user_prompt }]
    )

    parse_response(response)
  rescue AnthropicClient::ApiError => e
    raise RefinementError, e.message
  rescue JSON::ParserError => e
    raise RefinementError, "Failed to parse AI response: #{e.message}"
  end

  private

  def build_user_prompt
    <<~PROMPT
      Please analyze and provide suggestions for improving this goal:

      #{goal_context}

      #{current_smart_fields}

      #{RESPONSE_FORMAT}
    PROMPT
  end

  def goal_context
    <<~CONTEXT.strip
      Title: #{@goal.title}
      Description: #{@goal.description || "Not provided"}
      Time Scale: #{@goal.time_scale}
      Due Date: #{@goal.due_date || "Not set"}
      Current Progress: #{@goal.progress}%
    CONTEXT
  end

  def current_smart_fields
    <<~FIELDS.strip
      Current SMART Fields:
      - Specific: #{@goal.specific || "Not defined"}
      - Measurable: #{@goal.measurable || "Not defined"}
      - Achievable: #{@goal.achievable || "Not defined"}
      - Relevant: #{@goal.relevant || "Not defined"}
      - Time-bound: #{@goal.time_bound || "Not defined"}
    FIELDS
  end

  def parse_response(response)
    # Extract JSON from the response (handle potential markdown code blocks)
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
      smart_suggestions: normalize_smart_suggestions(data["smart_suggestions"]),
      alternative_titles: normalize_array(data["alternative_titles"], max: 5),
      alternative_descriptions: normalize_array(data["alternative_descriptions"], max: 3),
      potential_obstacles: normalize_obstacles(data["potential_obstacles"]),
      milestones: normalize_milestones(data["milestones"]),
      overall_feedback: data["overall_feedback"].to_s.presence || "Goal analysis complete."
    }
  end

  def normalize_smart_suggestions(suggestions)
    return default_smart_suggestions unless suggestions.is_a?(Hash)

    SMART_FIELDS.index_with { |field| suggestions[field.to_s].to_s.presence }
  end

  def default_smart_suggestions
    SMART_FIELDS.index_with { |_| nil }
  end

  def normalize_array(arr, max:)
    return [] unless arr.is_a?(Array)

    arr.first(max).map(&:to_s).compact_blank
  end

  def normalize_obstacles(obstacles)
    return [] unless obstacles.is_a?(Array)

    obstacles.first(5).filter_map do |obs|
      next unless obs.is_a?(Hash)

      {
        obstacle: obs["obstacle"].to_s.presence,
        mitigation: obs["mitigation"].to_s.presence
      }.compact
    end.reject(&:empty?)
  end

  def normalize_milestones(milestones)
    return [] unless milestones.is_a?(Array)

    milestones.first(10).filter_map do |ms|
      next unless ms.is_a?(Hash) && ms["title"].present?

      {
        title: ms["title"].to_s,
        description: ms["description"].to_s.presence,
        suggested_progress: ms["suggested_progress"].to_i.clamp(0, 100)
      }
    end
  end
end
