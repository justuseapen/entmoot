# frozen_string_literal: true

class GoalTrackabilityService
  class AssessmentError < StandardError; end

  SYSTEM_PROMPT = <<~PROMPT
    You are an integration specialist for a goal tracking application.
    Your role is to assess whether a goal's progress could be automatically measured
    through external integrations.

    A goal is "trackable" if progress can be automatically measured through:
    - Financial APIs (Plaid) - net worth, savings, debt payoff, investment growth
    - Gaming/Sports APIs (Chess.com, Lichess) - ratings, rankings, games played
    - Fitness APIs (Strava, Apple Health, Fitbit) - workouts, steps, distance
    - Learning platforms (Duolingo, Coursera, Udemy) - lessons completed, certifications
    - Reading apps (Goodreads, Kindle) - books read, pages
    - Any other API with quantifiable metrics

    Be conservative - only mark as trackable if there's a clear, direct integration possibility.
    Respond in valid JSON format only.
  PROMPT

  RESPONSE_FORMAT = <<~FORMAT
    Respond with JSON only:
    {"is_trackable": true/false, "reason": "Brief explanation", "potential_integrations": ["Integration1", "Integration2"]}
  FORMAT

  def initialize(goal)
    @goal = goal
    @client = AnthropicClient.new
  end

  def assess
    response = @client.chat(
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: build_prompt }],
      max_tokens: 500
    )

    parse_response(response)
  rescue AnthropicClient::ApiError => e
    raise AssessmentError, e.message
  rescue JSON::ParserError => e
    raise AssessmentError, "Failed to parse AI response: #{e.message}"
  end

  private

  def build_prompt
    <<~PROMPT
      Assess trackability for this goal:
      Title: #{@goal.title}
      Description: #{@goal.description || "Not provided"}
      Time Scale: #{@goal.time_scale}

      #{RESPONSE_FORMAT}
    PROMPT
  end

  def parse_response(response)
    json_str = extract_json(response)
    data = JSON.parse(json_str)

    {
      is_trackable: data["is_trackable"] == true,
      reason: data["reason"].to_s.presence || "No assessment provided.",
      potential_integrations: normalize_integrations(data["potential_integrations"])
    }
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

  def normalize_integrations(integrations)
    return [] unless integrations.is_a?(Array)

    integrations.first(10).map(&:to_s).compact_blank
  end
end
