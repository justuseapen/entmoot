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

  def self.notify_mention(mention:)
    create_and_broadcast(
      user: mention.mentioned_user,
      title: "#{mention.user.name} mentioned you",
      body: "#{mention.user.name} mentioned you #{mentionable_context(mention.mentionable)}",
      link: mention_notification_link(mention.mentionable),
      notification_type: :mention
    )
  end

  def self.mentionable_context(mentionable)
    return goal_context(mentionable) if mentionable.is_a?(Goal)
    return daily_plan_context(mentionable) if mentionable.is_a?(DailyPlan)

    STATIC_MENTIONABLE_CONTEXTS.fetch(mentionable.class.name, "in a post")
  end
  private_class_method :mentionable_context

  STATIC_MENTIONABLE_CONTEXTS = {
    "TopPriority" => "in a top priority",
    "WeeklyReview" => "in their weekly review",
    "MonthlyReview" => "in their monthly review",
    "QuarterlyReview" => "in their quarterly review",
    "AnnualReview" => "in their annual review"
  }.freeze

  def self.goal_context(goal)
    "in goal: #{goal.title}"
  end
  private_class_method :goal_context

  def self.daily_plan_context(daily_plan)
    "in their daily plan for #{daily_plan.date.strftime("%B %-d")}"
  end
  private_class_method :daily_plan_context

  def self.mention_notification_link(mentionable)
    family_id = mentionable_family_id(mentionable)
    return nil unless family_id

    mentionable_link_path(mentionable, family_id)
  end
  private_class_method :mention_notification_link

  def self.mentionable_link_path(mentionable, family_id)
    case mentionable
    when Goal then "/families/#{family_id}/goals/#{mentionable.id}"
    when DailyPlan then "/planner?date=#{mentionable.date}"
    when TopPriority then "/planner?date=#{mentionable.daily_plan.date}"
    else review_link_path(mentionable)
    end
  end
  private_class_method :mentionable_link_path

  def self.review_link_path(review)
    case review
    when WeeklyReview then "/weekly-review?date=#{review.week_start_date}"
    when MonthlyReview then "/monthly-review?date=#{review.month}"
    when QuarterlyReview then "/quarterly-review?date=#{review.quarter_start_date}"
    when AnnualReview then "/annual-review?year=#{review.year}"
    end
  end
  private_class_method :review_link_path

  def self.mentionable_family_id(mentionable)
    return mentionable.daily_plan&.family_id if mentionable.is_a?(TopPriority)

    mentionable.family_id if mentionable.respond_to?(:family_id)
  end
  private_class_method :mentionable_family_id

  def self.reminder_content(reminder_type)
    REMINDER_CONTENT.fetch(reminder_type.to_sym, DEFAULT_REMINDER_CONTENT)
  end
  private_class_method :reminder_content
end
