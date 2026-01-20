# frozen_string_literal: true

require "rails_helper"

RSpec.describe Notification do
  describe "associations" do
    it { is_expected.to belong_to(:user) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:title) }
    it { is_expected.to validate_presence_of(:notification_type) }
  end

  describe "enums" do
    subject(:notification) { build(:notification) }

    it "defines notification_type enum" do
      expect(notification).to define_enum_for(:notification_type)
        .with_values(
          general: "general",
          reminder: "reminder",
          goal_update: "goal_update",
          family_invite: "family_invite",
          badge_earned: "badge_earned",
          streak_milestone: "streak_milestone",
          mention: "mention"
        )
        .backed_by_column_of_type(:string)
    end
  end

  describe "scopes" do
    let(:user) { create(:user) }

    describe ".unread" do
      it "returns only unread notifications" do
        unread = create(:notification, :unread, user: user)
        create(:notification, :read, user: user)

        expect(described_class.unread).to eq([unread])
      end
    end

    describe ".recent" do
      it "returns notifications ordered by created_at desc" do
        old = create(:notification, user: user, created_at: 2.days.ago)
        new = create(:notification, user: user, created_at: 1.hour.ago)

        expect(described_class.recent).to eq([new, old])
      end

      it "limits to 10 notifications" do
        15.times { create(:notification, user: user) }

        expect(described_class.recent.count).to eq(10)
      end
    end
  end

  describe "#mark_as_read!" do
    it "marks the notification as read" do
      notification = create(:notification, :unread)

      notification.mark_as_read!

      expect(notification.read).to be(true)
    end

    it "does nothing if already read" do
      notification = create(:notification, :read)

      expect { notification.mark_as_read! }.not_to change(notification, :read)
    end
  end

  describe "defaults" do
    it "defaults read to false" do
      notification = create(:notification, user: create(:user), title: "Test")

      expect(notification.read).to be(false)
    end

    it "defaults notification_type to general" do
      notification = described_class.new(user: create(:user), title: "Test")

      expect(notification.notification_type).to eq("general")
    end
  end
end
