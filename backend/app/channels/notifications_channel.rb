# frozen_string_literal: true

class NotificationsChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
  end

  def unsubscribed
    stop_all_streams
  end

  # Class method to broadcast a notification to a specific user
  def self.broadcast_to_user(user, notification)
    broadcast_to(
      user,
      {
        type: "new_notification",
        notification: {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          read: notification.read,
          link: notification.link,
          notification_type: notification.notification_type,
          created_at: notification.created_at
        }
      }
    )
  end
end
