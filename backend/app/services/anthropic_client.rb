# frozen_string_literal: true

class AnthropicClient
  class ApiError < StandardError; end
  class RateLimitError < ApiError; end
  class ContentFilterError < ApiError; end

  DEFAULT_MODEL = "claude-3-5-sonnet-20241022"
  DEFAULT_MAX_TOKENS = 4096

  def initialize
    @client = Anthropic::Client.new(
      api_key: Rails.application.credentials.dig(:anthropic, :api_key) || ENV.fetch("ANTHROPIC_API_KEY", nil)
    )
  end

  def chat(messages:, system: nil, model: DEFAULT_MODEL, max_tokens: DEFAULT_MAX_TOKENS)
    response = @client.messages.create(
      model: model,
      max_tokens: max_tokens,
      system: system,
      messages: messages
    )

    extract_text_content(response)
  rescue Faraday::TooManyRequestsError => e
    raise RateLimitError, "Rate limit exceeded: #{e.message}"
  rescue Faraday::BadRequestError => e
    raise ContentFilterError, "Content filtered: #{e.message}"
  rescue Faraday::Error, Anthropic::Error => e
    raise ApiError, "API error: #{e.message}"
  end

  private

  def extract_text_content(response)
    content_blocks = response["content"] || []
    text_blocks = content_blocks.select { |block| block["type"] == "text" }
    text_blocks.pluck("text").join("\n")
  end
end
