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
        :daily_plans,
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
