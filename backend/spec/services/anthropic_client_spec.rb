# frozen_string_literal: true

require "rails_helper"

RSpec.describe AnthropicClient do
  let(:client) { described_class.new }
  let(:messages) { [{ role: "user", content: "Hello" }] }
  let(:system_prompt) { "You are a helpful assistant." }

  # Create mock objects that match the SDK's response structure
  let(:mock_messages_resource) { instance_double(Anthropic::Resources::Messages) }
  let(:mock_anthropic) { instance_double(Anthropic::Client, messages: mock_messages_resource) }

  before do
    allow(Anthropic::Client).to receive(:new).and_return(mock_anthropic)
  end

  describe "#chat" do
    context "with successful API response" do
      let(:mock_text_block) do
        instance_double(Anthropic::Models::TextBlock, type: :text, text: "Hello! How can I help you today?")
      end
      let(:mock_response) do
        instance_double(Anthropic::Models::Message, content: [mock_text_block])
      end

      before do
        allow(mock_messages_resource).to receive(:create).and_return(mock_response)
      end

      it "returns the text content from the response" do
        result = client.chat(messages: messages, system: system_prompt)

        expect(result).to eq("Hello! How can I help you today?")
      end

      it "concatenates multiple text blocks" do
        block1 = instance_double(Anthropic::Models::TextBlock, type: :text, text: "First part. ")
        block2 = instance_double(Anthropic::Models::TextBlock, type: :text, text: "Second part.")
        response = instance_double(Anthropic::Models::Message, content: [block1, block2])
        allow(mock_messages_resource).to receive(:create).and_return(response)

        result = client.chat(messages: messages)

        expect(result).to eq("First part. \nSecond part.")
      end

      it "filters out non-text content blocks" do
        text_block = instance_double(Anthropic::Models::TextBlock, type: :text, text: "Text content")
        tool_block = instance_double(Anthropic::Models::ToolUseBlock, type: :tool_use, name: "some_tool")
        response = instance_double(Anthropic::Models::Message, content: [text_block, tool_block])
        allow(mock_messages_resource).to receive(:create).and_return(response)

        result = client.chat(messages: messages)

        expect(result).to eq("Text content")
      end
    end

    context "with empty response" do
      before do
        response = instance_double(Anthropic::Models::Message, content: [])
        allow(mock_messages_resource).to receive(:create).and_return(response)
      end

      it "returns empty string" do
        result = client.chat(messages: messages)

        expect(result).to eq("")
      end
    end

    context "with rate limit error" do
      before do
        error = Anthropic::Errors::RateLimitError.allocate
        allow(error).to receive(:message).and_return("rate limited")
        allow(mock_messages_resource).to receive(:create).and_raise(error)
      end

      it "raises RateLimitError" do
        expect do
          client.chat(messages: messages)
        end.to raise_error(AnthropicClient::RateLimitError, /Rate limit exceeded/)
      end
    end

    context "with bad request error" do
      before do
        error = Anthropic::Errors::BadRequestError.allocate
        allow(error).to receive(:message).and_return("content filtered")
        allow(mock_messages_resource).to receive(:create).and_raise(error)
      end

      it "raises ContentFilterError" do
        expect do
          client.chat(messages: messages)
        end.to raise_error(AnthropicClient::ContentFilterError, /Content filtered/)
      end
    end

    context "with generic API error" do
      before do
        error = Anthropic::Errors::APIError.allocate
        allow(error).to receive(:message).and_return("server error")
        allow(mock_messages_resource).to receive(:create).and_raise(error)
      end

      it "raises ApiError" do
        expect do
          client.chat(messages: messages)
        end.to raise_error(AnthropicClient::ApiError, /API error/)
      end
    end
  end
end
