# frozen_string_literal: true

require "rails_helper"

RSpec.describe CalendarRemoveEventJob do
  let(:user) { create(:user) }
  let!(:credential) { create(:google_calendar_credential, :active, user: user) }
  let(:mock_calendar_service) { instance_double(GoogleCalendarService) }

  before do
    allow(GoogleCalendarService).to receive(:new).with(user).and_return(mock_calendar_service)
    allow(mock_calendar_service).to receive(:delete_event).and_return(true)
  end

  describe "#perform" do
    let(:google_event_id) { "event_123" }
    let(:google_calendar_id) { "primary" }

    context "when user does not exist" do
      it "does nothing" do
        expect(mock_calendar_service).not_to receive(:delete_event)

        described_class.perform_now(0, google_event_id, google_calendar_id)
      end
    end

    context "when user has no calendar sync enabled" do
      before do
        credential.update!(sync_status: "paused")
      end

      it "does nothing" do
        expect(mock_calendar_service).not_to receive(:delete_event)

        described_class.perform_now(user.id, google_event_id, google_calendar_id)
      end
    end

    context "when calendar sync is enabled" do
      it "deletes the event from Google Calendar" do
        expect(mock_calendar_service).to receive(:delete_event).with(
          calendar_id: google_calendar_id,
          event_id: google_event_id
        )

        described_class.perform_now(user.id, google_event_id, google_calendar_id)
      end

      it "completes successfully" do
        expect { described_class.perform_now(user.id, google_event_id, google_calendar_id) }.not_to raise_error
      end
    end

    context "when event is already deleted (EventNotFoundError)" do
      before do
        allow(mock_calendar_service).to receive(:delete_event)
          .and_raise(GoogleCalendarService::EventNotFoundError.new("Not found"))
      end

      it "does not raise an error" do
        expect { described_class.perform_now(user.id, google_event_id, google_calendar_id) }.not_to raise_error
      end
    end

    context "when other GoogleCalendarService::Error occurs" do
      before do
        allow(mock_calendar_service).to receive(:delete_event)
          .and_raise(GoogleCalendarService::Error.new("API error"))
      end

      it "does not re-raise the error" do
        expect { described_class.perform_now(user.id, google_event_id, google_calendar_id) }.not_to raise_error
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
