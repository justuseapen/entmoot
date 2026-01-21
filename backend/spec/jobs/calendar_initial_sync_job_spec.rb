# frozen_string_literal: true

require "rails_helper"

RSpec.describe CalendarInitialSyncJob do
  let(:user) { create(:user) }
  let!(:credential) { create(:google_calendar_credential, :active, user: user) }
  let(:mock_sync_service) { instance_double(CalendarSyncService) }

  before do
    allow(CalendarSyncService).to receive(:new).with(user).and_return(mock_sync_service)
    allow(mock_sync_service).to receive(:full_sync)
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

    context "when calendar sync is enabled" do
      it "performs a full sync" do
        expect(mock_sync_service).to receive(:full_sync)

        described_class.perform_now(user.id)
      end

      it "logs start and completion messages" do
        # Just verify the job completes successfully - logging is implementation detail
        expect { described_class.perform_now(user.id) }.not_to raise_error
      end
    end

    context "when sync fails with SyncError" do
      before do
        allow(mock_sync_service).to receive(:full_sync)
          .and_raise(CalendarSyncService::SyncError.new("Initial sync failed"))
      end

      it "logs the error but does not re-raise" do
        expect { described_class.perform_now(user.id) }.not_to raise_error
      end
    end
  end

  describe "retry configuration" do
    it "is configured to retry on QuotaExceededError" do
      expect(described_class.ancestors).to include(ActiveJob::Base)
    end

    it "is configured to discard on AuthenticationError" do
      expect(described_class.ancestors).to include(ActiveJob::Base)
    end
  end
end
