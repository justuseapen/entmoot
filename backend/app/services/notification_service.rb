# frozen_string_literal: true

class NotificationService
  REMINDER_CONTENT = {
    morning_planning: ["Time for Morning Planning", "Start your day with intention. What are your top priorities?",
                       "/planner"],
    evening_reflection: ["Evening Reflection", "Take a moment to reflect on your day.", "/reflection"],
    weekly_review: ["Weekly Review", "It's time for your weekly review. Celebrate wins and plan ahead!",
                    "/weekly-review"],
    monthly_review: ["Monthly Review Time", "Reflect on your month and plan ahead for next month!", "/monthly-review"],
    quarterly_review: ["Quarterly Review Time", "Assess your quarterly progress and set objectives!",
                       "/quarterly-review"],
    annual_review: ["Annual Review Time", "Reflect on your year and set intentions for the new year!", "/annual-review"]
  }.freeze

  DEFAULT_REMINDER_CONTENT = ["Reminder", "You have a reminder", nil].freeze

  def self.create_and_broadcast(user:, title:, body: nil, link: nil, notification_type: :general)
    notification = user.notifications.create!(
      title: title,
      body: body,
      link: link,
      notification_type: notification_type
    )

    # Broadcast via WebSocket
    NotificationsChannel.broadcast_to_user(user, notification)

    # Send push notification if user has push enabled
    send_push_notification(user: user, title: title, body: body, link: link)

    notification
  end

  def self.send_push_notification(user:, title:, body:, link: nil)
    return unless can_send_push?(user)

    PushNotificationService.new.send_to_user(user: user, title: title, body: body, link: link)
  rescue StandardError => e
    Rails.logger.error("Failed to send push notification: #{e.message}")
  end

  def self.can_send_push?(user)
    preferences = user.notification_preference
    return false unless preferences&.push && user.device_tokens.active.any?

    timezone = user.families.first&.timezone || "UTC"
    current_time = Time.current.in_time_zone(timezone)
    !preferences.within_quiet_hours?(current_time)
  end
  private_class_method :can_send_push?

  def self.notify_reminder(user:, reminder_type:)
    title, body, link = reminder_content(reminder_type)

    create_and_broadcast(
      user: user,
      title: title,
      body: body,
      link: link,
      notification_type: :reminder
    )
  end

  def self.notify_badge_earned(user:, badge_name:)
    create_and_broadcast(
      user: user,
      title: "Badge Earned!",
      body: "You've earned the #{badge_name} badge. Congratulations!",
      notification_type: :badge_earned
    )
  end

  def self.notify_streak_milestone(user:, streak_type:, count:)
    create_and_broadcast(
      user: user,
      title: "Streak Milestone!",
      body: "Amazing! You've maintained a #{count}-day #{streak_type.humanize.downcase} streak!",
      notification_type: :streak_milestone
    )
  end

  def self.notify_goal_update(user:, goal:, message:)
    create_and_broadcast(
      user: user,
      title: "Goal Update",
      body: message,
      link: "/families/#{goal.family_id}/goals/#{goal.id}",
      notification_type: :goal_update
    )
  end

  def self.notify_family_invite(user:, family:, inviter:)
    create_and_broadcast(
      user: user,
      title: "Family Invitation",
      body: "#{inviter.name} invited you to join #{family.name}",
      notification_type: :family_invite
    )
  end

  def self.reminder_content(reminder_type)
    REMINDER_CONTENT.fetch(reminder_type.to_sym, DEFAULT_REMINDER_CONTENT)
  end
  private_class_method :reminder_content
end
