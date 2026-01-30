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

  describe "Non-member access" do
    let(:non_member) { create(:user) }

    it "non-member cannot view family daily plans" do
      get "/api/v1/families/#{family.id}/daily_plans", headers: auth_headers(non_member)
      expect(response).to have_http_status(:forbidden)
    end
  end
end
