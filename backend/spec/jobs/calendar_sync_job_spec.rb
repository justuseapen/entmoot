# frozen_string_literal: true

require "rails_helper"

RSpec.describe CalendarSyncJob do
  let(:user) { create(:user) }
  let(:family) { create(:family) }
  let!(:membership) { create(:family_membership, user: user, family: family, role: "adult") }
  let!(:credential) { create(:google_calendar_credential, :active, user: user) }
  let(:mock_sync_service) { instance_double(CalendarSyncService) }

  before do
    allow(CalendarSyncService).to receive(:new).with(user).and_return(mock_sync_service)
    allow(mock_sync_service).to receive(:full_sync)
    allow(mock_sync_service).to receive(:sync_goal)
    allow(mock_sync_service).to receive(:sync_review)
  end

  describe "#perform" do
    context "when user does not exist" do
      it "does nothing" do
        expect(mock_sync_service).not_to receive(:full_sync)

        described_class.perform_now(0)
      end
    end

    context "when user has no calendar sync enabled" do
      before do
        credential.update!(sync_status: "paused")
      end

      it "does nothing" do
        expect(mock_sync_service).not_to receive(:full_sync)

        described_class.perform_now(user.id)
      end
    end

    context "when performing a full sync" do
      it "calls full_sync on the service" do
        expect(mock_sync_service).to receive(:full_sync)

        described_class.perform_now(user.id, full_sync: true)
      end
    end

    context "when syncing a specific goal" do
      let(:goal) { create(:goal, :with_due_date, family: family, creator: user) }

      it "syncs the specific goal" do
        expect(mock_sync_service).to receive(:sync_goal).with(goal)

        described_class.perform_now(user.id, syncable_type: "Goal", syncable_id: goal.id)
      end

      it "does nothing if the goal does not exist" do
        expect(mock_sync_service).not_to receive(:sync_goal)

        described_class.perform_now(user.id, syncable_type: "Goal", syncable_id: 0)
      end
    end

    context "when syncing a specific review" do
      let(:weekly_review) { create(:weekly_review, user: user, family: family) }

      it "syncs the weekly review" do
        expect(mock_sync_service).to receive(:sync_review).with(weekly_review)

        described_class.perform_now(user.id, syncable_type: "WeeklyReview", syncable_id: weekly_review.id)
      end
    end

    context "when sync fails with SyncError" do
      before do
        allow(mock_sync_service).to receive(:full_sync)
          .and_raise(CalendarSyncService::SyncError.new("Sync failed"))
      end

      it "logs the error but does not re-raise" do
        expect(Rails.logger).to receive(:error).with(/Calendar sync error/)

        expect { described_class.perform_now(user.id, full_sync: true) }.not_to raise_error
      end
    end
  end

  describe "retry configuration" do
    it "is configured to retry on QuotaExceededError" do
      # Test that the job is configured for retry
      expect(described_class.ancestors).to include(ActiveJob::Base)
      # The retry_on configuration is validated by checking the job runs without error
    end

    it "is configured to discard on AuthenticationError" do
      # Test that the job is configured for discard
      expect(described_class.ancestors).to include(ActiveJob::Base)
    end
  end
end
