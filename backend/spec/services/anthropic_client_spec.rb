# frozen_string_literal: true

require "rails_helper"

RSpec.describe AnthropicClient do
  let(:client) { described_class.new }
  let(:messages) { [{ role: "user", content: "Hello" }] }
  let(:system_prompt) { "You are a helpful assistant." }

  # Create a mock Messages resource for testing
  let(:mock_messages_resource) { double("Anthropic::Messages::Resource") } # rubocop:disable RSpec/VerifiedDoubles
  let(:mock_anthropic) { instance_double(Anthropic::Client, messages: mock_messages_resource) }

  before do
    allow(Anthropic::Client).to receive(:new).and_return(mock_anthropic)
  end

  describe "#chat" do
    context "with successful API response" do
      let(:mock_response) do
        {
          "content" => [
            { "type" => "text", "text" => "Hello! How can I help you today?" }
          ]
        }
      end

      before do
        allow(mock_messages_resource).to receive(:create).and_return(mock_response)
      end

      it "returns the text content from the response" do
        result = client.chat(messages: messages, system: system_prompt)

        expect(result).to eq("Hello! How can I help you today?")
      end

      it "concatenates multiple text blocks" do
        allow(mock_messages_resource).to receive(:create).and_return({
                                                                       "content" => [
                                                                         { "type" => "text", "text" => "First part. " },
                                                                         { "type" => "text", "text" => "Second part." }
                                                                       ]
                                                                     })

        result = client.chat(messages: messages)

        expect(result).to eq("First part. \nSecond part.")
      end

      it "filters out non-text content blocks" do
        allow(mock_messages_resource).to receive(:create).and_return({
                                                                       "content" => [
                                                                         { "type" => "text", "text" => "Text content" },
                                                                         { "type" => "tool_use", "name" => "some_tool" }
                                                                       ]
                                                                     })

        result = client.chat(messages: messages)

        expect(result).to eq("Text content")
      end
    end

    context "with empty response" do
      before do
        allow(mock_messages_resource).to receive(:create).and_return({ "content" => [] })
      end

      it "returns empty string" do
        result = client.chat(messages: messages)

        expect(result).to eq("")
      end
    end

    context "with rate limit error" do
      before do
        allow(mock_messages_resource).to receive(:create)
          .and_raise(Faraday::TooManyRequestsError.new("rate limited"))
      end

      it "raises RateLimitError" do
        expect do
          client.chat(messages: messages)
        end.to raise_error(AnthropicClient::RateLimitError, /Rate limit exceeded/)
      end
    end

    context "with bad request error" do
      before do
        allow(mock_messages_resource).to receive(:create)
          .and_raise(Faraday::BadRequestError.new("content filtered"))
      end

      it "raises ContentFilterError" do
        expect do
          client.chat(messages: messages)
        end.to raise_error(AnthropicClient::ContentFilterError, /Content filtered/)
      end
    end

    context "with generic API error" do
      before do
        allow(mock_messages_resource).to receive(:create).and_raise(Faraday::Error.new("server error"))
      end

      it "raises ApiError" do
        expect do
          client.chat(messages: messages)
        end.to raise_error(AnthropicClient::ApiError, /API error/)
      end
    end
  end
end
