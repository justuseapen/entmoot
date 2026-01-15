# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Habits" do
  let(:user) { create(:user) }
  let(:family) { create(:family, timezone: "America/New_York") }

  before { create(:family_membership, :adult, family: family, user: user) }

  describe "GET /api/v1/families/:family_id/habits" do
    context "when user is authenticated and a family member" do
      it "returns empty array when user has no habits" do
        get "/api/v1/families/#{family.id}/habits", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["habits"]).to eq([])
      end

      it "returns user's active habits ordered by position" do
        create(:habit, user: user, family: family, name: "Second", position: 2)
        habit1 = create(:habit, user: user, family: family, name: "First", position: 1)
        create(:habit, user: user, family: family, name: "Third", position: 3)

        get "/api/v1/families/#{family.id}/habits", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        habits = json_response["habits"]
        expect(habits.length).to eq(3)
        expect(habits.pluck("name")).to eq(%w[First Second Third])
        expect(habits.first).to include(
          "id" => habit1.id,
          "name" => "First",
          "position" => 1,
          "is_active" => true
        )
      end

      it "excludes inactive habits" do
        active_habit = create(:habit, user: user, family: family, name: "Active", position: 1)
        create(:habit, :inactive, user: user, family: family, name: "Inactive", position: 2)

        get "/api/v1/families/#{family.id}/habits", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        habits = json_response["habits"]
        expect(habits.length).to eq(1)
        expect(habits.first["id"]).to eq(active_habit.id)
      end

      it "excludes habits from other families" do
        other_family = create(:family)
        create(:family_membership, :adult, family: other_family, user: user)
        create(:habit, user: user, family: other_family, name: "Other Family", position: 1)
        this_family_habit = create(:habit, user: user, family: family, name: "This Family", position: 1)

        get "/api/v1/families/#{family.id}/habits", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        habits = json_response["habits"]
        expect(habits.length).to eq(1)
        expect(habits.first["id"]).to eq(this_family_habit.id)
      end

      it "excludes habits from other users" do
        other_user = create(:user)
        create(:family_membership, :adult, family: family, user: other_user)
        create(:habit, user: other_user, family: family, name: "Other User", position: 1)
        my_habit = create(:habit, user: user, family: family, name: "My Habit", position: 1)

        get "/api/v1/families/#{family.id}/habits", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        habits = json_response["habits"]
        expect(habits.length).to eq(1)
        expect(habits.first["id"]).to eq(my_habit.id)
      end
    end

    context "when user is not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        get "/api/v1/families/#{other_family.id}/habits", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/families/#{family.id}/habits"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when family does not exist" do
      it "returns not found" do
        get "/api/v1/families/999999/habits", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  def json_response
    response.parsed_body
  end
end
