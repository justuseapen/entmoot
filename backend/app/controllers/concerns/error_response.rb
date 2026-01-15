# frozen_string_literal: true

module ErrorResponse
  extend ActiveSupport::Concern

  # Renders a structured error response
  #
  # @param message [String] The main error message
  # @param status [Symbol, Integer] HTTP status code (default: :unprocessable_content)
  # @param errors [Array<String>] Additional error messages (default: [])
  # @param suggestion [String, nil] An optional helpful suggestion for the user
  def render_error(message, status: :unprocessable_content, errors: [], suggestion: nil)
    response = { error: message }
    response[:errors] = errors if errors.present?
    response[:suggestion] = suggestion if suggestion.present?

    render json: response, status: status
  end

  # Renders validation errors from an ActiveRecord object
  #
  # @param record [ActiveRecord::Base] The record with validation errors
  # @param suggestion [String, nil] An optional helpful suggestion for the user
  # @param status [Symbol, Integer] HTTP status code (default: :unprocessable_content)
  def render_validation_errors(record, suggestion: nil, status: :unprocessable_content)
    error_messages = record.errors.full_messages
    main_message = error_messages.first || "Validation failed"

    response = {
      error: main_message,
      errors: error_messages
    }
    response[:suggestion] = suggestion if suggestion.present?

    render json: response, status: status
  end

  # Renders a not found error with a friendly message
  #
  # @param resource_name [String] The name of the resource that wasn't found
  # @param suggestion [String, nil] An optional helpful suggestion for the user
  def render_not_found(resource_name, suggestion: nil)
    message = "#{resource_name.to_s.humanize} not found"
    render_error(message, status: :not_found, suggestion: suggestion)
  end
end
