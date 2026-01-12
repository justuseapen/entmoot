# frozen_string_literal: true

require "rails_helper"

RSpec.describe SendWeeklyReviewRemindersJob do
  include ActiveSupport::Testing::TimeHelpers

  describe "#perform" do
    context "when user has email and weekly_review enabled" do
      let(:user) { create(:user) }
      let(:family) { create(:family, timezone: "America/New_York") }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: true,
               weekly_review: true,
               weekly_review_time: "18:00",
               weekly_review_day: 0)
      end

      context "when on the scheduled day and time (Sunday)" do
        it "sends the weekly review email" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 11, 18, 0, 0) do
            expect { described_class.new.perform }
              .to have_enqueued_mail(ReminderMailer, :weekly_review)
              .with(user, family)
          end
        end
      end

      context "when on a different day" do
        it "does not send the email" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 12, 18, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :weekly_review)
          end
        end
      end

      context "when at the wrong time on the right day" do
        it "does not send the email" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 11, 10, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :weekly_review)
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
               weekly_review: true,
               weekly_review_time: "18:00",
               weekly_review_day: 0,
               quiet_hours_start: "17:00",
               quiet_hours_end: "19:00")
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 1, 11, 18, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :weekly_review)
        end
      end
    end

    context "when weekly_review is disabled" do
      before do
        user = create(:user)
        family = create(:family, timezone: "America/New_York")
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: true,
               weekly_review: false,
               weekly_review_day: 0)
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 1, 11, 18, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :weekly_review)
        end
      end
    end
  end
end
