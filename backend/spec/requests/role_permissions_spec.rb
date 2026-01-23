# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Role Permissions" do
  include AuthHelpers

  let(:family) { create(:family) }
  let(:users) do
    {
      admin: create(:user, name: "Admin User"),
      adult: create(:user, name: "Adult User"),
      teen: create(:user, name: "Teen User"),
      child: create(:user, name: "Child User"),
      observer: create(:user, name: "Observer User")
    }
  end

  before do
    create(:family_membership, :admin, family: family, user: users[:admin])
    create(:family_membership, :adult, family: family, user: users[:adult])
    create(:family_membership, :teen, family: family, user: users[:teen])
    create(:family_membership, :child, family: family, user: users[:child])
    create(:family_membership, :observer, family: family, user: users[:observer])
  end

  describe "Goals CRUD" do
    let(:family_goal) { create(:goal, :family_visible, family: family, creator: users[:admin]) }

    describe "GET /api/v1/families/:family_id/goals (index)" do
      before { family_goal }

      it "admin can view goals" do
        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(users[:admin])
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["goals"]).not_to be_empty
      end

      it "adult can view goals" do
        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(users[:adult])
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["goals"]).not_to be_empty
      end

      it "teen can view goals" do
        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(users[:teen])
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["goals"]).not_to be_empty
      end

      it "child can view goals" do
        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(users[:child])
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["goals"]).not_to be_empty
      end

      it "observer can view goals" do
        get "/api/v1/families/#{family.id}/goals", headers: auth_headers(users[:observer])
        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["goals"]).not_to be_empty
      end
    end

    describe "POST /api/v1/families/:family_id/goals (create)" do
      let(:goal_params) { { goal: { title: "New Goal", time_scale: "weekly" } } }

      it "admin can create goals" do
        post "/api/v1/families/#{family.id}/goals", params: goal_params, headers: auth_headers(users[:admin])
        expect(response).to have_http_status(:created)
      end

      it "adult can create goals" do
        post "/api/v1/families/#{family.id}/goals", params: goal_params, headers: auth_headers(users[:adult])
        expect(response).to have_http_status(:created)
      end

      it "teen cannot create goals" do
        post "/api/v1/families/#{family.id}/goals", params: goal_params, headers: auth_headers(users[:teen])
        expect(response).to have_http_status(:forbidden)
      end

      it "child cannot create goals" do
        post "/api/v1/families/#{family.id}/goals", params: goal_params, headers: auth_headers(users[:child])
        expect(response).to have_http_status(:forbidden)
      end

      it "observer cannot create goals" do
        post "/api/v1/families/#{family.id}/goals", params: goal_params, headers: auth_headers(users[:observer])
        expect(response).to have_http_status(:forbidden)
      end
    end

    describe "PATCH /api/v1/families/:family_id/goals/:id (update)" do
      it "admin can update any family goal" do
        patch "/api/v1/families/#{family.id}/goals/#{family_goal.id}",
              params: { goal: { title: "Updated Title" } }, headers: auth_headers(users[:admin])
        expect(response).to have_http_status(:ok)
      end

      it "adult can update family goal" do
        patch "/api/v1/families/#{family.id}/goals/#{family_goal.id}",
              params: { goal: { title: "Updated Title" } }, headers: auth_headers(users[:adult])
        expect(response).to have_http_status(:ok)
      end

      it "teen cannot update goals" do
        patch "/api/v1/families/#{family.id}/goals/#{family_goal.id}",
              params: { goal: { title: "Updated Title" } }, headers: auth_headers(users[:teen])
        expect(response).to have_http_status(:forbidden)
      end

      it "child cannot update goals" do
        patch "/api/v1/families/#{family.id}/goals/#{family_goal.id}",
              params: { goal: { title: "Updated Title" } }, headers: auth_headers(users[:child])
        expect(response).to have_http_status(:forbidden)
      end

      it "observer cannot update goals" do
        patch "/api/v1/families/#{family.id}/goals/#{family_goal.id}",
              params: { goal: { title: "Updated Title" } }, headers: auth_headers(users[:observer])
        expect(response).to have_http_status(:forbidden)
      end
    end

    describe "DELETE /api/v1/families/:family_id/goals/:id (destroy)" do
      it "admin can delete goals" do
        goal = create(:goal, :family_visible, family: family, creator: users[:admin])
        delete "/api/v1/families/#{family.id}/goals/#{goal.id}", headers: auth_headers(users[:admin])
        expect(response).to have_http_status(:ok)
      end

      it "adult can delete goals" do
        goal = create(:goal, :family_visible, family: family, creator: users[:adult])
        delete "/api/v1/families/#{family.id}/goals/#{goal.id}", headers: auth_headers(users[:adult])
        expect(response).to have_http_status(:ok)
      end

      it "teen cannot delete goals" do
        delete "/api/v1/families/#{family.id}/goals/#{family_goal.id}", headers: auth_headers(users[:teen])
        expect(response).to have_http_status(:forbidden)
      end

      it "child cannot delete goals" do
        delete "/api/v1/families/#{family.id}/goals/#{family_goal.id}", headers: auth_headers(users[:child])
        expect(response).to have_http_status(:forbidden)
      end

      it "observer cannot delete goals" do
        delete "/api/v1/families/#{family.id}/goals/#{family_goal.id}", headers: auth_headers(users[:observer])
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DailyPlans" do
    let(:admin_plan) { create(:daily_plan, family: family, user: users[:admin]) }

    describe "GET /api/v1/families/:family_id/daily_plans (index)" do
      before { admin_plan }

      it "all roles can view daily plans", :aggregate_failures do
        users.each do |role, user|
          get "/api/v1/families/#{family.id}/daily_plans", headers: auth_headers(user)
          expect(response).to have_http_status(:ok), "Expected #{role} to access daily plans"
        end
      end
    end

    describe "GET /api/v1/families/:family_id/daily_plans/today" do
      it "all roles can view today's plan", :aggregate_failures do
        users.each do |role, user|
          get "/api/v1/families/#{family.id}/daily_plans/today", headers: auth_headers(user)
          expect(response).to have_http_status(:ok), "Expected #{role} to access today's plan"
        end
      end
    end

    describe "PATCH /api/v1/families/:family_id/daily_plans/:id (update)" do
      it "user can update own daily plan" do
        patch "/api/v1/families/#{family.id}/daily_plans/#{admin_plan.id}",
              params: { daily_plan: { shutdown_shipped: "Completed tasks" } }, headers: auth_headers(users[:admin])
        expect(response).to have_http_status(:ok)
      end

      it "other users cannot update someone else's daily plan", :aggregate_failures do
        %i[adult teen child observer].each do |role|
          patch "/api/v1/families/#{family.id}/daily_plans/#{admin_plan.id}",
                params: { daily_plan: { shutdown_shipped: "Completed tasks" } }, headers: auth_headers(users[role])
          expect(response).to have_http_status(:forbidden),
                              "Expected #{role} to be forbidden from updating admin's plan"
        end
      end
    end
  end

  describe "WeeklyReviews" do
    let(:admin_review) do
      create(:weekly_review, family: family, user: users[:admin], week_start_date: Date.current.beginning_of_week)
    end

    describe "GET /api/v1/families/:family_id/weekly_reviews (index)" do
      before { admin_review }

      it "all roles can view weekly reviews", :aggregate_failures do
        users.each do |role, user|
          get "/api/v1/families/#{family.id}/weekly_reviews", headers: auth_headers(user)
          expect(response).to have_http_status(:ok), "Expected #{role} to access weekly reviews"
        end
      end
    end

    describe "GET /api/v1/families/:family_id/weekly_reviews/current" do
      it "all roles can view current weekly review", :aggregate_failures do
        users.each do |role, user|
          get "/api/v1/families/#{family.id}/weekly_reviews/current", headers: auth_headers(user)
          expect(response).to have_http_status(:ok), "Expected #{role} to access current review"
        end
      end
    end

    describe "PATCH /api/v1/families/:family_id/weekly_reviews/:id (update)" do
      it "user can update own weekly review" do
        patch "/api/v1/families/#{family.id}/weekly_reviews/#{admin_review.id}",
              params: { weekly_review: { wins_shipped: "Great wins" } }, headers: auth_headers(users[:admin])
        expect(response).to have_http_status(:ok)
      end

      it "other users cannot update someone else's weekly review", :aggregate_failures do
        %i[adult teen child observer].each do |role|
          patch "/api/v1/families/#{family.id}/weekly_reviews/#{admin_review.id}",
                params: { weekly_review: { wins_shipped: "Great wins" } }, headers: auth_headers(users[role])
          expect(response).to have_http_status(:forbidden),
                              "Expected #{role} to be forbidden from updating admin's review"
        end
      end
    end

    describe "DELETE /api/v1/families/:family_id/weekly_reviews/:id (destroy)" do
      it "user can delete own weekly review" do
        review = create(:weekly_review, family: family, user: users[:admin])
        delete "/api/v1/families/#{family.id}/weekly_reviews/#{review.id}", headers: auth_headers(users[:admin])
        expect(response).to have_http_status(:ok)
      end

      it "other users cannot delete someone else's weekly review", :aggregate_failures do
        %i[adult teen child observer].each do |role|
          delete "/api/v1/families/#{family.id}/weekly_reviews/#{admin_review.id}", headers: auth_headers(users[role])
          expect(response).to have_http_status(:forbidden),
                              "Expected #{role} to be forbidden from deleting admin's review"
        end
      end
    end
  end

  describe "Non-member access" do
    let(:non_member) { create(:user) }

    it "non-member cannot view family goals" do
      create(:goal, :family_visible, family: family, creator: users[:admin])
      get "/api/v1/families/#{family.id}/goals", headers: auth_headers(non_member)
      expect(response).to have_http_status(:forbidden)
    end

    it "non-member cannot create goals in family" do
      post "/api/v1/families/#{family.id}/goals",
           params: { goal: { title: "Test", time_scale: "weekly" } },
           headers: auth_headers(non_member)
      expect(response).to have_http_status(:forbidden)
    end

    it "non-member cannot view family daily plans" do
      get "/api/v1/families/#{family.id}/daily_plans", headers: auth_headers(non_member)
      expect(response).to have_http_status(:forbidden)
    end

    it "non-member cannot view family weekly reviews" do
      get "/api/v1/families/#{family.id}/weekly_reviews", headers: auth_headers(non_member)
      expect(response).to have_http_status(:forbidden)
    end
  end
end
