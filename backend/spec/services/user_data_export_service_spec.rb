# frozen_string_literal: true

require "rails_helper"

RSpec.describe UserDataExportService do
  let(:user) { create(:user) }
  let(:family) { create(:family) }
  let(:membership) { create(:family_membership, user: user, family: family, role: :admin) }

  describe ".export" do
    subject(:export) { described_class.export(user) }

    before { membership } # ensure membership exists for all tests

    it "returns a hash with all user data" do
      expect(export).to be_a(Hash)
      expect(export).to include(
        :exported_at,
        :user,
        :families,
        :goals,
        :daily_plans,
        :reflections,
        :weekly_reviews,
        :streaks,
        :badges,
        :points,
        :notifications,
        :notification_preferences
      )
    end

    it "includes user basic data" do
      expect(export[:user]).to include(
        id: user.id,
        email: user.email,
        name: user.name
      )
    end

    it "includes family memberships" do
      expect(export[:families]).to be_an(Array)
      expect(export[:families].length).to eq(1)
      expect(export[:families].first).to include(
        family_name: family.name,
        role: "admin"
      )
    end

    context "with goals" do
      let(:goal) { create(:goal, creator: user, family: family, title: "Test Goal") }

      it "includes user created goals" do
        goal # create goal
        expect(export[:goals]).to be_an(Array)
        expect(export[:goals].length).to eq(1)
        expect(export[:goals].first[:title]).to eq("Test Goal")
      end
    end

    context "with daily plans" do
      let(:plan) { create(:daily_plan, user: user, family: family, intention: "Test intention") }
      let(:task) { create(:daily_task, daily_plan: plan, title: "Task 1") }
      let(:priority) { create(:top_priority, daily_plan: plan, title: "Priority 1") }

      it "includes daily plans with tasks and priorities" do
        task # create task
        priority # create priority
        expect(export[:daily_plans]).to be_an(Array)
        expect(export[:daily_plans].length).to eq(1)
        expect(export[:daily_plans].first[:intention]).to eq("Test intention")
        expect(export[:daily_plans].first[:tasks].first[:title]).to eq("Task 1")
        expect(export[:daily_plans].first[:priorities].first[:title]).to eq("Priority 1")
      end
    end

    context "with reflections" do
      let(:plan) { create(:daily_plan, user: user, family: family) }
      let(:reflection) { create(:reflection, daily_plan: plan, mood: :good) }
      let(:reflection_response) do
        create(:reflection_response, reflection: reflection, prompt: "Test", response: "Answer")
      end

      it "includes reflections with responses" do
        reflection_response # create response (which creates reflection and plan)
        expect(export[:reflections]).to be_an(Array)
        expect(export[:reflections].length).to eq(1)
        expect(export[:reflections].first[:mood]).to eq("good")
        expect(export[:reflections].first[:responses].first[:prompt]).to eq("Test")
      end
    end

    context "with weekly reviews" do
      let(:review) { create(:weekly_review, user: user, family: family, wins: ["Win 1"]) }

      it "includes weekly reviews" do
        review # create review
        expect(export[:weekly_reviews]).to be_an(Array)
        expect(export[:weekly_reviews].length).to eq(1)
        expect(export[:weekly_reviews].first[:wins]).to eq(["Win 1"])
      end
    end

    context "with streaks" do
      let(:streak) { create(:streak, user: user, streak_type: :daily_planning, current_count: 5) }

      it "includes streaks" do
        streak # create streak
        expect(export[:streaks]).to be_an(Array)
        expect(export[:streaks].length).to eq(1)
        expect(export[:streaks].first[:streak_type]).to eq("daily_planning")
        expect(export[:streaks].first[:current_count]).to eq(5)
      end
    end

    context "with badges" do
      let(:badge) { create(:badge, name: "First Goal") }
      let(:user_badge) { create(:user_badge, user: user, badge: badge) }

      it "includes earned badges" do
        user_badge # create user badge
        expect(export[:badges]).to be_an(Array)
        expect(export[:badges].length).to eq(1)
        expect(export[:badges].first[:badge_name]).to eq("First Goal")
      end
    end

    context "with points" do
      before do
        create(:points_ledger_entry, user: user, points: 50, activity_type: "complete_task")
        create(:points_ledger_entry, user: user, points: 20, activity_type: "complete_reflection")
      end

      it "includes points total and entries" do
        expect(export[:points][:total]).to eq(70)
        expect(export[:points][:entries]).to be_an(Array)
        expect(export[:points][:entries].length).to eq(2)
      end
    end

    context "with notifications" do
      before do
        create(:notification, user: user, title: "Test Notification")
      end

      it "includes notifications" do
        expect(export[:notifications]).to be_an(Array)
        expect(export[:notifications].length).to eq(1)
        expect(export[:notifications].first[:title]).to eq("Test Notification")
      end
    end

    context "with notification preferences" do
      let(:prefs) { create(:notification_preference, user: user, morning_planning: true, email: false) }

      it "includes notification preferences" do
        prefs # create preferences
        expect(export[:notification_preferences]).to be_a(Hash)
        expect(export[:notification_preferences][:channels][:email]).to be false
        expect(export[:notification_preferences][:reminders][:morning_planning][:enabled]).to be true
      end
    end

    context "without notification preferences" do
      it "returns empty hash for notification preferences" do
        expect(export[:notification_preferences]).to eq({})
      end
    end
  end
end
