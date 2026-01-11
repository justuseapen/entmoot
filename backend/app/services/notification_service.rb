# frozen_string_literal: true

class NotificationService
  def self.create_and_broadcast(user:, title:, body: nil, link: nil, notification_type: :general)
    notification = user.notifications.create!(
      title: title,
      body: body,
      link: link,
      notification_type: notification_type
    )

    NotificationsChannel.broadcast_to_user(user, notification)

    notification
  end

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

  private_class_method def self.reminder_content(reminder_type)
    case reminder_type.to_sym
    when :morning_planning
      ["Time for Morning Planning", "Start your day with intention. What are your top priorities?", "/planner"]
    when :evening_reflection
      ["Evening Reflection", "Take a moment to reflect on your day.", "/reflection"]
    when :weekly_review
      ["Weekly Review", "It's time for your weekly review. Celebrate wins and plan ahead!", "/weekly-review"]
    else
      ["Reminder", "You have a reminder", nil]
    end
  end
end
