# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Mentions" do
  let(:family) { create(:family) }
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }

  before do
    create(:family_membership, family: family, user: user)
    create(:family_membership, family: family, user: other_user)
    auth_headers(user)
  end

  describe "GET /api/v1/families/:family_id/mentions/recent" do
    context "when user has no recent mentions" do
      it "returns empty array" do
        get "/api/v1/families/#{family.id}/mentions/recent"

        expect(response).to have_http_status(:ok)
        expect(json_response["mentions"]).to eq([])
        expect(json_response["count"]).to eq(0)
      end
    end

    context "when user has recent mentions" do
      it "returns recent mentions with all expected fields", :aggregate_failures do
        goal = create(:goal, family: family, creator: other_user, title: "Test Goal")
        mention = create(:mention, mentionable: goal, user: other_user, mentioned_user: user, text_field: "title")

        get "/api/v1/families/#{family.id}/mentions/recent"

        expect(response).to have_http_status(:ok)
        expect(json_response["count"]).to eq(1)

        mention_data = json_response["mentions"].first
        expect(mention_data).to include(
          "id" => mention.id,
          "mentionable_type" => "Goal",
          "mentionable_id" => goal.id,
          "mentionable_title" => "Test Goal",
          "text_field" => "title"
        )
        expect(mention_data["mentioner"]).to include("id" => other_user.id, "name" => other_user.name)
        expect(mention_data["mentionable_link"]).to include("/families/#{family.id}/goals")
      end
    end

    context "when user has mentions in different mentionable types" do
      it "returns all recent mentions with correct details", :aggregate_failures do
        goal = create(:goal, family: family, creator: other_user, title: "Test Goal")
        daily_plan = create(:daily_plan, family: family, user: user, date: Date.current)
        weekly_review = create(:weekly_review, family: family, user: other_user)

        create(:mention, mentionable: goal, user: other_user, mentioned_user: user, text_field: "title")
        create(:mention, mentionable: daily_plan, user: other_user, mentioned_user: user,
                         text_field: "shutdown_shipped")
        create(:mention, mentionable: weekly_review, user: other_user, mentioned_user: user,
                         text_field: "wins_shipped")

        get "/api/v1/families/#{family.id}/mentions/recent"

        expect(response).to have_http_status(:ok)
        expect(json_response["mentions"].size).to eq(3)
        expect(json_response["count"]).to eq(3)

        types = json_response["mentions"].pluck("mentionable_type")
        expect(types).to contain_exactly("Goal", "DailyPlan", "WeeklyReview")
      end
    end

    context "when mentions are older than 7 days" do
      it "does not return old mentions" do
        goal = create(:goal, family: family, creator: other_user, title: "Old Goal")
        mention = create(:mention, mentionable: goal, user: other_user, mentioned_user: user, text_field: "title")
        mention.update_column(:created_at, 8.days.ago) # rubocop:disable Rails/SkipsModelValidations

        get "/api/v1/families/#{family.id}/mentions/recent"

        expect(response).to have_http_status(:ok)
        expect(json_response["mentions"]).to eq([])
        expect(json_response["count"]).to eq(0)
      end
    end

    context "when user is not a family member" do
      it "returns forbidden" do
        non_member = create(:user)
        Warden.test_reset!
        auth_headers(non_member)

        get "/api/v1/families/#{family.id}/mentions/recent"

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when family does not exist" do
      it "returns not found" do
        get "/api/v1/families/99999/mentions/recent"

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
