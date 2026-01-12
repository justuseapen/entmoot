# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Streaks" do
  let(:user) { create(:user) }
  let(:family) { create(:family, timezone: "America/New_York") }
  let(:today) { Time.zone.today }

  before do
    create(:family_membership, user: user, family: family, role: :admin)
  end

  describe "GET /api/v1/users/me/streaks" do
    context "when user is authenticated" do
      context "when no streaks exist yet" do
        it "creates and returns all three streak types" do
          expect do
            get "/api/v1/users/me/streaks", headers: auth_headers(user)
          end.to change(Streak, :count).by(3)

          expect(response).to have_http_status(:ok)
          expect(json_response["streaks"].length).to eq(3)
        end

        it "returns all streak types" do
          get "/api/v1/users/me/streaks", headers: auth_headers(user)

          streak_types = json_response["streaks"].pluck("streak_type")
          expect(streak_types).to contain_exactly("daily_planning", "evening_reflection", "weekly_review")
        end

        it "returns default values for new streaks" do
          get "/api/v1/users/me/streaks", headers: auth_headers(user)

          streak = json_response["streaks"].first
          expect(streak["current_count"]).to eq(0)
          expect(streak["longest_count"]).to eq(0)
          expect(streak["last_activity_date"]).to be_nil
        end
      end

      context "when streaks already exist" do
        before do
          create(:streak, :daily_planning, user: user, current_count: 5, longest_count: 10,
                                           last_activity_date: today - 1.day)
          create(:streak, :evening_reflection, user: user, current_count: 3, longest_count: 7,
                                               last_activity_date: today)
        end

        it "returns existing streaks without creating new ones for existing types" do
          expect do
            get "/api/v1/users/me/streaks", headers: auth_headers(user)
          end.to change(Streak, :count).by(1) # Only creates the missing weekly_review

          expect(response).to have_http_status(:ok)
        end

        it "returns the correct streak counts" do
          get "/api/v1/users/me/streaks", headers: auth_headers(user)

          daily = json_response["streaks"].find { |s| s["streak_type"] == "daily_planning" }
          expect(daily["current_count"]).to eq(5)
          expect(daily["longest_count"]).to eq(10)
        end

        it "includes last_activity_date" do
          get "/api/v1/users/me/streaks", headers: auth_headers(user)

          daily = json_response["streaks"].find { |s| s["streak_type"] == "daily_planning" }
          expect(daily["last_activity_date"]).to eq((today - 1.day).to_s)
        end
      end

      context "when checking at_risk status" do
        before do
          create(:streak, :daily_planning, user: user, current_count: 5,
                                           last_activity_date: today - 1.day)
          create(:streak, :evening_reflection, user: user, current_count: 3,
                                               last_activity_date: today)
        end

        it "marks streaks at risk correctly" do
          get "/api/v1/users/me/streaks", headers: auth_headers(user)

          daily = json_response["streaks"].find { |s| s["streak_type"] == "daily_planning" }
          evening = json_response["streaks"].find { |s| s["streak_type"] == "evening_reflection" }

          expect(daily["at_risk"]).to be true
          expect(evening["at_risk"]).to be false
        end

        it "marks zero count streaks as not at risk" do
          create(:streak, :weekly_review, user: user, current_count: 0, last_activity_date: nil)

          get "/api/v1/users/me/streaks", headers: auth_headers(user)

          weekly = json_response["streaks"].find { |s| s["streak_type"] == "weekly_review" }
          expect(weekly["at_risk"]).to be false
        end
      end

      context "when checking next_milestone" do
        before do
          create(:streak, :daily_planning, user: user, current_count: 5)
          create(:streak, :evening_reflection, user: user, current_count: 7)
          create(:streak, :weekly_review, user: user, current_count: 30)
        end

        it "returns the next milestone for each streak" do
          get "/api/v1/users/me/streaks", headers: auth_headers(user)

          daily = json_response["streaks"].find { |s| s["streak_type"] == "daily_planning" }
          evening = json_response["streaks"].find { |s| s["streak_type"] == "evening_reflection" }
          weekly = json_response["streaks"].find { |s| s["streak_type"] == "weekly_review" }

          expect(daily["next_milestone"]).to eq(7)
          expect(evening["next_milestone"]).to eq(14)
          expect(weekly["next_milestone"]).to eq(60)
        end
      end

      context "when broken streaks exist" do
        before do
          create(:streak, :daily_planning, user: user, current_count: 5, longest_count: 10,
                                           last_activity_date: today - 3.days)
        end

        it "resets broken streaks" do
          get "/api/v1/users/me/streaks", headers: auth_headers(user)

          daily = json_response["streaks"].find { |s| s["streak_type"] == "daily_planning" }
          expect(daily["current_count"]).to eq(0)
        end

        it "preserves longest_count when resetting" do
          get "/api/v1/users/me/streaks", headers: auth_headers(user)

          daily = json_response["streaks"].find { |s| s["streak_type"] == "daily_planning" }
          expect(daily["longest_count"]).to eq(10)
        end
      end

      context "when verifying response structure" do
        before do
          create(:streak, :daily_planning, user: user, current_count: 5, longest_count: 10,
                                           last_activity_date: today)
        end

        it "includes all expected fields" do
          get "/api/v1/users/me/streaks", headers: auth_headers(user)

          streak = json_response["streaks"].first
          expect(streak).to include(
            "id", "streak_type", "current_count", "longest_count",
            "last_activity_date", "at_risk", "next_milestone",
            "created_at", "updated_at"
          )
        end
      end
    end

    context "when user is not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/users/me/streaks"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  def json_response
    response.parsed_body
  end
end
