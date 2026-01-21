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

  describe "POST /api/v1/families/:family_id/habits" do
    let(:valid_params) { { habit: { name: "New Habit" } } }

    context "when authenticated member" do
      it "creates a new habit for current user" do
        expect do
          post "/api/v1/families/#{family.id}/habits", params: valid_params, headers: auth_headers(user)
        end.to change(Habit, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response["message"]).to eq("Habit created successfully.")
        expect(json_response["habit"]["name"]).to eq("New Habit")
        expect(Habit.last.user_id).to eq(user.id)
        expect(Habit.last.family_id).to eq(family.id)
      end

      it "auto-assigns position as next available" do
        create(:habit, user: user, family: family, position: 3)

        post "/api/v1/families/#{family.id}/habits", params: valid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        expect(json_response["habit"]["position"]).to eq(4)
      end

      it "assigns position 1 when no habits exist" do
        post "/api/v1/families/#{family.id}/habits", params: valid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        expect(json_response["habit"]["position"]).to eq(1)
      end

      it "returns errors when name is blank" do
        post "/api/v1/families/#{family.id}/habits",
             params: { habit: { name: "" } },
             headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context "when not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        post "/api/v1/families/#{other_family.id}/habits", params: valid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        post "/api/v1/families/#{family.id}/habits", params: valid_params

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "PATCH /api/v1/families/:family_id/habits/:id" do
    let!(:habit) { create(:habit, user: user, family: family, name: "Old Name", position: 1) }

    it "updates the habit name" do
      patch "/api/v1/families/#{family.id}/habits/#{habit.id}",
            params: { habit: { name: "New Name" } },
            headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["message"]).to eq("Habit updated successfully.")
      expect(json_response["habit"]["name"]).to eq("New Name")
      expect(habit.reload.name).to eq("New Name")
    end

    it "updates is_active status" do
      patch "/api/v1/families/#{family.id}/habits/#{habit.id}",
            params: { habit: { is_active: false } },
            headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(habit.reload.is_active).to be false
    end

    it "cannot update another user's habit" do
      other_user = create(:user)
      create(:family_membership, :adult, family: family, user: other_user)
      other_habit = create(:habit, user: other_user, family: family, position: 2)

      patch "/api/v1/families/#{family.id}/habits/#{other_habit.id}",
            params: { habit: { name: "Hacked" } },
            headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
    end

    it "returns not found for non-existent habit" do
      patch "/api/v1/families/#{family.id}/habits/999999",
            params: { habit: { name: "New Name" } },
            headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        patch "/api/v1/families/#{family.id}/habits/#{habit.id}",
              params: { habit: { name: "New Name" } }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "DELETE /api/v1/families/:family_id/habits/:id" do
    let!(:habit) { create(:habit, user: user, family: family, position: 1) }

    it "deletes the habit" do
      expect do
        delete "/api/v1/families/#{family.id}/habits/#{habit.id}", headers: auth_headers(user)
      end.to change(Habit, :count).by(-1)

      expect(response).to have_http_status(:ok)
      expect(json_response["message"]).to eq("Habit deleted successfully.")
    end

    it "cannot delete another user's habit" do
      other_user = create(:user)
      create(:family_membership, :adult, family: family, user: other_user)
      other_habit = create(:habit, user: other_user, family: family, position: 2)

      delete "/api/v1/families/#{family.id}/habits/#{other_habit.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
    end

    it "returns not found for non-existent habit" do
      delete "/api/v1/families/#{family.id}/habits/999999", headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        delete "/api/v1/families/#{family.id}/habits/#{habit.id}"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/families/:family_id/habits/update_positions" do
    let!(:habit1) { create(:habit, user: user, family: family, name: "First", position: 1) }
    let!(:habit2) { create(:habit, user: user, family: family, name: "Second", position: 2) }
    let!(:habit3) { create(:habit, user: user, family: family, name: "Third", position: 3) }

    it "reorders habits" do
      new_positions = {
        positions: [
          { id: habit3.id, position: 1 },
          { id: habit1.id, position: 2 },
          { id: habit2.id, position: 3 }
        ]
      }

      post "/api/v1/families/#{family.id}/habits/update_positions",
           params: new_positions,
           headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["message"]).to eq("Positions updated successfully.")
      expect(habit3.reload.position).to eq(1)
      expect(habit1.reload.position).to eq(2)
      expect(habit2.reload.position).to eq(3)
    end

    it "returns habits in new order" do
      new_positions = {
        positions: [
          { id: habit3.id, position: 1 },
          { id: habit1.id, position: 2 },
          { id: habit2.id, position: 3 }
        ]
      }

      post "/api/v1/families/#{family.id}/habits/update_positions",
           params: new_positions,
           headers: auth_headers(user)

      habits = json_response["habits"]
      expect(habits.pluck("name")).to eq(%w[Third First Second])
    end

    it "returns not found when trying to reorder another user's habit" do
      other_user = create(:user)
      create(:family_membership, :adult, family: family, user: other_user)
      other_habit = create(:habit, user: other_user, family: family, position: 4)

      new_positions = {
        positions: [
          { id: other_habit.id, position: 1 }
        ]
      }

      post "/api/v1/families/#{family.id}/habits/update_positions",
           params: new_positions,
           headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
    end

    context "when not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        post "/api/v1/families/#{other_family.id}/habits/update_positions",
             params: { positions: [] },
             headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        post "/api/v1/families/#{family.id}/habits/update_positions",
             params: { positions: [] }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  def json_response
    response.parsed_body
  end
end
