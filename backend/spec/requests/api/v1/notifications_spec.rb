# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Notifications" do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }

  describe "GET /api/v1/notifications" do
    context "when user is authenticated" do
      it "returns notifications for the current user" do
        notification = create(:notification, user: user)
        create(:notification, user: other_user) # should not be returned

        get "/api/v1/notifications", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["notifications"].length).to eq(1)
        expect(json_response["notifications"].first["id"]).to eq(notification.id)
      end

      it "returns notifications ordered by created_at desc" do
        old = create(:notification, user: user, created_at: 2.days.ago)
        new = create(:notification, user: user, created_at: 1.hour.ago)

        get "/api/v1/notifications", headers: auth_headers(user)

        ids = json_response["notifications"].pluck("id")
        expect(ids).to eq([new.id, old.id])
      end

      it "limits to 10 notifications by default" do
        15.times { create(:notification, user: user) }

        get "/api/v1/notifications", headers: auth_headers(user)

        expect(json_response["notifications"].length).to eq(10)
      end

      it "accepts a custom limit parameter" do
        15.times { create(:notification, user: user) }

        get "/api/v1/notifications", params: { limit: 5 }, headers: auth_headers(user)

        expect(json_response["notifications"].length).to eq(5)
      end

      it "returns unread count" do
        create(:notification, :unread, user: user)
        create(:notification, :unread, user: user)
        create(:notification, :read, user: user)

        get "/api/v1/notifications", headers: auth_headers(user)

        expect(json_response["unread_count"]).to eq(2)
      end

      it "returns notification with expected attributes" do
        notification = create(:notification, :with_link, user: user, title: "Test", body: "Test body")

        get "/api/v1/notifications", headers: auth_headers(user)

        returned = json_response["notifications"].first
        expect(returned).to include(
          "id" => notification.id,
          "title" => "Test",
          "body" => "Test body",
          "read" => false,
          "link" => "/dashboard",
          "notification_type" => "general"
        )
      end

      it "returns notification timestamps" do
        create(:notification, user: user)

        get "/api/v1/notifications", headers: auth_headers(user)

        expect(json_response["notifications"].first["created_at"]).to be_present
      end

      it "returns empty array when no notifications exist" do
        get "/api/v1/notifications", headers: auth_headers(user)

        expect(json_response["notifications"]).to eq([])
        expect(json_response["unread_count"]).to eq(0)
      end
    end

    context "when user is not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/notifications"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/notifications/:id/mark_as_read" do
    context "when user is authenticated" do
      context "with own notification" do
        let(:notification) { create(:notification, :unread, user: user) }

        it "marks the notification as read" do
          post "/api/v1/notifications/#{notification.id}/mark_as_read", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(notification.reload.read).to be true
        end

        it "returns the updated notification" do
          post "/api/v1/notifications/#{notification.id}/mark_as_read", headers: auth_headers(user)

          expect(json_response["notification"]["id"]).to eq(notification.id)
          expect(json_response["notification"]["read"]).to be true
        end

        it "does nothing if already read" do
          notification.update!(read: true)

          post "/api/v1/notifications/#{notification.id}/mark_as_read", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(notification.reload.read).to be true
        end
      end

      context "with another user's notification" do
        let(:notification) { create(:notification, user: other_user) }

        it "returns not found" do
          post "/api/v1/notifications/#{notification.id}/mark_as_read", headers: auth_headers(user)

          expect(response).to have_http_status(:not_found)
        end
      end

      context "with non-existent notification" do
        it "returns not found" do
          post "/api/v1/notifications/999999/mark_as_read", headers: auth_headers(user)

          expect(response).to have_http_status(:not_found)
        end
      end
    end

    context "when user is not authenticated" do
      it "returns unauthorized" do
        notification = create(:notification, user: user)

        post "/api/v1/notifications/#{notification.id}/mark_as_read"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/notifications/mark_all_as_read" do
    context "when user is authenticated" do
      it "marks all unread notifications as read" do
        n1 = create(:notification, :unread, user: user)
        n2 = create(:notification, :unread, user: user)
        n3 = create(:notification, :read, user: user)

        post "/api/v1/notifications/mark_all_as_read", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(n1.reload.read).to be true
        expect(n2.reload.read).to be true
        expect(n3.reload.read).to be true
      end

      it "returns success response" do
        create(:notification, :unread, user: user)

        post "/api/v1/notifications/mark_all_as_read", headers: auth_headers(user)

        expect(json_response["success"]).to be true
        expect(json_response["message"]).to eq("All notifications marked as read")
      end

      it "does not affect other users' notifications" do
        other_notification = create(:notification, :unread, user: other_user)
        create(:notification, :unread, user: user)

        post "/api/v1/notifications/mark_all_as_read", headers: auth_headers(user)

        expect(other_notification.reload.read).to be false
      end

      it "succeeds even with no unread notifications" do
        post "/api/v1/notifications/mark_all_as_read", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["success"]).to be true
      end
    end

    context "when user is not authenticated" do
      it "returns unauthorized" do
        post "/api/v1/notifications/mark_all_as_read"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  def json_response
    response.parsed_body
  end
end
