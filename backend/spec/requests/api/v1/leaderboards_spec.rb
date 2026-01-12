# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Leaderboards" do
  let(:family) { create(:family) }
  let(:admin_user) { create(:user, name: "Admin") }
  let(:member_user) { create(:user, name: "Member") }
  let(:non_member) { create(:user, name: "NonMember") }

  before do
    create(:family_membership, family: family, user: admin_user, role: :admin)
    create(:family_membership, family: family, user: member_user, role: :adult)
  end

  describe "GET /api/v1/families/:family_id/leaderboard" do
    context "when authenticated as a family member" do
      it "returns the leaderboard with all_time scope by default" do
        create(:points_ledger_entry, user: admin_user, points: 100, activity_type: "complete_task")
        create(:points_ledger_entry, user: member_user, points: 50, activity_type: "complete_task")

        get "/api/v1/families/#{family.id}/leaderboard", headers: auth_headers(admin_user)

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        expect(json["leaderboard"]["scope"]).to eq("all_time")
        expect(json["leaderboard"]["entries"].size).to eq(2)
      end

      it "returns entries sorted by points descending" do
        create(:points_ledger_entry, user: admin_user, points: 50, activity_type: "complete_task")
        create(:points_ledger_entry, user: member_user, points: 100, activity_type: "complete_task")

        get "/api/v1/families/#{family.id}/leaderboard", headers: auth_headers(admin_user)

        entries = response.parsed_body["leaderboard"]["entries"]
        expect(entries[0]["name"]).to eq("Member")
        expect(entries[0]["points"]).to eq(100)
        expect(entries[0]["rank"]).to eq(1)
        expect(entries[1]["name"]).to eq("Admin")
        expect(entries[1]["points"]).to eq(50)
        expect(entries[1]["rank"]).to eq(2)
      end

      it "returns weekly points when scope is weekly" do
        travel_to 2.weeks.ago do
          create(:points_ledger_entry, user: admin_user, points: 1000, activity_type: "complete_task")
        end
        create(:points_ledger_entry, user: member_user, points: 50, activity_type: "complete_task")

        get "/api/v1/families/#{family.id}/leaderboard",
            params: { scope: "weekly" },
            headers: auth_headers(admin_user)

        json = response.parsed_body
        expect(json["leaderboard"]["scope"]).to eq("weekly")
        entries = json["leaderboard"]["entries"]
        expect(entries[0]["name"]).to eq("Member")
        expect(entries[0]["points"]).to eq(50)
      end

      it "includes streak information for each member" do
        create(:streak, user: admin_user, streak_type: :daily_planning, current_count: 7)

        get "/api/v1/families/#{family.id}/leaderboard", headers: auth_headers(admin_user)

        entries = response.parsed_body["leaderboard"]["entries"]
        admin_entry = entries.find { |e| e["user_id"] == admin_user.id }
        expect(admin_entry["streaks"]["daily_planning"]).to eq(7)
        expect(admin_entry["streaks"]["total"]).to eq(7)
      end

      it "includes badge count for each member" do
        create(:user_badge, user: admin_user)
        create(:user_badge, user: admin_user)

        get "/api/v1/families/#{family.id}/leaderboard", headers: auth_headers(admin_user)

        entries = response.parsed_body["leaderboard"]["entries"]
        admin_entry = entries.find { |e| e["user_id"] == admin_user.id }
        expect(admin_entry["badges_count"]).to eq(2)
      end

      it "returns top performer information" do
        create(:points_ledger_entry, user: member_user, points: 100, activity_type: "complete_task")

        get "/api/v1/families/#{family.id}/leaderboard", headers: auth_headers(admin_user)

        top_performer = response.parsed_body["leaderboard"]["top_performer"]
        expect(top_performer["user_id"]).to eq(member_user.id)
        expect(top_performer["name"]).to eq("Member")
        expect(top_performer["points"]).to eq(100)
      end

      it "returns encouragement messages for all members" do
        get "/api/v1/families/#{family.id}/leaderboard", headers: auth_headers(admin_user)

        messages = response.parsed_body["leaderboard"]["encouragement_messages"]
        expect(messages.size).to eq(2)
        expect(messages.all? { |m| m["message"].present? }).to be(true)
      end

      it "returns different messages based on rank" do
        create(:points_ledger_entry, user: admin_user, points: 100, activity_type: "complete_task")
        create(:points_ledger_entry, user: member_user, points: 50, activity_type: "complete_task")

        get "/api/v1/families/#{family.id}/leaderboard", headers: auth_headers(admin_user)

        messages = response.parsed_body["leaderboard"]["encouragement_messages"]
        first_place = messages.find { |m| m["user_id"] == admin_user.id }
        second_place = messages.find { |m| m["user_id"] == member_user.id }

        expect(first_place["message"]).to include("Leading")
        expect(second_place["message"]).to include("close")
      end

      it "defaults to all_time scope when invalid scope provided" do
        get "/api/v1/families/#{family.id}/leaderboard",
            params: { scope: "invalid" },
            headers: auth_headers(admin_user)

        expect(response.parsed_body["leaderboard"]["scope"]).to eq("all_time")
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/families/#{family.id}/leaderboard"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when authenticated as a non-member" do
      it "returns forbidden" do
        get "/api/v1/families/#{family.id}/leaderboard", headers: auth_headers(non_member)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when family does not exist" do
      it "returns not found" do
        get "/api/v1/families/999999/leaderboard", headers: auth_headers(admin_user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
