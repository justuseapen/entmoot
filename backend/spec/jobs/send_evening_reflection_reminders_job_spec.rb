# frozen_string_literal: true

require "rails_helper"

RSpec.describe SendEveningReflectionRemindersJob do
  include ActiveSupport::Testing::TimeHelpers

  describe "#perform" do
    context "when user has email and evening_reflection enabled" do
      let(:user) { create(:user) }
      let(:family) { create(:family, timezone: "America/New_York") }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: true,
               evening_reflection: true,
               evening_reflection_time: "20:00")
      end

      context "when at the scheduled time" do
        it "sends the evening reflection email" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 20, 0, 0) do
            expect { described_class.new.perform }
              .to have_enqueued_mail(ReminderMailer, :evening_reflection)
              .with(user, family)
          end
        end
      end

      context "when outside the scheduled time window" do
        it "does not send the email" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 21, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :evening_reflection)
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
               evening_reflection: true,
               evening_reflection_time: "20:00",
               quiet_hours_start: "19:00",
               quiet_hours_end: "21:00")
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 20, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :evening_reflection)
        end
      end
    end

    context "when evening_reflection is disabled" do
      before do
        user = create(:user)
        family = create(:family, timezone: "America/New_York")
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: true,
               evening_reflection: false)
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 20, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :evening_reflection)
        end
      end
    end
  end
end
