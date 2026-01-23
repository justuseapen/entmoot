# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Goals" do
  let(:user) { create(:user) }
  let(:family) { create(:family) }

  describe "GET /api/v1/families/:family_id/goals" do
    context "when user is a family member" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "returns all family-visible goals" do
        goals = create_list(:goal, 3, :family_visible, family: family, creator: user)

        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["goals"].length).to eq(3)
        expect(json_response["goals"].pluck("id")).to match_array(goals.map(&:id))
      end

      it "returns goals ordered by position then created_at" do
        goal3 = create(:goal, :family_visible, family: family, creator: user, position: 3)
        goal1 = create(:goal, :family_visible, family: family, creator: user, position: 1)
        goal2 = create(:goal, :family_visible, family: family, creator: user, position: 2)
        goal_no_pos = create(:goal, :family_visible, family: family, creator: user, position: nil)

        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        goal_ids = json_response["goals"].pluck("id")
        # Goals with positions should come first, ordered by position
        # Goals without positions come last, ordered by created_at desc
        expect(goal_ids).to eq([goal1.id, goal2.id, goal3.id, goal_no_pos.id])
      end

      it "includes position in the response" do
        goal = create(:goal, :family_visible, family: family, creator: user, position: 5)

        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(user)

        expect(json_response["goals"].first["position"]).to eq(5)
      end

      it "returns empty array when family has no goals" do
        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["goals"]).to eq([])
      end

      it "includes creator and assignees in response" do
        goal = create(:goal, :family_visible, family: family, creator: user)
        assignee = create(:user)
        create(:family_membership, :adult, family: family, user: assignee)
        goal.assign_user(assignee)

        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(user)

        expect(json_response["goals"].first["creator"]).to include("id" => user.id)
        expect(json_response["goals"].first["assignees"].pluck("id")).to include(assignee.id)
      end
    end

    context "with visibility rules" do
      let(:other_user) { create(:user) }

      before do
        create(:family_membership, :adult, family: family, user: user)
        create(:family_membership, :adult, family: family, user: other_user)
      end

      it "returns personal goals only to creator" do
        personal_goal = create(:goal, :personal, family: family, creator: user)
        other_personal = create(:goal, :personal, family: family, creator: other_user)

        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(user)

        expect(json_response["goals"].pluck("id")).to include(personal_goal.id)
        expect(json_response["goals"].pluck("id")).not_to include(other_personal.id)
      end

      it "returns shared goals to assigned users" do
        shared_goal = create(:goal, :shared, family: family, creator: other_user)
        shared_goal.assign_user(user)

        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(user)

        expect(json_response["goals"].pluck("id")).to include(shared_goal.id)
      end

      it "does not return shared goals to non-assigned users" do
        shared_goal = create(:goal, :shared, family: family, creator: other_user)

        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(user)

        expect(json_response["goals"].pluck("id")).not_to include(shared_goal.id)
      end

      it "returns family-visible goals to all members" do
        family_goal = create(:goal, :family_visible, family: family, creator: other_user)

        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(user)

        expect(json_response["goals"].pluck("id")).to include(family_goal.id)
      end
    end

    context "with filtering" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "filters by time_scale" do
        daily = create(:goal, :daily, :family_visible, family: family, creator: user)
        create(:goal, :weekly, :family_visible, family: family, creator: user)

        get "/api/v1/families/#{family.id}/goals", params: { time_scale: "daily" }, headers: auth_headers(user)

        expect(json_response["goals"].pluck("id")).to contain_exactly(daily.id)
      end

      it "filters by status" do
        in_progress = create(:goal, :in_progress, :family_visible, family: family, creator: user)
        create(:goal, :completed, :family_visible, family: family, creator: user)

        get "/api/v1/families/#{family.id}/goals", params: { status: "in_progress" }, headers: auth_headers(user)

        expect(json_response["goals"].pluck("id")).to contain_exactly(in_progress.id)
      end

      it "filters by visibility" do
        personal = create(:goal, :personal, family: family, creator: user)
        create(:goal, :family_visible, family: family, creator: user)

        get "/api/v1/families/#{family.id}/goals", params: { visibility: "personal" }, headers: auth_headers(user)

        expect(json_response["goals"].pluck("id")).to contain_exactly(personal.id)
      end

      it "filters by assignee" do
        assignee = create(:user)
        create(:family_membership, :adult, family: family, user: assignee)

        assigned = create(:goal, :family_visible, family: family, creator: user)
        assigned.assign_user(assignee)
        create(:goal, :family_visible, family: family, creator: user)

        get "/api/v1/families/#{family.id}/goals", params: { assignee_id: assignee.id }, headers: auth_headers(user)

        expect(json_response["goals"].pluck("id")).to contain_exactly(assigned.id)
      end

      it "combines multiple filters" do
        daily_in_progress = create(:goal, :daily, :in_progress, :family_visible, family: family, creator: user)
        create(:goal, :daily, :completed, :family_visible, family: family, creator: user)
        create(:goal, :weekly, :in_progress, :family_visible, family: family, creator: user)

        get "/api/v1/families/#{family.id}/goals",
            params: { time_scale: "daily", status: "in_progress" },
            headers: auth_headers(user)

        expect(json_response["goals"].pluck("id")).to contain_exactly(daily_in_progress.id)
      end

      it "filters by mentioned_by" do
        mentioned_user = create(:user)
        create(:family_membership, :adult, family: family, user: mentioned_user)

        mentioned_goal = create(:goal, :family_visible, family: family, creator: user)
        create(:mention, user: user, mentioned_user: mentioned_user, mentionable: mentioned_goal, text_field: "title")
        not_mentioned_goal = create(:goal, :family_visible, family: family, creator: user)

        get "/api/v1/families/#{family.id}/goals",
            params: { mentioned_by: mentioned_user.id },
            headers: auth_headers(user)

        expect(json_response["goals"].pluck("id")).to contain_exactly(mentioned_goal.id)
        expect(json_response["goals"].pluck("id")).not_to include(not_mentioned_goal.id)
      end

      it "returns empty array when no mentions match" do
        create(:goal, :family_visible, family: family, creator: user)

        get "/api/v1/families/#{family.id}/goals",
            params: { mentioned_by: user.id },
            headers: auth_headers(user)

        expect(json_response["goals"]).to eq([])
      end
    end

    context "when user is not a family member" do
      it "returns 403" do
        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when family does not exist" do
      it "returns 404 with friendly message" do
        get "/api/v1/families/999999/goals", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response["error"]).to eq("This family doesn't exist or you don't have access to it.")
      end
    end

    context "when not authenticated" do
      it "returns 401" do
        get "/api/v1/families/#{family.id}/goals"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/goals/:id" do
    let!(:goal) do
      create(:goal, :with_smart, :with_due_date, :family_visible, family: family, creator: user, title: "Test Goal")
    end

    context "when user is a family member" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "returns the goal details with SMART fields" do
        get "/api/v1/families/#{family.id}/goals/#{goal.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["goal"]).to include(
          "id" => goal.id,
          "title" => "Test Goal",
          "specific" => goal.specific,
          "measurable" => goal.measurable,
          "achievable" => goal.achievable,
          "relevant" => goal.relevant,
          "time_bound" => goal.time_bound
        )
      end

      it "includes parent_id if goal has parent" do
        parent_goal = create(:goal, :annual, :family_visible, family: family, creator: user)
        child_goal = create(:goal, :monthly, :family_visible, family: family, creator: user, parent: parent_goal)

        get "/api/v1/families/#{family.id}/goals/#{child_goal.id}", headers: auth_headers(user)

        expect(json_response["goal"]["parent_id"]).to eq(parent_goal.id)
      end
    end

    context "with visibility restrictions" do
      let(:other_user) { create(:user) }

      before do
        create(:family_membership, :adult, family: family, user: other_user)
      end

      it "returns 403 for personal goals of other users" do
        personal_goal = create(:goal, :personal, family: family, creator: user)

        get "/api/v1/families/#{family.id}/goals/#{personal_goal.id}", headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
      end

      it "returns 403 for shared goals when not assigned" do
        shared_goal = create(:goal, :shared, family: family, creator: user)

        get "/api/v1/families/#{family.id}/goals/#{shared_goal.id}", headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
      end

      it "returns shared goal when user is assigned" do
        shared_goal = create(:goal, :shared, family: family, creator: user)
        shared_goal.assign_user(other_user)

        get "/api/v1/families/#{family.id}/goals/#{shared_goal.id}", headers: auth_headers(other_user)

        expect(response).to have_http_status(:ok)
      end
    end

    context "when goal does not exist" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "returns 404 with friendly message" do
        get "/api/v1/families/#{family.id}/goals/999999", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response["error"]).to eq("This goal doesn't exist or has been deleted.")
      end
    end
  end

  describe "POST /api/v1/families/:family_id/goals" do
    let(:valid_params) do
      {
        goal: {
          title: "Complete quarterly review",
          description: "Review all team performance metrics",
          time_scale: "quarterly",
          status: "not_started",
          visibility: "family",
          progress: 0,
          due_date: 3.months.from_now.to_date.to_s,
          specific: "Complete comprehensive team performance review",
          measurable: "Review all 12 team members",
          achievable: "Using existing evaluation framework",
          relevant: "Required for annual planning",
          time_bound: "Due by end of Q1"
        }
      }
    end

    context "when user is admin" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "creates a new goal" do
        expect do
          post "/api/v1/families/#{family.id}/goals", params: valid_params, headers: auth_headers(user)
        end.to change(Goal, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response["message"]).to eq("Goal created successfully.")
      end

      it "sets the current user as creator" do
        post "/api/v1/families/#{family.id}/goals", params: valid_params, headers: auth_headers(user)

        expect(json_response["goal"]["creator"]["id"]).to eq(user.id)
      end

      it "returns the created goal with all fields" do
        post "/api/v1/families/#{family.id}/goals", params: valid_params, headers: auth_headers(user)

        expect(json_response["goal"]).to include(
          "title" => "Complete quarterly review",
          "time_scale" => "quarterly",
          "visibility" => "family",
          "specific" => "Complete comprehensive team performance review"
        )
      end

      it "creates a goal with assignees" do
        assignee = create(:user)
        create(:family_membership, :adult, family: family, user: assignee)

        params = valid_params.deep_merge(goal: { assignee_ids: [assignee.id] })

        post "/api/v1/families/#{family.id}/goals", params: params, headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        expect(json_response["goal"]["assignees"].pluck("id")).to include(assignee.id)
      end

      it "creates a goal with parent" do
        parent = create(:goal, :annual, :family_visible, family: family, creator: user)
        params = valid_params.deep_merge(goal: { parent_id: parent.id })

        post "/api/v1/families/#{family.id}/goals", params: params, headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        expect(json_response["goal"]["parent_id"]).to eq(parent.id)
      end

      it "creates a minimal goal with defaults" do
        minimal_params = { goal: { title: "Simple goal" } }

        expect do
          post "/api/v1/families/#{family.id}/goals", params: minimal_params, headers: auth_headers(user)
        end.to change(Goal, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response["goal"]["title"]).to eq("Simple goal")
      end

      it "applies default values for optional fields" do
        minimal_params = { goal: { title: "Simple goal" } }

        post "/api/v1/families/#{family.id}/goals", params: minimal_params, headers: auth_headers(user)

        expect(json_response["goal"]).to include(
          "time_scale" => "daily",
          "status" => "not_started",
          "visibility" => "personal"
        )
      end

      context "with first goal tracking" do
        it "sets first_goal_created_at when creating first goal" do
          expect(user.first_goal_created_at).to be_nil

          post "/api/v1/families/#{family.id}/goals", params: valid_params, headers: auth_headers(user)

          expect(response).to have_http_status(:created)
          expect(user.reload.first_goal_created_at).to be_present
        end

        it "returns is_first_goal true when creating first goal" do
          post "/api/v1/families/#{family.id}/goals", params: valid_params, headers: auth_headers(user)

          expect(json_response["is_first_goal"]).to be true
        end

        it "does not update first_goal_created_at on subsequent goals" do
          first_time = 1.day.ago
          user.update!(first_goal_created_at: first_time)

          post "/api/v1/families/#{family.id}/goals", params: valid_params, headers: auth_headers(user)

          expect(user.reload.first_goal_created_at).to be_within(1.second).of(first_time)
        end

        it "returns is_first_goal false on subsequent goals" do
          create(:goal, family: family, creator: user)

          post "/api/v1/families/#{family.id}/goals", params: valid_params, headers: auth_headers(user)

          expect(json_response["is_first_goal"]).to be false
        end
      end
    end

    context "when user is adult" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "creates a new goal" do
        expect do
          post "/api/v1/families/#{family.id}/goals", params: valid_params, headers: auth_headers(user)
        end.to change(Goal, :count).by(1)

        expect(response).to have_http_status(:created)
      end
    end

    context "when user is teen" do
      before { create(:family_membership, :teen, family: family, user: user) }

      it "returns 403" do
        post "/api/v1/families/#{family.id}/goals", params: valid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is child" do
      before { create(:family_membership, :child, family: family, user: user) }

      it "returns 403" do
        post "/api/v1/families/#{family.id}/goals", params: valid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is observer" do
      before { create(:family_membership, :observer, family: family, user: user) }

      it "returns 403" do
        post "/api/v1/families/#{family.id}/goals", params: valid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "with invalid parameters" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "returns 422 when title is missing" do
        invalid_params = { goal: { description: "No title" } }

        post "/api/v1/families/#{family.id}/goals", params: invalid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["error"]).to eq("Title can't be blank")
        expect(json_response["errors"]).to include("Title can't be blank")
      end

      it "returns 422 when progress is out of range" do
        invalid_params = { goal: { title: "Test", progress: 150 } }

        post "/api/v1/families/#{family.id}/goals", params: invalid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"].first).to include("Progress")
      end

      it "returns 422 for invalid time_scale" do
        invalid_params = { goal: { title: "Test", time_scale: "invalid" } }

        post "/api/v1/families/#{family.id}/goals", params: invalid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context "when user is not a family member" do
      it "returns 403" do
        post "/api/v1/families/#{family.id}/goals", params: valid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH /api/v1/families/:family_id/goals/:id" do
    let!(:goal) { create(:goal, :family_visible, family: family, creator: user, title: "Original Title") }

    context "when user is admin" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "updates the goal successfully" do
        patch "/api/v1/families/#{family.id}/goals/#{goal.id}",
              params: { goal: { title: "Updated Title" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Goal updated successfully.")
        expect(json_response["goal"]["title"]).to eq("Updated Title")
        expect(goal.reload.title).to eq("Updated Title")
      end

      it "updates multiple fields at once" do
        patch "/api/v1/families/#{family.id}/goals/#{goal.id}",
              params: { goal: { status: "in_progress", progress: 25 } },
              headers: auth_headers(user)

        expect(json_response["goal"]["status"]).to eq("in_progress")
        expect(json_response["goal"]["progress"]).to eq(25)
      end

      it "updates only provided fields" do
        original_description = goal.description

        patch "/api/v1/families/#{family.id}/goals/#{goal.id}",
              params: { goal: { title: "New Title" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(goal.reload.description).to eq(original_description)
      end

      it "updates assignees" do
        assignee = create(:user)
        create(:family_membership, :adult, family: family, user: assignee)

        patch "/api/v1/families/#{family.id}/goals/#{goal.id}",
              params: { goal: { assignee_ids: [assignee.id] } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["goal"]["assignees"].pluck("id")).to include(assignee.id)
      end

      it "replaces all assignees" do
        old_assignee = create(:user)
        new_assignee = create(:user)
        create(:family_membership, :adult, family: family, user: old_assignee)
        create(:family_membership, :adult, family: family, user: new_assignee)
        goal.assign_user(old_assignee)

        patch "/api/v1/families/#{family.id}/goals/#{goal.id}",
              params: { goal: { assignee_ids: [new_assignee.id] } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["goal"]["assignees"].pluck("id")).to contain_exactly(new_assignee.id)
      end

      it "updates parent goal" do
        parent = create(:goal, :annual, :family_visible, family: family, creator: user)

        patch "/api/v1/families/#{family.id}/goals/#{goal.id}",
              params: { goal: { parent_id: parent.id } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["goal"]["parent_id"]).to eq(parent.id)
      end

      it "updates SMART fields" do
        patch "/api/v1/families/#{family.id}/goals/#{goal.id}",
              params: { goal: { specific: "New specific criteria" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["goal"]["specific"]).to eq("New specific criteria")
      end
    end

    context "when user is adult" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "updates the goal" do
        patch "/api/v1/families/#{family.id}/goals/#{goal.id}",
              params: { goal: { title: "New Title" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["goal"]["title"]).to eq("New Title")
      end
    end

    context "when user is teen" do
      before { create(:family_membership, :teen, family: family, user: user) }

      it "returns 403" do
        patch "/api/v1/families/#{family.id}/goals/#{goal.id}",
              params: { goal: { title: "New Title" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "with visibility restrictions" do
      let(:other_user) { create(:user) }

      before do
        create(:family_membership, :adult, family: family, user: other_user)
      end

      it "returns 403 for personal goals of other users" do
        personal_goal = create(:goal, :personal, family: family, creator: user)

        patch "/api/v1/families/#{family.id}/goals/#{personal_goal.id}",
              params: { goal: { title: "Hacked" } },
              headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
      end

      it "allows update of shared goal when assigned" do
        shared_goal = create(:goal, :shared, family: family, creator: user)
        shared_goal.assign_user(other_user)

        patch "/api/v1/families/#{family.id}/goals/#{shared_goal.id}",
              params: { goal: { title: "Updated by assignee" } },
              headers: auth_headers(other_user)

        expect(response).to have_http_status(:ok)
      end
    end

    context "with invalid parameters" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "returns 422 when title becomes empty" do
        patch "/api/v1/families/#{family.id}/goals/#{goal.id}",
              params: { goal: { title: "" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["error"]).to eq("Title can't be blank")
        expect(json_response["errors"]).to include("Title can't be blank")
      end

      it "returns 422 when progress is invalid" do
        patch "/api/v1/families/#{family.id}/goals/#{goal.id}",
              params: { goal: { progress: -10 } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end

    context "when user is not a family member" do
      it "returns 403" do
        patch "/api/v1/families/#{family.id}/goals/#{goal.id}",
              params: { goal: { title: "New Title" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /api/v1/families/:family_id/goals/:id" do
    let!(:goal) { create(:goal, :family_visible, family: family, creator: user) }

    context "when user is admin" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "deletes the goal" do
        expect do
          delete "/api/v1/families/#{family.id}/goals/#{goal.id}", headers: auth_headers(user)
        end.to change(Goal, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Goal deleted successfully.")
      end

      it "nullifies child goals when parent is deleted" do
        child = create(:goal, :family_visible, family: family, creator: user, parent: goal)

        delete "/api/v1/families/#{family.id}/goals/#{goal.id}", headers: auth_headers(user)

        expect(child.reload.parent_id).to be_nil
      end
    end

    context "when user is adult" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "deletes the goal" do
        expect do
          delete "/api/v1/families/#{family.id}/goals/#{goal.id}", headers: auth_headers(user)
        end.to change(Goal, :count).by(-1)

        expect(response).to have_http_status(:ok)
      end
    end

    context "when user is teen" do
      before { create(:family_membership, :teen, family: family, user: user) }

      it "returns 403" do
        delete "/api/v1/families/#{family.id}/goals/#{goal.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is child" do
      before { create(:family_membership, :child, family: family, user: user) }

      it "returns 403" do
        delete "/api/v1/families/#{family.id}/goals/#{goal.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "with visibility restrictions" do
      let(:other_user) { create(:user) }

      before do
        create(:family_membership, :adult, family: family, user: other_user)
      end

      it "returns 403 for personal goals of other users" do
        personal_goal = create(:goal, :personal, family: family, creator: user)

        delete "/api/v1/families/#{family.id}/goals/#{personal_goal.id}", headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is not a family member" do
      it "returns 403" do
        delete "/api/v1/families/#{family.id}/goals/#{goal.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST /api/v1/families/:family_id/goals/:id/refine" do
    let!(:goal) do
      create(:goal, :with_smart, :family_visible, family: family, creator: user, title: "Learn Spanish")
    end

    let(:mock_ai_response) do
      {
        smart_suggestions: {
          specific: "Define which aspect of Spanish you want to focus on (conversational, business, academic)",
          measurable: "Set a target level (e.g., B2 CEFR level) or vocabulary count (2000 words)",
          achievable: "Start with 15-30 minutes daily practice and gradually increase",
          relevant: "Consider how Spanish will benefit your career or personal life",
          time_bound: "Set a 6-month checkpoint to assess progress toward fluency"
        },
        alternative_titles: [
          "Achieve B2 Spanish Fluency for Travel",
          "Master Conversational Spanish in 6 Months",
          "Learn 2000 Spanish Words for Daily Use"
        ],
        alternative_descriptions: [
          "Develop Spanish speaking and comprehension skills to confidently navigate everyday situations",
          "Build a strong Spanish vocabulary foundation and practice conversational skills through daily exercises"
        ],
        potential_obstacles: [
          { obstacle: "Lack of daily practice consistency",
            mitigation: "Set specific practice times and use habit-stacking techniques" },
          { obstacle: "Limited speaking practice opportunities",
            mitigation: "Join language exchange platforms or local Spanish meetups" }
        ],
        milestones: [
          { title: "Complete beginner course", description: "Finish A1 level materials", suggested_progress: 25 },
          { title: "Hold basic conversations", description: "Can discuss simple topics for 5+ minutes",
            suggested_progress: 50 },
          { title: "Understand native content", description: "Follow Spanish podcasts/shows with minimal subtitles",
            suggested_progress: 75 },
          { title: "Achieve target fluency", description: "Pass B2 assessment or equivalent", suggested_progress: 100 }
        ],
        overall_feedback: "Great goal! Adding specific metrics and checkpoints will make your progress more measurable."
      }
    end

    let(:mock_service) { instance_double(GoalRefinementService, refine: mock_ai_response) }

    before do
      allow(GoalRefinementService).to receive(:new).and_return(mock_service)
    end

    context "when user is a family member" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "returns AI refinement suggestions" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/refine", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["suggestions"]).to be_present
        expect(json_response["suggestions"]["smart_suggestions"]).to be_present
        expect(json_response["suggestions"]["alternative_titles"]).to be_an(Array)
        expect(json_response["suggestions"]["potential_obstacles"]).to be_an(Array)
        expect(json_response["suggestions"]["milestones"]).to be_an(Array)
      end

      it "includes SMART criterion suggestions" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/refine", headers: auth_headers(user)

        smart = json_response["suggestions"]["smart_suggestions"]
        expect(smart).to include("specific", "measurable", "achievable", "relevant", "time_bound")
      end

      it "includes alternative titles and descriptions" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/refine", headers: auth_headers(user)

        expect(json_response["suggestions"]["alternative_titles"].length).to be >= 1
        expect(json_response["suggestions"]["alternative_descriptions"].length).to be >= 1
      end

      it "includes potential obstacles with mitigations" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/refine", headers: auth_headers(user)

        obstacles = json_response["suggestions"]["potential_obstacles"]
        expect(obstacles.first).to include("obstacle", "mitigation")
      end

      it "includes milestones with progress percentages" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/refine", headers: auth_headers(user)

        milestones = json_response["suggestions"]["milestones"]
        expect(milestones.first).to include("title", "suggested_progress")
      end

      it "includes overall feedback" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/refine", headers: auth_headers(user)

        expect(json_response["suggestions"]["overall_feedback"]).to be_present
      end
    end

    context "when AI service fails" do
      let(:failing_service) do
        instance_double(GoalRefinementService).tap do |svc|
          allow(svc).to receive(:refine)
            .and_raise(GoalRefinementService::RefinementError, "API connection failed")
        end
      end

      before do
        create(:family_membership, :adult, family: family, user: user)
        allow(GoalRefinementService).to receive(:new).and_return(failing_service)
      end

      it "returns 503 service unavailable with friendly message" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/refine", headers: auth_headers(user)

        expect(response).to have_http_status(:service_unavailable)
        expected_message = "Our AI assistant is temporarily unavailable. Please try again in a few minutes."
        expect(json_response["error"]).to eq(expected_message)
      end
    end

    context "with visibility restrictions" do
      let(:other_user) { create(:user) }

      before do
        create(:family_membership, :adult, family: family, user: other_user)
      end

      it "returns 403 for personal goals of other users" do
        personal_goal = create(:goal, :personal, family: family, creator: user)

        post "/api/v1/families/#{family.id}/goals/#{personal_goal.id}/refine", headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
      end

      it "allows refinement of family-visible goals" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/refine", headers: auth_headers(other_user)

        expect(response).to have_http_status(:ok)
      end

      it "allows refinement of shared goals when assigned" do
        shared_goal = create(:goal, :shared, family: family, creator: user)
        shared_goal.assign_user(other_user)

        post "/api/v1/families/#{family.id}/goals/#{shared_goal.id}/refine", headers: auth_headers(other_user)

        expect(response).to have_http_status(:ok)
      end
    end

    context "when user is not a family member" do
      it "returns 403" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/refine", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when goal does not exist" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "returns 404 with friendly message" do
        post "/api/v1/families/#{family.id}/goals/999999/refine", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
        expect(json_response["error"]).to eq("This goal doesn't exist or has been deleted.")
      end
    end

    context "when not authenticated" do
      it "returns 401" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/refine"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/families/:family_id/goals/:id/regenerate_sub_goals" do
    let!(:goal) do
      create(:goal, :annual, :family_visible, family: family, creator: user, title: "Get pilot's license",
                                              due_date: 1.year.from_now.to_date)
    end

    context "when user is admin" do
      before do
        create(:family_membership, :admin, family: family, user: user)
        allow(SubGoalGenerationJob).to receive(:perform_later)
      end

      it "enqueues the sub-goal generation job" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/regenerate_sub_goals", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(SubGoalGenerationJob).to have_received(:perform_later).with(goal_id: goal.id, user_id: user.id)
      end

      it "returns success message" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/regenerate_sub_goals", headers: auth_headers(user)

        expect(json_response["message"]).to eq("Sub-goal generation started. You'll be notified when complete.")
      end

      it "deletes existing draft sub-goals" do
        draft_sub_goal = create(:goal, :quarterly, :family_visible, family: family, creator: user, parent: goal,
                                                                    is_draft: true)
        accepted_sub_goal = create(:goal, :quarterly, :family_visible, family: family, creator: user, parent: goal,
                                                                       is_draft: false)

        post "/api/v1/families/#{family.id}/goals/#{goal.id}/regenerate_sub_goals", headers: auth_headers(user)

        expect(Goal.exists?(draft_sub_goal.id)).to be(false)
        expect(Goal.exists?(accepted_sub_goal.id)).to be(true)
      end

      it "returns updated goal with children counts" do
        create(:goal, :quarterly, :family_visible, family: family, creator: user, parent: goal, is_draft: false)

        post "/api/v1/families/#{family.id}/goals/#{goal.id}/regenerate_sub_goals", headers: auth_headers(user)

        expect(json_response["goal"]["children_count"]).to eq(1)
        expect(json_response["goal"]["draft_children_count"]).to eq(0)
      end
    end

    context "when user is adult" do
      before do
        create(:family_membership, :adult, family: family, user: user)
        allow(SubGoalGenerationJob).to receive(:perform_later)
      end

      it "allows regeneration" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/regenerate_sub_goals", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
      end
    end

    context "when user is teen" do
      before { create(:family_membership, :teen, family: family, user: user) }

      it "returns 403" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/regenerate_sub_goals", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "with visibility restrictions" do
      let(:other_user) { create(:user) }

      before do
        create(:family_membership, :adult, family: family, user: other_user)
        allow(SubGoalGenerationJob).to receive(:perform_later)
      end

      it "returns 403 for personal goals of other users" do
        personal_goal = create(:goal, :annual, :personal, family: family, creator: user, due_date: 1.year.from_now.to_date)

        post "/api/v1/families/#{family.id}/goals/#{personal_goal.id}/regenerate_sub_goals",
             headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
      end

      it "allows regeneration for family-visible goals" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/regenerate_sub_goals", headers: auth_headers(other_user)

        expect(response).to have_http_status(:ok)
      end

      it "allows regeneration of shared goals when assigned" do
        shared_goal = create(:goal, :annual, :shared, family: family, creator: user, due_date: 1.year.from_now.to_date)
        shared_goal.assign_user(other_user)

        post "/api/v1/families/#{family.id}/goals/#{shared_goal.id}/regenerate_sub_goals",
             headers: auth_headers(other_user)

        expect(response).to have_http_status(:ok)
      end
    end

    context "when goal does not exist" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "returns 404" do
        post "/api/v1/families/#{family.id}/goals/999999/regenerate_sub_goals", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end

    context "when not authenticated" do
      it "returns 401" do
        post "/api/v1/families/#{family.id}/goals/#{goal.id}/regenerate_sub_goals"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/families/:family_id/goals/update_positions" do
    context "when user is admin" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "updates goal positions" do
        goal1 = create(:goal, :annual, :family_visible, family: family, creator: user, position: 1)
        goal2 = create(:goal, :annual, :family_visible, family: family, creator: user, position: 2)
        goal3 = create(:goal, :annual, :family_visible, family: family, creator: user, position: 3)

        post "/api/v1/families/#{family.id}/goals/update_positions",
             params: {
               positions: [
                 { id: goal2.id, position: 1 },
                 { id: goal3.id, position: 2 },
                 { id: goal1.id, position: 3 }
               ]
             },
             headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Positions updated successfully.")

        expect(goal1.reload.position).to eq(3)
        expect(goal2.reload.position).to eq(1)
        expect(goal3.reload.position).to eq(2)
      end

      it "returns updated goals in new order" do
        goal1 = create(:goal, :annual, :family_visible, family: family, creator: user, position: 1)
        goal2 = create(:goal, :annual, :family_visible, family: family, creator: user, position: 2)

        post "/api/v1/families/#{family.id}/goals/update_positions",
             params: {
               positions: [
                 { id: goal2.id, position: 1 },
                 { id: goal1.id, position: 2 }
               ]
             },
             headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["goals"]).to be_an(Array)
        expect(json_response["goals"].first["position"]).to eq(1)
      end

      it "cannot update goals created by another user" do
        other_user = create(:user)
        create(:family_membership, :adult, family: family, user: other_user)
        other_goal = create(:goal, :annual, :family_visible, family: family, creator: other_user, position: 1)

        post "/api/v1/families/#{family.id}/goals/update_positions",
             params: { positions: [{ id: other_goal.id, position: 1 }] },
             headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end

      it "returns 404 for non-existent goal" do
        post "/api/v1/families/#{family.id}/goals/update_positions",
             params: { positions: [{ id: 999_999, position: 1 }] },
             headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end

    context "when user is adult" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "updates goal positions" do
        goal = create(:goal, :annual, :family_visible, family: family, creator: user, position: 1)

        post "/api/v1/families/#{family.id}/goals/update_positions",
             params: { positions: [{ id: goal.id, position: 2 }] },
             headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(goal.reload.position).to eq(2)
      end
    end

    context "when user is teen" do
      before { create(:family_membership, :teen, family: family, user: user) }

      it "returns 403" do
        goal = create(:goal, :annual, :family_visible, family: family, creator: user, position: 1)

        post "/api/v1/families/#{family.id}/goals/update_positions",
             params: { positions: [{ id: goal.id, position: 2 }] },
             headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is child" do
      before { create(:family_membership, :child, family: family, user: user) }

      it "returns 403" do
        goal = create(:goal, :annual, :family_visible, family: family, creator: user, position: 1)

        post "/api/v1/families/#{family.id}/goals/update_positions",
             params: { positions: [{ id: goal.id, position: 2 }] },
             headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is observer" do
      before { create(:family_membership, :observer, family: family, user: user) }

      it "returns 403" do
        goal = create(:goal, :annual, :family_visible, family: family, creator: user, position: 1)

        post "/api/v1/families/#{family.id}/goals/update_positions",
             params: { positions: [{ id: goal.id, position: 2 }] },
             headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is not a family member" do
      it "returns 403" do
        goal = create(:goal, :annual, :family_visible, family: family, creator: user, position: 1)

        post "/api/v1/families/#{family.id}/goals/update_positions",
             params: { positions: [{ id: goal.id, position: 2 }] },
             headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when not authenticated" do
      it "returns 401" do
        post "/api/v1/families/#{family.id}/goals/update_positions",
             params: { positions: [] }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "sub-goal auto-generation on create" do
    let(:valid_annual_params) do
      {
        goal: {
          title: "Get pilot's license",
          time_scale: "annual",
          due_date: 1.year.from_now.to_date.to_s,
          visibility: "family"
        }
      }
    end

    before do
      create(:family_membership, :admin, family: family, user: user)
      allow(SubGoalGenerationJob).to receive(:perform_later)
    end

    it "enqueues sub-goal generation for annual goals" do
      post "/api/v1/families/#{family.id}/goals", params: valid_annual_params, headers: auth_headers(user)

      expect(response).to have_http_status(:created)
      goal_id = json_response["goal"]["id"]
      expect(SubGoalGenerationJob).to have_received(:perform_later).with(goal_id: goal_id, user_id: user.id)
    end

    it "enqueues sub-goal generation for quarterly goals" do
      quarterly_params = valid_annual_params.deep_merge(goal: { time_scale: "quarterly" })

      post "/api/v1/families/#{family.id}/goals", params: quarterly_params, headers: auth_headers(user)

      expect(response).to have_http_status(:created)
      expect(SubGoalGenerationJob).to have_received(:perform_later)
    end

    it "does not enqueue for monthly goals" do
      monthly_params = valid_annual_params.deep_merge(goal: { time_scale: "monthly" })

      post "/api/v1/families/#{family.id}/goals", params: monthly_params, headers: auth_headers(user)

      expect(response).to have_http_status(:created)
      expect(SubGoalGenerationJob).not_to have_received(:perform_later)
    end

    it "does not enqueue when generate_sub_goals is false" do
      opt_out_params = valid_annual_params.deep_merge(goal: { generate_sub_goals: false })

      post "/api/v1/families/#{family.id}/goals", params: opt_out_params, headers: auth_headers(user)

      expect(response).to have_http_status(:created)
      expect(SubGoalGenerationJob).not_to have_received(:perform_later)
    end

    it "does not enqueue for goals without due dates" do
      no_due_date_params = valid_annual_params.deep_merge(goal: { due_date: nil })

      post "/api/v1/families/#{family.id}/goals", params: no_due_date_params, headers: auth_headers(user)

      expect(response).to have_http_status(:created)
      expect(SubGoalGenerationJob).not_to have_received(:perform_later)
    end
  end
end
