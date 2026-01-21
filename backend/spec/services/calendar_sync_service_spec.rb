# frozen_string_literal: true

require "rails_helper"

RSpec.describe CalendarSyncService do
  let(:user) { create(:user) }
  let(:family) { create(:family) }
  let!(:membership) { create(:family_membership, user: user, family: family, role: "adult") }
  let(:credential) { create(:google_calendar_credential, :active, user: user) }
  let(:service) { described_class.new(user) }

  let(:mock_calendar_service) { instance_double(GoogleCalendarService) }
  let(:event_counter) { { count: 0 } }

  def unique_event_result
    event_counter[:count] += 1
    { id: "event_#{event_counter[:count]}", etag: "\"etag_#{event_counter[:count]}\"", html_link: "https://calendar.google.com/event/#{event_counter[:count]}" }
  end

  before do
    credential # ensure credential exists
    allow(GoogleCalendarService).to receive(:new).and_return(mock_calendar_service)
    allow(mock_calendar_service).to receive(:create_event) { unique_event_result }
    allow(mock_calendar_service).to receive(:update_event) { unique_event_result }
    allow(mock_calendar_service).to receive(:delete_event).and_return(true)
  end

  describe "#sync_goal" do
    # Default goal setup - override in nested contexts as needed
    let(:goal) { create(:goal, :with_due_date, family: family, creator: user) }

    # Helper to assign the user to the goal
    def assign_user_to_goal
      create(:goal_assignment, goal: goal, user: user)
      goal.reload # Reload to pick up the new assignment
    end

    context "when sync is not enabled" do
      let(:credential) { nil }

      before { assign_user_to_goal }

      it "does nothing when user has no credential" do
        expect(mock_calendar_service).not_to receive(:create_event)
        service.sync_goal(goal)
      end
    end

    context "when credential is paused" do
      let(:credential) { create(:google_calendar_credential, :paused, user: user) }

      before { assign_user_to_goal }

      it "does nothing" do
        expect(mock_calendar_service).not_to receive(:create_event)
        service.sync_goal(goal)
      end
    end

    context "when goal has no due date" do
      let(:goal) { create(:goal, family: family, creator: user, due_date: nil) }

      before { assign_user_to_goal }

      it "does not create an event" do
        expect(mock_calendar_service).not_to receive(:create_event)
        service.sync_goal(goal)
      end
    end

    context "when goal is completed" do
      let(:goal) { create(:goal, :completed, :with_due_date, family: family, creator: user) }

      before { assign_user_to_goal }

      it "does not create an event" do
        expect(mock_calendar_service).not_to receive(:create_event)
        service.sync_goal(goal)
      end
    end

    context "when goal is abandoned" do
      let(:goal) { create(:goal, :abandoned, :with_due_date, family: family, creator: user) }

      before { assign_user_to_goal }

      it "does not create an event" do
        expect(mock_calendar_service).not_to receive(:create_event)
        service.sync_goal(goal)
      end
    end

    context "when goal should have an event" do
      before { assign_user_to_goal }

      it "creates a calendar event" do
        expect(mock_calendar_service).to receive(:create_event).with(
          calendar_id: credential.calendar_id,
          event_data: hash_including(
            summary: "[Goal] #{goal.title}",
            start: { date: goal.due_date.to_s },
            end: { date: goal.due_date.to_s }
          )
        )

        service.sync_goal(goal)
      end

      it "creates a mapping record" do
        expect { service.sync_goal(goal) }.to change(CalendarSyncMapping, :count).by(1)

        mapping = user.calendar_sync_mappings.last
        expect(mapping.syncable).to eq(goal)
        expect(mapping.google_event_id).to start_with("event_")
      end
    end

    context "when goal already has a mapping" do
      before { assign_user_to_goal }

      let!(:existing_mapping) do
        create(:calendar_sync_mapping,
               user: user,
               syncable: goal,
               google_event_id: "old_event",
               google_calendar_id: credential.calendar_id)
      end

      it "updates the existing event" do
        expect(mock_calendar_service).to receive(:update_event).with(
          calendar_id: credential.calendar_id,
          event_id: "old_event",
          event_data: hash_including(summary: "[Goal] #{goal.title}"),
          etag: existing_mapping.etag
        )

        service.sync_goal(goal)
      end

      context "when event was deleted from Google Calendar" do
        before do
          allow(mock_calendar_service).to receive(:update_event)
            .and_raise(GoogleCalendarService::EventNotFoundError.new("Not found"))
        end

        it "recreates the event" do
          expect(mock_calendar_service).to receive(:create_event)

          service.sync_goal(goal)
        end
      end
    end

    context "when goal becomes completed and has a mapping" do
      let(:goal) { create(:goal, :completed, :with_due_date, family: family, creator: user) }
      let!(:existing_mapping) do
        create(:calendar_sync_mapping,
               user: user,
               syncable: goal,
               google_event_id: "old_event",
               google_calendar_id: credential.calendar_id)
      end

      before { assign_user_to_goal }

      it "removes the calendar event" do
        expect(mock_calendar_service).to receive(:delete_event).with(
          calendar_id: credential.calendar_id,
          event_id: "old_event"
        )

        service.sync_goal(goal)
      end

      it "destroys the mapping" do
        service.sync_goal(goal)

        expect(CalendarSyncMapping.exists?(existing_mapping.id)).to be false
      end
    end
  end

  describe "#sync_review" do
    let(:weekly_review) { create(:weekly_review, user: user, family: family) }

    context "when sync is not enabled" do
      let(:credential) { nil }

      it "does nothing" do
        expect(mock_calendar_service).not_to receive(:create_event)
        service.sync_review(weekly_review)
      end
    end

    context "when syncing a weekly review" do
      it "creates a calendar event with the week end date" do
        expect(mock_calendar_service).to receive(:create_event).with(
          calendar_id: credential.calendar_id,
          event_data: hash_including(
            summary: "[Entmoot] Weekly Review Due",
            start: { date: weekly_review.week_end_date.to_s }
          )
        )

        service.sync_review(weekly_review)
      end

      it "creates a mapping record" do
        expect { service.sync_review(weekly_review) }.to change(CalendarSyncMapping, :count).by(1)

        mapping = user.calendar_sync_mappings.last
        expect(mapping.syncable).to eq(weekly_review)
      end
    end

    context "when review already has a mapping" do
      let!(:existing_mapping) do
        create(:calendar_sync_mapping,
               user: user,
               syncable: weekly_review,
               google_event_id: "review_event",
               google_calendar_id: credential.calendar_id)
      end

      it "updates the existing event" do
        expect(mock_calendar_service).to receive(:update_event)

        service.sync_review(weekly_review)
      end
    end
  end

  describe "#full_sync" do
    let(:goal) { create(:goal, :with_due_date, family: family, creator: user) }
    let!(:full_sync_goal_assignment) { create(:goal_assignment, goal: goal, user: user) }
    let!(:weekly_review) { create(:weekly_review, user: user, family: family, completed: false) }

    it "syncs all goals assigned to the user" do
      goal # create the goal

      expect(mock_calendar_service).to receive(:create_event).at_least(:twice)

      service.full_sync
    end

    it "marks the credential as synced" do
      freeze_time do
        service.full_sync

        credential.reload
        expect(credential.last_sync_at).to be_within(1.second).of(Time.current)
        expect(credential.sync_status).to eq("active")
      end
    end

    context "when individual sync fails" do
      before do
        allow(mock_calendar_service).to receive(:create_event)
          .and_raise(GoogleCalendarService::AuthenticationError.new("Auth failed"))
      end

      it "logs error and continues processing" do
        # Individual sync errors are caught and logged, sync continues
        expect(Rails.logger).to receive(:error).at_least(:once)
        expect { service.full_sync }.not_to raise_error
      end
    end
  end

  describe "#remove_syncable" do
    let(:goal) { create(:goal, :with_due_date, family: family, creator: user) }
    let!(:mapping) do
      create(:calendar_sync_mapping,
             user: user,
             syncable: goal,
             google_event_id: "event_to_remove",
             google_calendar_id: credential.calendar_id)
    end

    it "deletes the calendar event" do
      expect(mock_calendar_service).to receive(:delete_event).with(
        calendar_id: credential.calendar_id,
        event_id: "event_to_remove"
      )

      service.remove_syncable(goal)
    end

    it "destroys the mapping" do
      service.remove_syncable(goal)

      expect(CalendarSyncMapping.exists?(mapping.id)).to be false
    end

    context "when no mapping exists" do
      let(:unmapped_goal) { create(:goal, family: family, creator: user) }

      it "does nothing" do
        expect(mock_calendar_service).not_to receive(:delete_event)
        service.remove_syncable(unmapped_goal)
      end
    end
  end
end
