# frozen_string_literal: true

require "rails_helper"

RSpec.describe OutreachHistory do
  describe "validations" do
    subject { build(:outreach_history) }

    it { is_expected.to validate_presence_of(:outreach_type) }
    it { is_expected.to validate_presence_of(:channel) }
    it { is_expected.to validate_presence_of(:sent_at) }

    it "validates outreach_type inclusion" do
      expect(build(:outreach_history, outreach_type: "missed_checkin")).to be_valid
      expect(build(:outreach_history, outreach_type: "invalid")).not_to be_valid
    end

    it "validates channel inclusion" do
      expect(build(:outreach_history, channel: "push")).to be_valid
      expect(build(:outreach_history, channel: "email")).to be_valid
      expect(build(:outreach_history, channel: "sms")).to be_valid
      expect(build(:outreach_history, channel: "invalid")).not_to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:user) }
  end

  describe "scopes" do
    let(:user) { create(:user) }

    describe ".within_period" do
      it "returns records within the time range" do
        old_history = create(:outreach_history, user: user, sent_at: 2.days.ago)
        recent_history = create(:outreach_history, user: user, sent_at: 1.hour.ago)

        results = described_class.within_period(1.day.ago, Time.current)

        expect(results).to include(recent_history)
        expect(results).not_to include(old_history)
      end
    end

    describe ".today" do
      it "returns records from today" do
        yesterday_history = create(:outreach_history, user: user, sent_at: 1.day.ago)
        today_history = create(:outreach_history, user: user, sent_at: Time.current)

        results = described_class.today

        expect(results).to include(today_history)
        expect(results).not_to include(yesterday_history)
      end
    end

    describe ".for_type" do
      it "filters by outreach type" do
        checkin = create(:outreach_history, user: user, outreach_type: "missed_checkin")
        reflection = create(:outreach_history, user: user, outreach_type: "missed_reflection")

        results = described_class.for_type("missed_checkin")

        expect(results).to include(checkin)
        expect(results).not_to include(reflection)
      end
    end

    describe ".via_channel" do
      it "filters by channel" do
        push = create(:outreach_history, user: user, channel: "push")
        email = create(:outreach_history, user: user, channel: "email")

        results = described_class.via_channel("push")

        expect(results).to include(push)
        expect(results).not_to include(email)
      end
    end
  end

  describe ".already_sent_today?" do
    let(:user) { create(:user) }

    it "returns true if outreach was sent today" do
      create(:outreach_history, user: user, outreach_type: "missed_checkin", sent_at: Time.current)

      expect(described_class.already_sent_today?(user: user, outreach_type: "missed_checkin")).to be true
    end

    it "returns false if outreach was sent yesterday" do
      create(:outreach_history, user: user, outreach_type: "missed_checkin", sent_at: 1.day.ago)

      expect(described_class.already_sent_today?(user: user, outreach_type: "missed_checkin")).to be false
    end

    it "returns false for different outreach type" do
      create(:outreach_history, user: user, outreach_type: "missed_checkin", sent_at: Time.current)

      expect(described_class.already_sent_today?(user: user, outreach_type: "missed_reflection")).to be false
    end

    it "returns false for different user" do
      other_user = create(:user)
      create(:outreach_history, user: other_user, outreach_type: "missed_checkin", sent_at: Time.current)

      expect(described_class.already_sent_today?(user: user, outreach_type: "missed_checkin")).to be false
    end
  end

  describe ".record!" do
    let(:user) { create(:user) }

    it "creates an outreach history record" do
      expect do
        described_class.record!(user: user, outreach_type: :missed_checkin, channel: :push)
      end.to change(described_class, :count).by(1)
    end

    it "sets all attributes correctly" do
      freeze_time do
        history = described_class.record!(user: user, outreach_type: :missed_reflection, channel: :email)

        expect(history.user).to eq user
        expect(history.outreach_type).to eq "missed_reflection"
        expect(history.channel).to eq "email"
        expect(history.sent_at).to be_within(1.second).of(Time.current)
      end
    end

    it "converts symbols to strings" do
      history = described_class.record!(user: user, outreach_type: :inactive_7_days, channel: :sms)

      expect(history.outreach_type).to eq "inactive_7_days"
      expect(history.channel).to eq "sms"
    end
  end
end
