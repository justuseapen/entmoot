# frozen_string_literal: true

require "rails_helper"

RSpec.describe DetectMissedCheckInsJob do
  include ActiveSupport::Testing::TimeHelpers

  describe "#perform" do
    let(:user) { create(:user) }
    let(:family) { create(:family, timezone: "America/New_York") }

    before do
      create(:family_membership, user: user, family: family, role: :admin)
      create(:notification_preference,
             user: user,
             morning_planning: true,
             reengagement_enabled: true,
             email: true,
             quiet_hours_start: "23:00",
             quiet_hours_end: "06:00")
    end

    context "when job is enabled" do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with("REENGAGEMENT_JOBS_ENABLED", "true").and_return("true")
        allow(OutreachService).to receive(:send_to_candidates).and_return({ sent: 1, skipped: 0, failed: 0 })
        allow(Rails.logger).to receive(:info)
      end

      context "when user missed morning check-in" do
        it "detects and sends outreach to user who has no daily plan after noon" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 14, 0, 0) do
            described_class.new.perform

            expect(OutreachService).to have_received(:send_to_candidates).with(
              satisfy { |candidates| candidates.any? { |c| c.user == user && c.reason == :missed_checkin } }
            )
          end
        end

        it "detects user with empty daily plan (no tasks or intention)" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 14, 0, 0) do
            create(:daily_plan, user: user, family: family, date: Date.new(2026, 1, 15), intention: nil)

            described_class.new.perform

            expect(OutreachService).to have_received(:send_to_candidates).with(
              satisfy { |candidates| candidates.any? { |c| c.user == user && c.reason == :missed_checkin } }
            )
          end
        end
      end

      context "when user has completed morning planning" do
        it "does not send outreach when user has daily plan with tasks" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 14, 0, 0) do
            daily_plan = create(:daily_plan, user: user, family: family, date: Date.new(2026, 1, 15), intention: nil)
            create(:daily_task, daily_plan: daily_plan, title: "Task 1")

            described_class.new.perform

            # Empty candidates means job returns early and doesn't call OutreachService
            expect(OutreachService).not_to have_received(:send_to_candidates)
          end
        end

        it "does not send outreach when user has daily plan with intention" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 14, 0, 0) do
            create(:daily_plan, user: user, family: family, date: Date.new(2026, 1, 15), intention: "Be productive")

            described_class.new.perform

            expect(OutreachService).not_to have_received(:send_to_candidates)
          end
        end
      end

      context "when before the deadline hour" do
        it "does not detect missed check-ins before noon" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 11, 0, 0) do
            described_class.new.perform

            expect(OutreachService).not_to have_received(:send_to_candidates)
          end
        end
      end

      context "when user is in quiet hours" do
        before do
          user.notification_preference.update!(quiet_hours_start: "13:00", quiet_hours_end: "15:00")
        end

        it "does not send outreach during quiet hours" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 14, 0, 0) do
            described_class.new.perform

            expect(OutreachService).not_to have_received(:send_to_candidates)
          end
        end
      end

      context "when reengagement is disabled for user" do
        before do
          user.notification_preference.update!(reengagement_enabled: false)
        end

        it "does not send outreach" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 14, 0, 0) do
            described_class.new.perform

            expect(OutreachService).not_to have_received(:send_to_candidates)
          end
        end
      end

      it "logs job execution information" do
        travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 14, 0, 0) do
          described_class.new.perform

          expect(Rails.logger).to have_received(:info).with(/Starting missed check-in detection/)
          expect(Rails.logger).to have_received(:info).with(/Found 1 users who missed check-in/)
          expect(Rails.logger).to have_received(:info).with(/Completed - sent: 1/)
        end
      end
    end

    context "when job is disabled via environment variable" do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with("REENGAGEMENT_JOBS_ENABLED", "true").and_return("false")
        allow(ReengagementDetectionService).to receive(:detect_missed_checkins)
        allow(OutreachService).to receive(:send_to_candidates)
      end

      it "does not process anything" do
        travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 14, 0, 0) do
          described_class.new.perform

          expect(ReengagementDetectionService).not_to have_received(:detect_missed_checkins)
          expect(OutreachService).not_to have_received(:send_to_candidates)
        end
      end
    end
  end
end
