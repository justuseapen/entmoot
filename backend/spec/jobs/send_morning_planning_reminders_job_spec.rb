# frozen_string_literal: true

require "rails_helper"

RSpec.describe SendMorningPlanningRemindersJob do
  include ActiveSupport::Testing::TimeHelpers

  describe "#perform" do
    context "when user has email and morning_planning enabled" do
      let(:user) { create(:user) }
      let(:family) { create(:family, timezone: "America/New_York") }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: true,
               morning_planning: true,
               morning_planning_time: "07:00")
      end

      context "when at the scheduled time" do
        it "sends the morning planning email" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 7, 0, 0) do
            expect { described_class.new.perform }
              .to have_enqueued_mail(ReminderMailer, :morning_planning)
              .with(user, family)
          end
        end
      end

      context "when outside the scheduled time window" do
        it "does not send the email" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 9, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :morning_planning)
          end
        end
      end
    end

    context "when within quiet hours" do
      let(:user) { create(:user) }
      let(:family) { create(:family, timezone: "America/New_York") }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: true,
               morning_planning: true,
               morning_planning_time: "07:00",
               quiet_hours_start: "06:00",
               quiet_hours_end: "08:00")
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 7, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :morning_planning)
        end
      end
    end

    context "when user has email disabled" do
      let(:user) { create(:user) }
      let(:family) { create(:family, timezone: "America/New_York") }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: false,
               morning_planning: true,
               morning_planning_time: "07:00")
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 7, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :morning_planning)
        end
      end
    end

    context "when morning_planning is disabled" do
      let(:user) { create(:user) }
      let(:family) { create(:family, timezone: "America/New_York") }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: true,
               morning_planning: false)
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 7, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :morning_planning)
        end
      end
    end

    context "when user has no family" do
      before do
        user = create(:user)
        create(:notification_preference,
               user: user,
               email: true,
               morning_planning: true,
               morning_planning_time: "07:00")
      end

      it "does not send the email" do
        travel_to Time.zone.local(2026, 1, 15, 7, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :morning_planning)
        end
      end
    end
  end
end
