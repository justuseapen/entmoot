# frozen_string_literal: true

require "net/http"
require "uri"
require "json"

# Service for sending push notifications via Firebase Cloud Messaging (FCM) HTTP v1 API
# Handles iOS (APNs), Android, and web push notifications
class PushNotificationService
  FCM_ENDPOINT = "https://fcm.googleapis.com/v1/projects/%<project_id>s/messages:send"
  TOKEN_SCOPE = "https://www.googleapis.com/auth/firebase.messaging"

  # Error types for invalid tokens that should be cleaned up
  INVALID_TOKEN_ERRORS = %w[UNREGISTERED INVALID_ARGUMENT NOT_FOUND].freeze

  class Error < StandardError; end
  class ConfigurationError < Error; end
  class DeliveryError < Error; end

  def initialize
    @credentials = load_credentials
    @project_id = Rails.application.credentials.dig(:firebase, :project_id)
    validate_configuration!
  end

  # Send push notification to a specific user
  def send_to_user(user:, title:, body:, data: {}, link: nil)
    device_tokens = user.device_tokens.active
    return { sent: 0, failed: 0 } if device_tokens.empty?

    notification = { title: title, body: body, data: data, link: link }
    results = process_user_tokens(device_tokens, notification)
    cleanup_invalid_tokens(results[:invalid_tokens]) if results[:invalid_tokens].any?
    results
  end

  # Send push notification to a specific device token
  def send_to_token(token:, title:, body:, data: {}, platform: "android")
    message = build_message(token: token, title: title, body: body, data: data, platform: platform)
    send_message(message)
  rescue StandardError => e
    Rails.logger.error("PushNotificationService: Failed to send notification - #{e.message}")
    { success: false, error: e.message }
  end

  # Send push notification to multiple users (batch)
  def send_to_users(users:, title:, body:, data: {}, link: nil)
    results = { total_sent: 0, total_failed: 0, user_results: [] }
    notification = { title: title, body: body, data: data, link: link }
    users.find_each { |user| aggregate_results(results, user, notification) }
    results
  end

  private

  def process_user_tokens(device_tokens, notification)
    results = { sent: 0, failed: 0, invalid_tokens: [] }
    device_tokens.find_each { |device_token| process_single_token(device_token, notification, results) }
    results
  end

  def process_single_token(device_token, notification, results)
    result = send_to_token(
      token: device_token.token, title: notification[:title], body: notification[:body],
      data: notification[:data].merge(link: notification[:link]).compact, platform: device_token.platform
    )
    update_results(results, device_token, result)
  end

  def update_results(results, device_token, result)
    if result[:success]
      results[:sent] += 1
      device_token.touch_last_used!
    else
      results[:failed] += 1
      results[:invalid_tokens] << device_token.id if result[:invalid_token]
    end
  end

  def aggregate_results(results, user, notification)
    user_result = send_to_user(user: user, **notification)
    results[:total_sent] += user_result[:sent]
    results[:total_failed] += user_result[:failed]
    results[:user_results] << { user_id: user.id, **user_result }
  end

  def load_credentials
    credentials_json = Rails.application.credentials.dig(:firebase, :service_account)
    return if credentials_json.blank?

    Google::Auth::ServiceAccountCredentials.make_creds(
      json_key_io: StringIO.new(credentials_json.to_json), scope: TOKEN_SCOPE
    )
  end

  def validate_configuration!
    return unless Rails.env.production?

    raise ConfigurationError, "Firebase project_id not configured" if @project_id.blank?
    raise ConfigurationError, "Firebase service account not configured" if @credentials.nil?
  end

  def access_token
    return "test_token" unless Rails.env.production?

    @credentials.fetch_access_token!["access_token"]
  end

  def fcm_url
    format(FCM_ENDPOINT, project_id: @project_id)
  end

  def build_message(token:, title:, body:, data: {}, platform: "android")
    message = base_message(token, title, body, data)
    add_platform_config(message, platform)
    message
  end

  def base_message(token, title, body, data)
    { message: { token: token, notification: { title: title, body: body }, data: stringify_data(data) } }
  end

  def add_platform_config(message, platform)
    case platform
    when "ios" then message[:message][:apns] = ios_config
    when "android" then message[:message][:android] = android_config
    end
  end

  def ios_config
    { payload: { aps: { sound: "default", badge: 1 } } }
  end

  def android_config
    { priority: "high", notification: { sound: "default", channel_id: "default" } }
  end

  def stringify_data(data)
    data.transform_values(&:to_s)
  end

  def send_message(message)
    return dev_response(message) unless Rails.env.production?

    response = execute_http_request(message)
    handle_response(response)
  end

  def dev_response(message)
    Rails.logger.info("PushNotificationService: Would send message: #{message.to_json}")
    { success: true, message_id: "test_#{SecureRandom.hex(8)}" }
  end

  def execute_http_request(message)
    uri = URI.parse(fcm_url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.request(build_request(uri, message))
  end

  def build_request(uri, message)
    request = Net::HTTP::Post.new(uri.request_uri)
    request["Authorization"] = "Bearer #{access_token}"
    request["Content-Type"] = "application/json"
    request.body = message.to_json
    request
  end

  def handle_response(response)
    body = JSON.parse(response.body)
    parse_response_code(response.code.to_i, body)
  rescue JSON::ParserError
    { success: false, error: "Invalid response from FCM" }
  end

  def parse_response_code(code, body)
    case code
    when 200 then { success: true, message_id: body["name"] }
    when 400, 404 then error_response(body)
    else { success: false, error: body.dig("error", "message") || "Unknown error" }
    end
  end

  def error_response(body)
    error_code = body.dig("error", "details", 0, "errorCode")
    { success: false, error: body.dig("error", "message"), invalid_token: INVALID_TOKEN_ERRORS.include?(error_code) }
  end

  def cleanup_invalid_tokens(token_ids)
    return if token_ids.empty?

    DeviceToken.where(id: token_ids).destroy_all
    Rails.logger.info("PushNotificationService: Cleaned up #{token_ids.count} invalid device tokens")
  end
end
