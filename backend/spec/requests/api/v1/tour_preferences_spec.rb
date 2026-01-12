# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::TourPreferences" do
  include AuthHelpers

  let(:user) { create(:user) }

  describe "GET /api/v1/users/me/tour_preferences" do
    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/users/me/tour_preferences"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated" do
      it "returns tour preferences for new user" do
        get "/api/v1/users/me/tour_preferences", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["tour_preferences"]["tour_completed_at"]).to be_nil
        expect(json_response["tour_preferences"]["tour_dismissed_at"]).to be_nil
        expect(json_response["tour_preferences"]["should_show_tour"]).to be true
        expect(json_response["tour_preferences"]["can_restart_tour"]).to be false
      end

      it "returns should_show_tour false when tour is completed" do
        user.update!(tour_completed_at: 1.day.ago)

        get "/api/v1/users/me/tour_preferences", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["tour_preferences"]["should_show_tour"]).to be false
        expect(json_response["tour_preferences"]["can_restart_tour"]).to be true
      end

      it "returns should_show_tour false when tour was recently dismissed" do
        user.update!(tour_dismissed_at: 1.hour.ago)

        get "/api/v1/users/me/tour_preferences", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["tour_preferences"]["should_show_tour"]).to be false
      end

      it "returns should_show_tour true when tour was dismissed more than 24 hours ago" do
        user.update!(tour_dismissed_at: 25.hours.ago)

        get "/api/v1/users/me/tour_preferences", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["tour_preferences"]["should_show_tour"]).to be true
      end
    end
  end

  describe "POST /api/v1/users/me/tour_preferences/complete" do
    context "when not authenticated" do
      it "returns unauthorized" do
        post "/api/v1/users/me/tour_preferences/complete"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated" do
      it "marks the tour as completed" do
        freeze_time do
          post "/api/v1/users/me/tour_preferences/complete", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["message"]).to eq("Tour completed")
          expect(user.reload.tour_completed_at).to be_within(1.second).of(Time.current)
        end
      end

      it "returns updated preferences" do
        post "/api/v1/users/me/tour_preferences/complete", headers: auth_headers(user)

        expect(json_response["tour_preferences"]["should_show_tour"]).to be false
        expect(json_response["tour_preferences"]["can_restart_tour"]).to be true
      end
    end
  end

  describe "POST /api/v1/users/me/tour_preferences/dismiss" do
    context "when not authenticated" do
      it "returns unauthorized" do
        post "/api/v1/users/me/tour_preferences/dismiss"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated" do
      it "marks the tour as dismissed" do
        freeze_time do
          post "/api/v1/users/me/tour_preferences/dismiss", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(json_response["message"]).to eq("Tour dismissed")
          expect(user.reload.tour_dismissed_at).to be_within(1.second).of(Time.current)
        end
      end

      it "returns updated preferences with should_show_tour false" do
        post "/api/v1/users/me/tour_preferences/dismiss", headers: auth_headers(user)

        expect(json_response["tour_preferences"]["should_show_tour"]).to be false
      end
    end
  end

  describe "POST /api/v1/users/me/tour_preferences/restart" do
    context "when not authenticated" do
      it "returns unauthorized" do
        post "/api/v1/users/me/tour_preferences/restart"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated" do
      it "resets tour preferences for a user who completed the tour" do
        user.update!(tour_completed_at: 1.week.ago)

        post "/api/v1/users/me/tour_preferences/restart", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Tour reset")
        expect(user.reload.tour_completed_at).to be_nil
        expect(user.tour_dismissed_at).to be_nil
      end

      it "returns updated preferences with should_show_tour true" do
        user.update!(tour_completed_at: 1.week.ago)

        post "/api/v1/users/me/tour_preferences/restart", headers: auth_headers(user)

        expect(json_response["tour_preferences"]["should_show_tour"]).to be true
        expect(json_response["tour_preferences"]["can_restart_tour"]).to be false
      end

      it "also clears dismissed_at if set" do
        user.update!(tour_dismissed_at: 1.hour.ago)

        post "/api/v1/users/me/tour_preferences/restart", headers: auth_headers(user)

        expect(user.reload.tour_dismissed_at).to be_nil
      end
    end
  end

  private

  def json_response
    response.parsed_body
  end
end
