# frozen_string_literal: true

require "rails_helper"

RSpec.describe CalendarPeriodicSyncJob do
  describe "#perform" do
    context "when there are no active credentials" do
      it "completes without error" do
        expect { described_class.perform_now }.not_to raise_error
      end
    end

    context "when there are active credentials" do
      let!(:active_credential1) { create(:google_calendar_credential, :active) }
      let!(:active_credential2) { create(:google_calendar_credential, :active) }
      let!(:paused_credential) { create(:google_calendar_credential, :paused) }
      let!(:error_credential) { create(:google_calendar_credential, :error) }
      let!(:expired_credential) { create(:google_calendar_credential, :active, token_expires_at: 1.hour.ago) }

      before do
        allow(CalendarSyncJob).to receive(:perform_later)
      end

      it "enqueues sync jobs for active and valid credentials" do
        described_class.perform_now

        expect(CalendarSyncJob).to have_received(:perform_later)
          .with(active_credential1.user_id, full_sync: true)
        expect(CalendarSyncJob).to have_received(:perform_later)
          .with(active_credential2.user_id, full_sync: true)
      end

      it "does not enqueue sync jobs for paused credentials" do
        described_class.perform_now

        expect(CalendarSyncJob).not_to have_received(:perform_later)
          .with(paused_credential.user_id, full_sync: true)
      end

      it "does not enqueue sync jobs for error credentials" do
        described_class.perform_now

        expect(CalendarSyncJob).not_to have_received(:perform_later)
          .with(error_credential.user_id, full_sync: true)
      end

      it "completes successfully" do
        expect { described_class.perform_now }.not_to raise_error
      end
    end

    context "when enqueuing fails for some credentials" do
      let!(:credential1) { create(:google_calendar_credential, :active) }
      let!(:credential2) { create(:google_calendar_credential, :active) }

      before do
        call_count = 0
        allow(CalendarSyncJob).to receive(:perform_later) do
          call_count += 1
          raise StandardError, "Redis connection failed" if call_count == 1
        end
      end

      it "continues processing other credentials" do
        expect(CalendarSyncJob).to receive(:perform_later).twice

        described_class.perform_now
      end

      it "completes without raising" do
        expect { described_class.perform_now }.not_to raise_error
      end
    end
  end

  describe "queue configuration" do
    it "uses the low priority queue" do
      expect(described_class.queue_name).to eq("low")
    end
  end
end
