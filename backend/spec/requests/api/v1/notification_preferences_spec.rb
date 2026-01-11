# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::NotificationPreferences" do
  let(:user) { create(:user) }

  describe "GET /api/v1/users/me/notification_preferences" do
    context "when user is authenticated" do
      context "when no preferences exist yet" do
        it "creates and returns default preferences" do
          expect do
            get "/api/v1/users/me/notification_preferences", headers: auth_headers(user)
          end.to change(NotificationPreference, :count).by(1)

          expect(response).to have_http_status(:ok)
          expect(json_response["notification_preferences"]).to be_present
        end

        it "returns default channel preferences" do
          get "/api/v1/users/me/notification_preferences", headers: auth_headers(user)

          channels = json_response["notification_preferences"]["channels"]
          expect(channels["in_app"]).to be true
          expect(channels["email"]).to be true
          expect(channels["push"]).to be false
        end

        it "returns default morning_planning preferences" do
          get "/api/v1/users/me/notification_preferences", headers: auth_headers(user)

          reminders = json_response["notification_preferences"]["reminders"]
          expect(reminders["morning_planning"]["enabled"]).to be true
          expect(reminders["morning_planning"]["time"]).to eq("07:00")
        end

        it "returns default evening_reflection preferences" do
          get "/api/v1/users/me/notification_preferences", headers: auth_headers(user)

          reminders = json_response["notification_preferences"]["reminders"]
          expect(reminders["evening_reflection"]["enabled"]).to be true
          expect(reminders["evening_reflection"]["time"]).to eq("20:00")
        end

        it "returns default weekly_review preferences" do
          get "/api/v1/users/me/notification_preferences", headers: auth_headers(user)

          reminders = json_response["notification_preferences"]["reminders"]
          expect(reminders["weekly_review"]["enabled"]).to be true
          expect(reminders["weekly_review"]["time"]).to eq("18:00")
          expect(reminders["weekly_review"]["day"]).to eq(0)
        end

        it "returns default quiet hours" do
          get "/api/v1/users/me/notification_preferences", headers: auth_headers(user)

          quiet_hours = json_response["notification_preferences"]["quiet_hours"]
          expect(quiet_hours["start"]).to eq("22:00")
          expect(quiet_hours["end"]).to eq("07:00")
        end
      end

      context "when preferences already exist" do
        before { create(:notification_preference, :custom_times, user: user) }

        it "returns existing preferences without creating new ones" do
          expect do
            get "/api/v1/users/me/notification_preferences", headers: auth_headers(user)
          end.not_to change(NotificationPreference, :count)

          expect(response).to have_http_status(:ok)
        end

        it "returns the custom times" do
          get "/api/v1/users/me/notification_preferences", headers: auth_headers(user)

          reminders = json_response["notification_preferences"]["reminders"]
          expect(reminders["morning_planning"]["time"]).to eq("06:30")
          expect(reminders["evening_reflection"]["time"]).to eq("21:30")
          expect(reminders["weekly_review"]["time"]).to eq("17:00")
          expect(reminders["weekly_review"]["day"]).to eq(1)
        end

        it "includes timestamps" do
          get "/api/v1/users/me/notification_preferences", headers: auth_headers(user)

          expect(json_response["notification_preferences"]).to include("created_at", "updated_at")
        end
      end
    end

    context "when user is not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/users/me/notification_preferences"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "PATCH /api/v1/users/me/notification_preferences" do
    context "when user is authenticated" do
      context "when updating channel preferences" do
        it "updates in_app preference" do
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: { in_app: false } },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["notification_preferences"]["channels"]["in_app"]).to be false
        end

        it "updates email preference" do
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: { email: false } },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["notification_preferences"]["channels"]["email"]).to be false
        end

        it "updates push preference" do
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: { push: true } },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["notification_preferences"]["channels"]["push"]).to be true
        end

        it "updates all channel preferences at once" do
          params = { in_app: false, email: false, push: true }
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: params },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          channels = json_response["notification_preferences"]["channels"]
          expect(channels).to eq("in_app" => false, "email" => false, "push" => true)
        end
      end

      context "when updating reminder preferences" do
        it "updates morning_planning enabled status" do
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: { morning_planning: false } },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          reminders = json_response["notification_preferences"]["reminders"]
          expect(reminders["morning_planning"]["enabled"]).to be false
        end

        it "updates morning_planning time" do
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: { morning_planning_time: "06:00" } },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          reminders = json_response["notification_preferences"]["reminders"]
          expect(reminders["morning_planning"]["time"]).to eq("06:00")
        end

        it "updates evening_reflection preferences" do
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: { evening_reflection: false, evening_reflection_time: "21:00" } },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          reminders = json_response["notification_preferences"]["reminders"]
          expect(reminders["evening_reflection"]["enabled"]).to be false
          expect(reminders["evening_reflection"]["time"]).to eq("21:00")
        end

        it "updates weekly_review preferences including day" do
          params = { weekly_review: false, weekly_review_time: "17:00", weekly_review_day: 1 }
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: params },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          reminders = json_response["notification_preferences"]["reminders"]
          expect(reminders["weekly_review"]["enabled"]).to be false
          expect(reminders["weekly_review"]["time"]).to eq("17:00")
          expect(reminders["weekly_review"]["day"]).to eq(1)
        end
      end

      context "when updating quiet hours" do
        it "updates quiet_hours_start" do
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: { quiet_hours_start: "23:00" } },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          quiet_hours = json_response["notification_preferences"]["quiet_hours"]
          expect(quiet_hours["start"]).to eq("23:00")
        end

        it "updates quiet_hours_end" do
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: { quiet_hours_end: "08:00" } },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          quiet_hours = json_response["notification_preferences"]["quiet_hours"]
          expect(quiet_hours["end"]).to eq("08:00")
        end

        it "updates both quiet hours at once" do
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: { quiet_hours_start: "21:00", quiet_hours_end: "06:00" } },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          quiet_hours = json_response["notification_preferences"]["quiet_hours"]
          expect(quiet_hours).to eq("start" => "21:00", "end" => "06:00")
        end
      end

      context "when updating with existing preferences" do
        before { create(:notification_preference, user: user, in_app: true, push: false) }

        it "updates only the specified fields" do
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: { push: true } },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          channels = json_response["notification_preferences"]["channels"]
          expect(channels["in_app"]).to be true # unchanged
          expect(channels["push"]).to be true # updated
        end
      end

      context "with invalid data" do
        it "returns error for invalid time format" do
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: { morning_planning_time: "invalid" } },
                headers: auth_headers(user)

          expect(response).to have_http_status(:unprocessable_content)
          expect(json_response["errors"]).to include(
            "Morning planning time must be in HH:MM format (00:00-23:59)"
          )
        end

        it "returns error for invalid weekly_review_day" do
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: { weekly_review_day: 7 } },
                headers: auth_headers(user)

          expect(response).to have_http_status(:unprocessable_content)
        end

        it "returns error for time outside valid range" do
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: { evening_reflection_time: "25:00" } },
                headers: auth_headers(user)

          expect(response).to have_http_status(:unprocessable_content)
        end
      end

      context "when updating multiple preference types at once" do
        it "updates channel preferences in batch" do
          params = { in_app: false, push: true }
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: params },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          prefs = json_response["notification_preferences"]
          expect(prefs["channels"]["in_app"]).to be false
          expect(prefs["channels"]["push"]).to be true
        end

        it "updates reminder preferences in batch" do
          params = { morning_planning: false, morning_planning_time: "06:00" }
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: params },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          prefs = json_response["notification_preferences"]
          expect(prefs["reminders"]["morning_planning"]["enabled"]).to be false
          expect(prefs["reminders"]["morning_planning"]["time"]).to eq("06:00")
        end

        it "updates quiet hours alongside other preferences" do
          params = { in_app: false, quiet_hours_start: "21:00" }
          patch "/api/v1/users/me/notification_preferences",
                params: { notification_preferences: params },
                headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          prefs = json_response["notification_preferences"]
          expect(prefs["channels"]["in_app"]).to be false
          expect(prefs["quiet_hours"]["start"]).to eq("21:00")
        end
      end
    end

    context "when user is not authenticated" do
      it "returns unauthorized" do
        patch "/api/v1/users/me/notification_preferences",
              params: { notification_preferences: { in_app: false } }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  def json_response
    response.parsed_body
  end
end
