# frozen_string_literal: true

require "rails_helper"

RSpec.describe NotificationPreference do
  describe "associations" do
    it { is_expected.to belong_to(:user) }
  end

  describe "validations" do
    describe "time format validations" do
      it { is_expected.to allow_value("07:00").for(:morning_planning_time) }
      it { is_expected.to allow_value("00:00").for(:morning_planning_time) }
      it { is_expected.to allow_value("23:59").for(:morning_planning_time) }
      it { is_expected.not_to allow_value("24:00").for(:morning_planning_time) }
      it { is_expected.not_to allow_value("7:00").for(:morning_planning_time) }
      it { is_expected.not_to allow_value("invalid").for(:morning_planning_time) }

      it { is_expected.to allow_value("20:00").for(:evening_reflection_time) }
      it { is_expected.not_to allow_value("25:00").for(:evening_reflection_time) }

      it { is_expected.to allow_value("18:00").for(:weekly_review_time) }
      it { is_expected.not_to allow_value("12:60").for(:weekly_review_time) }

      it { is_expected.to allow_value("22:00").for(:quiet_hours_start) }
      it { is_expected.to allow_value("07:00").for(:quiet_hours_end) }
    end

    describe "weekly_review_day validation" do
      it { is_expected.to allow_value(0).for(:weekly_review_day) }
      it { is_expected.to allow_value(6).for(:weekly_review_day) }
      it { is_expected.not_to allow_value(-1).for(:weekly_review_day) }
      it { is_expected.not_to allow_value(7).for(:weekly_review_day) }
    end
  end

  describe ".find_or_create_for" do
    let(:user) { create(:user) }

    context "when no preferences exist for the user" do
      it "creates new preferences" do
        expect do
          described_class.find_or_create_for(user)
        end.to change(described_class, :count).by(1)
      end

      it "returns the created preferences belonging to user" do
        prefs = described_class.find_or_create_for(user)
        expect(prefs).to be_persisted
        expect(prefs.user).to eq(user)
      end

      it "returns preferences with default channel settings" do
        prefs = described_class.find_or_create_for(user)
        expect(prefs.in_app).to be true
        expect(prefs.email).to be true
        expect(prefs.push).to be false
      end

      it "returns preferences with default reminder settings" do
        prefs = described_class.find_or_create_for(user)
        expect(prefs.morning_planning).to be true
        expect(prefs.morning_planning_time).to eq("07:00")
      end
    end

    context "when preferences already exist for the user" do
      let!(:existing_prefs) { create(:notification_preference, :custom_times, user: user) }

      it "does not create new preferences" do
        expect do
          described_class.find_or_create_for(user)
        end.not_to change(described_class, :count)
      end

      it "returns the existing preferences" do
        prefs = described_class.find_or_create_for(user)
        expect(prefs.id).to eq(existing_prefs.id)
        expect(prefs.morning_planning_time).to eq("06:30")
      end
    end
  end

  describe "#within_quiet_hours?" do
    let(:prefs) { create(:notification_preference, quiet_hours_start: "22:00", quiet_hours_end: "07:00") }

    context "when quiet hours span midnight" do
      it "returns true for times after start (22:00)" do
        time = Time.zone.local(2025, 1, 1, 23, 0)
        expect(prefs.within_quiet_hours?(time)).to be true
      end

      it "returns true for times before end (07:00)" do
        time = Time.zone.local(2025, 1, 1, 5, 0)
        expect(prefs.within_quiet_hours?(time)).to be true
      end

      it "returns false for times during the day" do
        time = Time.zone.local(2025, 1, 1, 12, 0)
        expect(prefs.within_quiet_hours?(time)).to be false
      end

      it "returns true at exactly the start time" do
        time = Time.zone.local(2025, 1, 1, 22, 0)
        expect(prefs.within_quiet_hours?(time)).to be true
      end

      it "returns false at exactly the end time" do
        time = Time.zone.local(2025, 1, 1, 7, 0)
        expect(prefs.within_quiet_hours?(time)).to be false
      end
    end

    context "when quiet hours do not span midnight" do
      let(:prefs) { create(:notification_preference, quiet_hours_start: "13:00", quiet_hours_end: "14:00") }

      it "returns true for times within the range" do
        time = Time.zone.local(2025, 1, 1, 13, 30)
        expect(prefs.within_quiet_hours?(time)).to be true
      end

      it "returns false for times outside the range" do
        time = Time.zone.local(2025, 1, 1, 12, 0)
        expect(prefs.within_quiet_hours?(time)).to be false
      end
    end
  end

  describe "#next_reminder_time" do
    let(:user) { create(:user) }

    context "with morning_planning reminder" do
      let(:prefs) do
        create(:notification_preference, user: user, morning_planning: true, morning_planning_time: "07:00")
      end

      it "returns nil if reminder is disabled" do
        prefs.update!(morning_planning: false)
        expect(prefs.next_reminder_time(:morning_planning, "America/New_York")).to be_nil
      end

      it "returns today's time if not yet passed" do
        tz = Time.find_zone("America/New_York")
        travel_to(tz.local(2025, 1, 15, 6, 0)) do
          next_time = prefs.next_reminder_time(:morning_planning, "America/New_York")
          expect(next_time.hour).to eq(7)
          expect(next_time.min).to eq(0)
          expect(next_time.day).to eq(15)
        end
      end

      it "returns tomorrow's time if already passed" do
        tz = Time.find_zone("America/New_York")
        travel_to(tz.local(2025, 1, 15, 8, 0)) do
          next_time = prefs.next_reminder_time(:morning_planning, "America/New_York")
          expect(next_time.hour).to eq(7)
          expect(next_time.day).to eq(16)
        end
      end
    end

    context "with weekly_review reminder" do
      let(:prefs) do
        create(:notification_preference, user: user, weekly_review: true,
                                         weekly_review_time: "18:00", weekly_review_day: 0) # Sunday
      end

      it "returns this week's day if not yet passed" do
        tz = Time.find_zone("America/New_York")
        travel_to(tz.local(2025, 1, 15, 12, 0)) do # Wednesday
          next_time = prefs.next_reminder_time(:weekly_review, "America/New_York")
          expect(next_time.wday).to eq(0) # Sunday
          expect(next_time.hour).to eq(18)
          expect(next_time.day).to eq(19) # Next Sunday
        end
      end

      it "returns next week's day if already passed" do
        tz = Time.find_zone("America/New_York")
        travel_to(tz.local(2025, 1, 19, 20, 0)) do # Sunday evening
          next_time = prefs.next_reminder_time(:weekly_review, "America/New_York")
          expect(next_time.wday).to eq(0) # Sunday
          expect(next_time.hour).to eq(18)
          expect(next_time.day).to eq(26) # Next Sunday
        end
      end
    end
  end

  describe "default values" do
    it "uses default time values from migration" do
      prefs = described_class.new
      expect(prefs).to have_attributes(
        morning_planning_time: "07:00",
        evening_reflection_time: "20:00",
        weekly_review_time: "18:00",
        weekly_review_day: 0
      )
    end

    it "uses default quiet hours values" do
      prefs = described_class.new
      expect(prefs).to have_attributes(quiet_hours_start: "22:00", quiet_hours_end: "07:00")
    end

    it "uses default channel boolean values" do
      prefs = described_class.new
      expect(prefs).to have_attributes(in_app: true, email: true, push: false)
    end

    it "uses default reminder boolean values" do
      prefs = described_class.new
      expect(prefs).to have_attributes(morning_planning: true, evening_reflection: true, weekly_review: true)
    end

    it "uses default tips values" do
      prefs = described_class.new
      expect(prefs).to have_attributes(tips_enabled: true, shown_tips: [])
    end
  end

  describe "#tip_shown?" do
    let(:prefs) { create(:notification_preference, shown_tips: %w[goals_page first_reflection]) }

    it "returns true for shown tips" do
      expect(prefs.tip_shown?("goals_page")).to be true
      expect(prefs.tip_shown?(:first_reflection)).to be true
    end

    it "returns false for tips not shown" do
      expect(prefs.tip_shown?("first_daily_plan")).to be false
    end
  end

  describe "#mark_tip_shown!" do
    let(:prefs) { create(:notification_preference, shown_tips: []) }

    it "adds a valid tip type to shown_tips" do
      expect(prefs.mark_tip_shown!("goals_page")).to be true
      expect(prefs.reload.shown_tips).to include("goals_page")
    end

    it "returns false for already shown tips" do
      prefs.update(shown_tips: ["goals_page"])
      expect(prefs.mark_tip_shown!("goals_page")).to be false
    end

    it "returns false for invalid tip types" do
      expect(prefs.mark_tip_shown!("invalid_tip")).to be false
      expect(prefs.reload.shown_tips).to be_empty
    end

    it "appends to existing shown_tips" do
      prefs.update(shown_tips: ["goals_page"])
      prefs.mark_tip_shown!("first_reflection")
      expect(prefs.reload.shown_tips).to contain_exactly("goals_page", "first_reflection")
    end
  end

  describe "#should_show_tip?" do
    let(:prefs) { create(:notification_preference, tips_enabled: true, shown_tips: ["goals_page"]) }

    it "returns true for tips not yet shown when tips are enabled" do
      expect(prefs.should_show_tip?("first_reflection")).to be true
    end

    it "returns false for already shown tips" do
      expect(prefs.should_show_tip?("goals_page")).to be false
    end

    it "returns false when tips are disabled" do
      prefs.update(tips_enabled: false)
      expect(prefs.should_show_tip?("first_reflection")).to be false
    end
  end
end
