# frozen_string_literal: true

# rubocop:disable RSpec/NestedGroups, RSpec/LetSetup
require "rails_helper"

RSpec.describe ReengagementDetectionService do
  let(:timezone) { "America/New_York" }
  let(:family) { create(:family, timezone: timezone) }
  let(:test_date) { Date.new(2026, 1, 13) }

  describe ".detect_missed_checkins" do
    let!(:user) do
      create(:user).tap do |u|
        create(:family_membership, user: u, family: family, role: :admin)
        create(:notification_preference, user: u, morning_planning: true, evening_reflection: true,
                                         reengagement_enabled: true)
      end
    end

    context "when user has morning planning enabled" do
      context "when it is after noon in user's timezone" do
        around do |example|
          # Set time to 2pm in the family's timezone
          travel_to Time.find_zone(timezone).local(2026, 1, 13, 14, 0, 0) do
            example.run
          end
        end

        context "when user has no daily plan for today" do
          it "includes the user as a missed checkin candidate" do
            candidates = described_class.detect_missed_checkins

            expect(candidates.length).to eq(1)
            expect(candidates.first.user).to eq(user)
            expect(candidates.first.reason).to eq(:missed_checkin)
            expect(candidates.first.priority).to eq(1)
          end
        end

        context "when user has a daily plan with tasks" do
          before do
            plan = create(:daily_plan, user: user, family: family, date: test_date)
            create(:daily_task, daily_plan: plan, title: "Test task")
          end

          it "does not include the user" do
            candidates = described_class.detect_missed_checkins

            expect(candidates).to be_empty
          end
        end

        context "when user has a daily plan with intention" do
          before do
            create(:daily_plan, user: user, family: family, date: test_date, intention: "Be productive")
          end

          it "does not include the user" do
            candidates = described_class.detect_missed_checkins

            expect(candidates).to be_empty
          end
        end

        context "when user has an empty daily plan (no tasks, no intention)" do
          before do
            create(:daily_plan, user: user, family: family, date: test_date, intention: nil)
          end

          it "includes the user as missed checkin" do
            candidates = described_class.detect_missed_checkins

            expect(candidates.length).to eq(1)
            expect(candidates.first.reason).to eq(:missed_checkin)
          end
        end

        context "when user has reengagement_enabled set to false" do
          before do
            user.notification_preference.update!(reengagement_enabled: false)
          end

          it "does not include the user" do
            candidates = described_class.detect_missed_checkins

            expect(candidates).to be_empty
          end
        end

        context "when user has morning_planning disabled" do
          before do
            user.notification_preference.update!(morning_planning: false)
          end

          it "does not include the user" do
            candidates = described_class.detect_missed_checkins

            expect(candidates).to be_empty
          end
        end

        context "when it is within quiet hours" do
          before do
            user.notification_preference.update!(quiet_hours_start: "13:00", quiet_hours_end: "15:00")
          end

          it "does not include the user" do
            candidates = described_class.detect_missed_checkins

            expect(candidates).to be_empty
          end
        end
      end

      context "when it is before noon in user's timezone" do
        around do |example|
          travel_to Time.find_zone(timezone).local(2026, 1, 13, 10, 0, 0) do
            example.run
          end
        end

        it "does not include the user (too early to check)" do
          candidates = described_class.detect_missed_checkins

          expect(candidates).to be_empty
        end
      end
    end

  end

  describe ".detect_missed_reflections" do
    let!(:user) do
      create(:user).tap do |u|
        create(:family_membership, user: u, family: family, role: :admin)
        # Set quiet hours to 23:00-06:00 to avoid overlapping with 22:30 test time
        create(:notification_preference, user: u,
                                         morning_planning: true,
                                         evening_reflection: true,
                                         reengagement_enabled: true,
                                         quiet_hours_start: "23:00",
                                         quiet_hours_end: "06:00")
      end
    end

    context "when it is after 10pm in user's timezone" do
      around do |example|
        # Set time to 10:30pm in the family's timezone
        travel_to Time.find_zone(timezone).local(2026, 1, 13, 22, 30, 0) do
          example.run
        end
      end

      context "when user has a daily plan but no evening reflection" do
        before do
          create(:daily_plan, user: user, family: family, date: test_date)
        end

        it "includes the user as a missed reflection candidate" do
          candidates = described_class.detect_missed_reflections

          expect(candidates.length).to eq(1)
          expect(candidates.first.user).to eq(user)
          expect(candidates.first.reason).to eq(:missed_reflection)
          expect(candidates.first.priority).to eq(2)
        end
      end

      context "when user has a daily plan with a completed evening reflection" do
        before do
          plan = create(:daily_plan, user: user, family: family, date: test_date)
          reflection = create(:reflection, daily_plan: plan, reflection_type: :evening)
          create(:reflection_response, reflection: reflection, prompt: "What went well?", response: "Many things")
        end

        it "does not include the user" do
          candidates = described_class.detect_missed_reflections

          expect(candidates).to be_empty
        end
      end

      context "when user has a daily plan with an incomplete evening reflection (no responses)" do
        before do
          plan = create(:daily_plan, user: user, family: family, date: test_date)
          create(:reflection, daily_plan: plan, reflection_type: :evening)
        end

        it "includes the user" do
          candidates = described_class.detect_missed_reflections

          expect(candidates.length).to eq(1)
        end
      end

      context "when user has no daily plan for today" do
        it "does not include the user (no plan = no reflection expected)" do
          candidates = described_class.detect_missed_reflections

          expect(candidates).to be_empty
        end
      end

      context "when user has reengagement_enabled set to false" do
        before do
          create(:daily_plan, user: user, family: family, date: test_date)
          user.notification_preference.update!(reengagement_enabled: false)
        end

        it "does not include the user" do
          candidates = described_class.detect_missed_reflections

          expect(candidates).to be_empty
        end
      end

      context "when user has evening_reflection disabled" do
        before do
          create(:daily_plan, user: user, family: family, date: test_date)
          user.notification_preference.update!(evening_reflection: false)
        end

        it "does not include the user" do
          candidates = described_class.detect_missed_reflections

          expect(candidates).to be_empty
        end
      end

      context "when it is within quiet hours" do
        before do
          create(:daily_plan, user: user, family: family, date: test_date)
          user.notification_preference.update!(quiet_hours_start: "22:00", quiet_hours_end: "23:59")
        end

        it "does not include the user" do
          candidates = described_class.detect_missed_reflections

          expect(candidates).to be_empty
        end
      end
    end

    context "when it is before 10pm in user's timezone" do
      around do |example|
        travel_to Time.find_zone(timezone).local(2026, 1, 13, 21, 0, 0) do
          example.run
        end
      end

      before do
        create(:daily_plan, user: user, family: family, date: test_date)
      end

      it "does not include the user (too early to check)" do
        candidates = described_class.detect_missed_reflections

        expect(candidates).to be_empty
      end
    end
  end

  describe ".detect_inactive_users" do
    let!(:user) do
      create(:user).tap do |u|
        create(:family_membership, user: u, family: family, role: :admin)
        create(:notification_preference, user: u, morning_planning: true, evening_reflection: true,
                                         reengagement_enabled: true)
      end
    end

    context "when user has been inactive for 3 days" do
      before do
        user.update!(last_active_at: 3.days.ago)
      end

      it "includes the user with inactive_3_days reason" do
        candidates = described_class.detect_inactive_users

        expect(candidates.length).to eq(1)
        expect(candidates.first.user).to eq(user)
        expect(candidates.first.reason).to eq(:inactive_3_days)
        expect(candidates.first.priority).to eq(6)
      end
    end

    context "when user has been inactive for 7 days" do
      before do
        user.update!(last_active_at: 7.days.ago)
      end

      it "includes the user with inactive_7_days reason" do
        candidates = described_class.detect_inactive_users

        expect(candidates.length).to eq(1)
        expect(candidates.first.reason).to eq(:inactive_7_days)
        expect(candidates.first.priority).to eq(5)
      end
    end

    context "when user has been inactive for 14 days" do
      before do
        user.update!(last_active_at: 14.days.ago)
      end

      it "includes the user with inactive_14_days reason" do
        candidates = described_class.detect_inactive_users

        expect(candidates.length).to eq(1)
        expect(candidates.first.reason).to eq(:inactive_14_days)
        expect(candidates.first.priority).to eq(4)
      end
    end

    context "when user has been inactive for 30+ days" do
      before do
        user.update!(last_active_at: 30.days.ago)
      end

      it "includes the user with inactive_30_days reason" do
        candidates = described_class.detect_inactive_users

        expect(candidates.length).to eq(1)
        expect(candidates.first.reason).to eq(:inactive_30_days)
        expect(candidates.first.priority).to eq(3)
      end
    end

    context "when user has been inactive for only 2 days" do
      before do
        user.update!(last_active_at: 2.days.ago)
      end

      it "does not include the user" do
        candidates = described_class.detect_inactive_users

        expect(candidates).to be_empty
      end
    end

    context "when user has never been active (nil last_active_at)" do
      before do
        user.update!(last_active_at: nil)
      end

      it "does not include the user" do
        candidates = described_class.detect_inactive_users

        expect(candidates).to be_empty
      end
    end

    context "when user has reengagement_enabled set to false" do
      before do
        user.update!(last_active_at: 7.days.ago)
        user.notification_preference.update!(reengagement_enabled: false)
      end

      it "does not include the user" do
        candidates = described_class.detect_inactive_users

        expect(candidates).to be_empty
      end
    end

    context "with custom thresholds" do
      before do
        user.update!(last_active_at: 5.days.ago)
      end

      it "uses provided thresholds" do
        candidates = described_class.detect_inactive_users(thresholds: [5, 10])

        expect(candidates.length).to eq(1)
        expect(candidates.first.reason).to eq(:inactive_5_days)
      end
    end
  end

  describe ".detect_users_for_outreach" do
    let!(:user) do
      create(:user).tap do |u|
        create(:family_membership, user: u, family: family, role: :admin)
        # Set quiet hours to 23:00-06:00 to avoid overlapping with 22:30 test time
        create(:notification_preference, user: u,
                                         morning_planning: true,
                                         evening_reflection: true,
                                         reengagement_enabled: true,
                                         quiet_hours_start: "23:00",
                                         quiet_hours_end: "06:00")
      end
    end

    context "when user has both missed checkin and missed reflection" do
      around do |example|
        travel_to Time.find_zone(timezone).local(2026, 1, 13, 22, 30, 0) do
          example.run
        end
      end

      before do
        # User has daily plan but no tasks (missed checkin counts)
        create(:daily_plan, user: user, family: family, date: test_date, intention: nil)
      end

      it "returns candidates sorted by priority" do
        candidates = described_class.detect_users_for_outreach

        # Should have missed checkin (priority 1) and missed reflection (priority 2)
        expect(candidates.length).to eq(2)
        expect(candidates.first.priority).to eq(1)
        expect(candidates.last.priority).to eq(2)
      end
    end

    context "when multiple users have different issues" do
      let!(:user2) do
        create(:user).tap do |u|
          create(:family_membership, user: u, family: family, role: :adult)
          # Set quiet hours to 23:00-06:00 to avoid overlapping with 22:30 test time
          create(:notification_preference, user: u,
                                           morning_planning: true,
                                           evening_reflection: true,
                                           reengagement_enabled: true,
                                           quiet_hours_start: "23:00",
                                           quiet_hours_end: "06:00")
          u.update!(last_active_at: 7.days.ago)
        end
      end

      around do |example|
        travel_to Time.find_zone(timezone).local(2026, 1, 13, 22, 30, 0) do
          example.run
        end
      end

      before do
        # User 1 has empty daily plan (missed checkin + missed reflection)
        create(:daily_plan, user: user, family: family, date: test_date, intention: nil)
      end

      it "combines all candidates and sorts by priority" do
        candidates = described_class.detect_users_for_outreach

        reasons = candidates.map(&:reason)

        expect(reasons).to include(:missed_checkin)
        expect(reasons).to include(:missed_reflection)
        expect(reasons).to include(:inactive_7_days)

        # Verify sorted by priority
        priorities = candidates.map(&:priority)
        expect(priorities).to eq(priorities.sort)
      end
    end
  end

  describe ".missed_checkin_for_family?" do
    let!(:user) do
      create(:user).tap do |u|
        create(:family_membership, user: u, family: family, role: :admin)
        create(:notification_preference, user: u, morning_planning: true, evening_reflection: true,
                                         reengagement_enabled: true)
      end
    end

    context "with different timezones" do
      let(:utc_user) do
        create(:user).tap do |u|
          create(:notification_preference, user: u,
                                           morning_planning: true,
                                           reengagement_enabled: true,
                                           quiet_hours_start: "23:00",
                                           quiet_hours_end: "06:00")
        end
      end
      let(:pacific_user) do
        create(:user).tap do |u|
          create(:notification_preference, user: u,
                                           morning_planning: true,
                                           reengagement_enabled: true,
                                           quiet_hours_start: "23:00",
                                           quiet_hours_end: "06:00")
        end
      end
      let(:utc_family) { create(:family, timezone: "UTC") }
      let(:pacific_family) { create(:family, timezone: "America/Los_Angeles") }

      before do
        create(:family_membership, user: utc_user, family: utc_family, role: :adult)
        create(:family_membership, user: pacific_user, family: pacific_family, role: :adult)
      end

      it "checks deadline in each family's timezone" do
        # 1pm UTC = 5am Pacific
        travel_to Time.utc(2026, 1, 13, 13, 0, 0) do
          # UTC is past noon, Pacific is not
          expect(described_class.missed_checkin_for_family?(utc_user, utc_family)).to be true
          expect(described_class.missed_checkin_for_family?(pacific_user, pacific_family)).to be false
        end
      end
    end
  end

  describe ".missed_reflection_for_family?" do
    context "with different timezones" do
      let(:utc_family) { create(:family, timezone: "UTC") }
      let(:utc_user) do
        create(:user).tap do |u|
          create(:family_membership, user: u, family: utc_family, role: :admin)
          # Set quiet hours to 23:00-06:00 to avoid overlapping with 22:30 test time
          create(:notification_preference, user: u,
                                           morning_planning: true,
                                           evening_reflection: true,
                                           reengagement_enabled: true,
                                           quiet_hours_start: "23:00",
                                           quiet_hours_end: "06:00")
        end
      end

      it "checks deadline in family's timezone" do
        # Create daily plan for today in UTC - must be Jan 13, 2026
        create(:daily_plan, user: utc_user, family: utc_family, date: Date.new(2026, 1, 13))

        travel_to Time.utc(2026, 1, 13, 22, 30, 0) do
          expect(described_class.missed_reflection_for_family?(utc_user, utc_family)).to be true
        end

        # Before 10pm UTC, should not trigger
        travel_to Time.utc(2026, 1, 13, 21, 30, 0) do
          expect(described_class.missed_reflection_for_family?(utc_user, utc_family)).to be false
        end
      end
    end
  end
end

# rubocop:enable RSpec/NestedGroups, RSpec/LetSetup
