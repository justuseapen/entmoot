# frozen_string_literal: true

# Service for sending SMS notifications via Twilio
# Handles message delivery and rate limiting
class SmsService
  # E.164 phone number format validation
  E164_FORMAT = /\A\+[1-9]\d{1,14}\z/

  # Rate limiting: max SMS per day per user
  MAX_SMS_PER_DAY = 5

  class Error < StandardError; end
  class ConfigurationError < Error; end
  class DeliveryError < Error; end
  class RateLimitError < Error; end
  class InvalidPhoneError < Error; end

  def initialize
    @account_sid = Rails.application.credentials.dig(:twilio, :account_sid)
    @auth_token = Rails.application.credentials.dig(:twilio, :auth_token)
    @messaging_service_sid = Rails.application.credentials.dig(:twilio, :messaging_service_sid)
    @from_number = Rails.application.credentials.dig(:twilio, :from_number)
    validate_configuration!
  end

  # Send SMS to a specific phone number
  # @param to [String] E.164 formatted phone number
  # @param body [String] Message content
  # @param user [User, nil] Optional user for rate limiting
  # @return [Hash] Result with success status and message_sid or error
  def send_message(to:, body:, user: nil)
    validate_phone_number!(to)
    check_rate_limit!(user) if user

    result = deliver_message(to: to, body: body)
    record_send(user) if user && result[:success]
    result
  rescue RateLimitError, InvalidPhoneError => e
    { success: false, error: e.message }
  rescue StandardError => e
    Rails.logger.error("SmsService: Failed to send SMS - #{e.message}")
    { success: false, error: e.message }
  end

  # Send SMS to a user using their stored phone number
  # @param user [User] User with phone_number set
  # @param body [String] Message content
  # @return [Hash] Result with success status
  def send_to_user(user:, body:)
    return { success: false, error: "User has no verified phone number" } unless user_has_verified_phone?(user)
    return { success: false, error: "User has opted out of SMS" } if user_opted_out?(user)

    send_message(to: user.phone_number, body: body, user: user)
  end

  # Check if a phone number is valid E.164 format
  # @param phone [String] Phone number to validate
  # @return [Boolean]
  def self.valid_phone_number?(phone)
    return false if phone.blank?

    phone.match?(E164_FORMAT)
  end

  # Check current SMS count for rate limiting
  # @param user [User]
  # @return [Integer] Number of SMS sent today
  def sms_count_today(user)
    return 0 unless user

    user_sms_key = sms_rate_key(user)
    count = Rails.cache.read(user_sms_key)
    count.to_i
  end

  # Check remaining SMS quota for the day
  # @param user [User]
  # @return [Integer]
  def remaining_sms_quota(user)
    MAX_SMS_PER_DAY - sms_count_today(user)
  end

  private

  def validate_configuration!
    return unless Rails.env.production?

    raise ConfigurationError, "Twilio account_sid not configured" if @account_sid.blank?
    raise ConfigurationError, "Twilio auth_token not configured" if @auth_token.blank?

    return unless @messaging_service_sid.blank? && @from_number.blank?

    raise ConfigurationError,
          "Twilio messaging_service_sid or from_number required"
  end

  def validate_phone_number!(phone)
    raise InvalidPhoneError, "Phone number is required" if phone.blank?

    return if self.class.valid_phone_number?(phone)

    raise InvalidPhoneError,
          "Invalid phone number format. Must be E.164 format (e.g., +14155551234)"
  end

  def check_rate_limit!(user)
    return unless user

    current_count = sms_count_today(user)
    return unless current_count >= MAX_SMS_PER_DAY

    raise RateLimitError, "SMS rate limit exceeded. Maximum #{MAX_SMS_PER_DAY} messages per day."
  end

  def record_send(user)
    user_sms_key = sms_rate_key(user)
    current_count = Rails.cache.read(user_sms_key).to_i

    # Set count with expiry at midnight (end of day)
    seconds_until_midnight = Time.current.end_of_day - Time.current
    Rails.cache.write(user_sms_key, current_count + 1, expires_in: seconds_until_midnight)
  end

  def sms_rate_key(user)
    "sms_rate_limit:#{user.id}:#{Date.current}"
  end

  def user_has_verified_phone?(user)
    user.phone_number.present? && user.phone_verified?
  end

  def user_opted_out?(user)
    # Check notification preferences for SMS opt-out
    prefs = user.notification_preference
    return false unless prefs

    prefs.respond_to?(:sms) && !prefs.sms
  end

  def deliver_message(to:, body:)
    return dev_response(to, body) unless Rails.env.production?

    message = twilio_client.messages.create(
      **build_message_params(to, body)
    )

    { success: true, message_sid: message.sid }
  rescue Twilio::REST::RestException => e
    handle_twilio_error(e)
  end

  def build_message_params(to, body)
    params = { to: to, body: body }

    # Use Messaging Service if configured, otherwise use from number
    if @messaging_service_sid.present?
      params[:messaging_service_sid] = @messaging_service_sid
    else
      params[:from] = @from_number
    end

    params
  end

  def twilio_client
    @twilio_client ||= Twilio::REST::Client.new(@account_sid, @auth_token)
  end

  def dev_response(to, body)
    Rails.logger.info("SmsService: Would send SMS to #{to}: #{body}")
    { success: true, message_sid: "test_#{SecureRandom.hex(8)}" }
  end

  def handle_twilio_error(error)
    error_message = error.message
    error_code = error.code

    Rails.logger.error("SmsService: Twilio error #{error_code}: #{error_message}")

    # Check for specific error codes that indicate phone number issues
    invalid_number_codes = [21_211, 21_614, 21_608, 21_610] # Invalid, unsubscribed, blocked, etc.
    if invalid_number_codes.include?(error_code)
      { success: false, error: "Invalid or undeliverable phone number", invalid_number: true }
    else
      { success: false, error: error_message }
    end
  end
end
