# frozen_string_literal: true

module Api
  module V1
    class NotificationsController < BaseController
      def index
        notifications = current_user.notifications.order(created_at: :desc).limit(params[:limit] || 10)
        unread_count = current_user.notifications.unread.count

        render json: {
          notifications: notifications.map { |n| notification_json(n) },
          unread_count: unread_count
        }
      end

      def mark_as_read
        notification = current_user.notifications.find(params[:id])
        notification.mark_as_read!

        render json: { notification: notification_json(notification) }
      end

      def mark_all_as_read
        current_user.notifications.unread.update_all(read: true) # rubocop:disable Rails/SkipsModelValidations

        render json: { success: true, message: "All notifications marked as read" }
      end

      private

      def notification_json(notification)
        {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          read: notification.read,
          link: notification.link,
          notification_type: notification.notification_type,
          created_at: notification.created_at
        }
      end
    end
  end
end
