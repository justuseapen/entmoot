# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::DailyPlans" do
  let(:user) { create(:user) }
  let(:family) { create(:family, timezone: "America/New_York") }

  before { create(:family_membership, :adult, family: family, user: user) }

  describe "GET /api/v1/families/:family_id/daily_plans" do
    context "when user is authenticated and a family member" do
      it "returns the user's daily plans" do
        plan1 = create(:daily_plan, user: user, family: family, date: Date.current)
        plan2 = create(:daily_plan, user: user, family: family, date: Date.current - 1.day)

        get "/api/v1/families/#{family.id}/daily_plans", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["daily_plans"].length).to eq(2)
        expect(json_response["daily_plans"].pluck("id")).to contain_exactly(plan1.id, plan2.id)
      end

      it "returns plans ordered by date descending" do
        create(:daily_plan, user: user, family: family, date: Date.current - 2.days)
        create(:daily_plan, user: user, family: family, date: Date.current - 1.day)
        create(:daily_plan, user: user, family: family, date: Date.current)

        get "/api/v1/families/#{family.id}/daily_plans", headers: auth_headers(user)

        dates = json_response["daily_plans"].pluck("date")
        expect(dates).to eq(dates.sort.reverse)
      end
    end

    context "when user is not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        get "/api/v1/families/#{other_family.id}/daily_plans", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/families/#{family.id}/daily_plans"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/daily_plans/today" do
    context "when user is authenticated and a family member" do
      it "creates a new daily plan if none exists" do
        expect do
          get "/api/v1/families/#{family.id}/daily_plans/today", headers: auth_headers(user)
        end.to change(DailyPlan, :count).by(1)

        expect(response).to have_http_status(:ok)
        expect(json_response["user_id"]).to eq(user.id)
        expect(json_response["family_id"]).to eq(family.id)
      end

      it "returns existing plan if one exists for today" do
        today = Time.find_zone("America/New_York").today
        existing_plan = create(:daily_plan, user: user, family: family, date: today, intention: "Test intention")

        expect do
          get "/api/v1/families/#{family.id}/daily_plans/today", headers: auth_headers(user)
        end.not_to change(DailyPlan, :count)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(existing_plan.id)
        expect(json_response["intention"]).to eq("Test intention")
      end

      it "includes daily tasks in response" do
        today = Time.find_zone("America/New_York").today
        plan = create(:daily_plan, user: user, family: family, date: today)
        task = create(:daily_task, daily_plan: plan, title: "Test task", position: 0)

        get "/api/v1/families/#{family.id}/daily_plans/today", headers: auth_headers(user)

        expect(json_response["daily_tasks"].length).to eq(1)
        expect(json_response["daily_tasks"].first["id"]).to eq(task.id)
        expect(json_response["daily_tasks"].first["title"]).to eq("Test task")
      end

      it "includes top priorities in response" do
        today = Time.find_zone("America/New_York").today
        plan = create(:daily_plan, user: user, family: family, date: today)
        priority = create(:top_priority, daily_plan: plan, title: "Top priority", priority_order: 1, completed: true)

        get "/api/v1/families/#{family.id}/daily_plans/today", headers: auth_headers(user)

        expect(json_response["top_priorities"].length).to eq(1)
        expect(json_response["top_priorities"].first["id"]).to eq(priority.id)
        expect(json_response["top_priorities"].first["title"]).to eq("Top priority")
        expect(json_response["top_priorities"].first["completed"]).to be true
      end

      it "includes completion stats in response" do
        today = Time.find_zone("America/New_York").today
        plan = create(:daily_plan, user: user, family: family, date: today)
        # Create priorities (now tracked in completion_stats)
        create(:top_priority, daily_plan: plan, title: "Priority 1", priority_order: 1, completed: true)
        create(:top_priority, daily_plan: plan, title: "Priority 2", priority_order: 2, completed: false)
        # Create habit completion (also tracked in completion_stats)
        habit = create(:habit, user: user, family: family)
        create(:habit_completion, daily_plan: plan, habit: habit, completed: true)

        get "/api/v1/families/#{family.id}/daily_plans/today", headers: auth_headers(user)

        expect(json_response["completion_stats"]).to eq({
                                                          "total" => 3,
                                                          "completed" => 2,
                                                          "percentage" => 67
                                                        })
      end

      it "includes yesterday's incomplete tasks in response" do
        yesterday = Time.find_zone("America/New_York").today - 1.day
        today = Time.find_zone("America/New_York").today

        yesterday_plan = create(:daily_plan, user: user, family: family, date: yesterday)
        incomplete_task = create(:daily_task, :incomplete, daily_plan: yesterday_plan, title: "Unfinished task")
        create(:daily_task, :completed, daily_plan: yesterday_plan)

        create(:daily_plan, user: user, family: family, date: today)

        get "/api/v1/families/#{family.id}/daily_plans/today", headers: auth_headers(user)

        expect(json_response["yesterday_incomplete_tasks"].length).to eq(1)
        expect(json_response["yesterday_incomplete_tasks"].first["id"]).to eq(incomplete_task.id)
        expect(json_response["yesterday_incomplete_tasks"].first["title"]).to eq("Unfinished task")
      end
    end

    context "when user is not a family member" do
      let(:other_family) { create(:family) }

      it "returns forbidden" do
        get "/api/v1/families/#{other_family.id}/daily_plans/today", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when not authenticated" do
      it "returns unauthorized" do
        get "/api/v1/families/#{family.id}/daily_plans/today"

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when family does not exist" do
      it "returns not found" do
        get "/api/v1/families/999999/daily_plans/today", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/daily_plans/:id" do
    let(:daily_plan) { create(:daily_plan, user: user, family: family) }

    context "when viewing own plan" do
      it "returns the daily plan" do
        get "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(daily_plan.id)
      end
    end

    context "when viewing another family member's plan" do
      let(:other_member) { create(:user) }
      let(:other_plan) { create(:daily_plan, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns the daily plan" do
        get "/api/v1/families/#{family.id}/daily_plans/#{other_plan.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq(other_plan.id)
      end
    end

    context "when plan does not exist" do
      it "returns not found" do
        get "/api/v1/families/#{family.id}/daily_plans/999999", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "PATCH /api/v1/families/:family_id/daily_plans/:id" do
    let(:daily_plan) { create(:daily_plan, user: user, family: family) }

    context "when updating own plan" do
      it "updates the intention" do
        patch "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}",
              params: { daily_plan: { intention: "Be mindful today" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Daily plan updated successfully.")
        expect(json_response["daily_plan"]["intention"]).to eq("Be mindful today")
      end

      it "adds new daily tasks" do
        patch "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}",
              params: {
                daily_plan: {
                  daily_tasks_attributes: [
                    { title: "New task 1", position: 0 },
                    { title: "New task 2", position: 1 }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["daily_plan"]["daily_tasks"].length).to eq(2)
        expect(json_response["daily_plan"]["daily_tasks"].pluck("title")).to contain_exactly("New task 1", "New task 2")
      end

      it "updates existing daily tasks" do
        task = create(:daily_task, daily_plan: daily_plan, title: "Original", completed: false)

        patch "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}",
              params: {
                daily_plan: {
                  daily_tasks_attributes: [
                    { id: task.id, title: "Updated", completed: true }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        task_response = json_response["daily_plan"]["daily_tasks"].find { |t| t["id"] == task.id }
        expect(task_response["title"]).to eq("Updated")
        expect(task_response["completed"]).to be(true)
      end

      it "removes daily tasks" do
        task = create(:daily_task, daily_plan: daily_plan)

        patch "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}",
              params: {
                daily_plan: {
                  daily_tasks_attributes: [
                    { id: task.id, _destroy: true }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["daily_plan"]["daily_tasks"]).to be_empty
        expect(DailyTask.exists?(task.id)).to be(false)
      end

      it "reorders daily tasks" do
        task1 = create(:daily_task, daily_plan: daily_plan, title: "First", position: 0)
        task2 = create(:daily_task, daily_plan: daily_plan, title: "Second", position: 1)

        patch "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}",
              params: { daily_plan: { daily_tasks_attributes: reorder_params(task1, task2) } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        tasks = json_response["daily_plan"]["daily_tasks"].sort_by { |t| t["position"] }
        expect(tasks.first["title"]).to eq("Second")
        expect(tasks.last["title"]).to eq("First")
      end

      it "adds top priorities" do
        patch "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}",
              params: {
                daily_plan: {
                  top_priorities_attributes: [
                    { title: "Priority 1", priority_order: 1 },
                    { title: "Priority 2", priority_order: 2 }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["daily_plan"]["top_priorities"].length).to eq(2)
      end

      it "updates existing top priorities" do
        priority = create(:top_priority, daily_plan: daily_plan, title: "Original")

        patch "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}",
              params: {
                daily_plan: {
                  top_priorities_attributes: [
                    { id: priority.id, title: "Updated" }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["daily_plan"]["top_priorities"].first["title"]).to eq("Updated")
      end

      it "marks priority as completed" do
        priority = create(:top_priority, daily_plan: daily_plan, title: "My priority", completed: false)

        patch "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}",
              params: {
                daily_plan: {
                  top_priorities_attributes: [
                    { id: priority.id, completed: true }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["daily_plan"]["top_priorities"].first["completed"]).to be true
        expect(priority.reload.completed).to be true
      end

      it "removes top priorities" do
        priority = create(:top_priority, daily_plan: daily_plan)

        patch "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}",
              params: {
                daily_plan: {
                  top_priorities_attributes: [
                    { id: priority.id, _destroy: true }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["daily_plan"]["top_priorities"]).to be_empty
      end
    end

    context "when trying to update another user's plan" do
      let(:other_member) { create(:user) }
      let(:other_plan) { create(:daily_plan, user: other_member, family: family) }

      before { create(:family_membership, :adult, family: family, user: other_member) }

      it "returns forbidden" do
        patch "/api/v1/families/#{family.id}/daily_plans/#{other_plan.id}",
              params: { daily_plan: { intention: "Hacked!" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "with invalid data" do
      it "returns errors for missing task title" do
        patch "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}",
              params: {
                daily_plan: {
                  daily_tasks_attributes: [
                    { title: "", position: 0 }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to be_present
      end

      it "returns errors for invalid priority order" do
        patch "/api/v1/families/#{family.id}/daily_plans/#{daily_plan.id}",
              params: {
                daily_plan: {
                  top_priorities_attributes: [
                    { title: "Priority", priority_order: 5 }
                  ]
                }
              },
              headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to be_present
      end
    end
  end

  def json_response
    response.parsed_body
  end

  def reorder_params(task1, task2)
    [{ id: task1.id, position: 1 }, { id: task2.id, position: 0 }]
  end
end
