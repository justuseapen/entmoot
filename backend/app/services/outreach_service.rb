# frozen_string_literal: true

# Service for sending re-engagement outreach messages across multiple channels
# Implements channel cascade: push -> email -> SMS (based on user preferences)
class OutreachService
  # Outreach reasons and their default messages
  MESSAGE_TEMPLATES = {
    missed_checkin: {
      title: "Time for Your Morning Check-in",
      body: "Hi %<name>s! Don't forget to plan your day. A few minutes of morning planning sets you up for success.",
      link: "/planner"
    },
    missed_reflection: {
      title: "Take a Moment to Reflect",
      body: "Hi %<name>s! Before the day ends, take a moment to reflect. What went well today?",
      link: "/reflection"
    },
    inactive_3_days: {
      title: "We Miss You!",
      body: "Hi %<name>s! It's been a few days since you checked in. Your family's goals are waiting for you.",
      link: "/dashboard"
    },
    inactive_7_days: {
      title: "Your Adventure Awaits",
      body: "Hi %<name>s! A week has passed since your last visit. Ready to get back on track with your goals?",
      link: "/dashboard"
    },
    inactive_14_days: {
      title: "Let's Pick Up Where We Left Off",
      body: "Hi %<name>s! We noticed you've been away for a couple of weeks. Your family's journey is waiting.",
      link: "/dashboard"
    },
    inactive_30_days: {
      title: "Start Fresh Today",
      body: "Hi %<name>s! It's been a while! Starting fresh is always possible. We're here when you're ready.",
      link: "/dashboard"
    }
  }.freeze

  # SMS should be reserved for high-priority re-engagement (7+ days inactive)
  SMS_ELIGIBLE_TYPES = %w[inactive_7_days inactive_14_days inactive_30_days].freeze

  class << self
    # Send outreach to a user based on their channel preferences
    def send_outreach(user:, outreach_type:, family: nil)
      outreach_type = outreach_type.to_s
      return already_sent_result if OutreachHistory.already_sent_today?(user: user, outreach_type: outreach_type)
      return skipped_result(:no_template) unless MESSAGE_TEMPLATES.key?(outreach_type.to_sym)

      message = build_message(user, outreach_type, family)
      result = deliver_via_cascade(user, outreach_type, message, family)
      OutreachHistory.record!(user: user, outreach_type: outreach_type, channel: result[:channel]) if result[:success]
      result
    end

    # Send outreach to multiple candidates from ReengagementDetectionService
    def send_to_candidates(candidates)
      results = { sent: 0, skipped: 0, failed: 0, details: [] }
      candidates.each { |candidate| process_candidate_result(candidate, results) }
      results
    end

    private

    def process_candidate_result(candidate, results)
      result = send_outreach(user: candidate.user, outreach_type: candidate.reason,
                             family: candidate.user.families.first)
      update_results(results, result)
      results[:details] << { user_id: candidate.user.id, reason: candidate.reason, **result }
    end

    def update_results(results, result)
      if result[:success] then results[:sent] += 1
      elsif result[:skipped] then results[:skipped] += 1
      else results[:failed] += 1
      end
    end

    def already_sent_result
      { success: false, skipped: true, reason: :already_sent_today }
    end

    def skipped_result(reason)
      { success: false, skipped: true, reason: reason }
    end

    def build_message(user, outreach_type, family)
      template = MESSAGE_TEMPLATES[outreach_type.to_sym]
      link = family ? "/families/#{family.id}#{template[:link]}" : template[:link]
      { title: template[:title], body: format(template[:body], name: user.name), link: link }
    end

    # Deliver message via channel cascade: push -> email -> SMS
    def deliver_via_cascade(user, outreach_type, message, family)
      try_push(user, message) || try_email(user, message, family) || try_sms(user, outreach_type, message) ||
        { success: false, error: :no_available_channel }
    end

    def try_push(user, message)
      return nil unless user.notification_preference&.push && user.device_tokens.active.any?

      send_push(user, message)
    end

    def try_email(user, message, family)
      return nil unless user.notification_preference&.email

      send_email(user, message, family)
    end

    def try_sms(user, outreach_type, message)
      return nil unless can_send_sms?(user, outreach_type)

      send_sms(user, message)
    end

    def can_send_sms?(user, outreach_type)
      prefs = user.notification_preference
      prefs&.sms && user.phone_number.present? && user.phone_verified? && SMS_ELIGIBLE_TYPES.include?(outreach_type)
    end

    def send_push(user, message)
      PushNotificationService.new.send_to_user(user: user, title: message[:title], body: message[:body],
                                               link: message[:link])
      { success: true, channel: "push" }
    rescue StandardError => e
      Rails.logger.error("OutreachService: Push failed for user #{user.id}: #{e.message}")
      nil
    end

    def send_email(user, message, family)
      OutreachMailer.re_engagement(user, family, message).deliver_later
      { success: true, channel: "email" }
    rescue StandardError => e
      Rails.logger.error("OutreachService: Email failed for user #{user.id}: #{e.message}")
      nil
    end

    def send_sms(user, message)
      result = SmsService.new.send_to_user(user: user, body: "#{message[:title]}: #{message[:body]}")
      result[:success] ? { success: true, channel: "sms" } : nil
    rescue StandardError => e
      Rails.logger.error("OutreachService: SMS failed for user #{user.id}: #{e.message}")
      nil
    end
  end
end
