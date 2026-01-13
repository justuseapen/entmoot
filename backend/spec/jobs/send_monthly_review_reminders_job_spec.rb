# frozen_string_literal: true

require "rails_helper"

RSpec.describe SendMonthlyReviewRemindersJob do
  include ActiveSupport::Testing::TimeHelpers

  describe "#perform" do
    context "when user has email and monthly_review enabled" do
      let(:user) { create(:user) }
      let(:family) { create(:family, timezone: "America/New_York") }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: true,
               push: false,
               monthly_review: true,
               monthly_review_day: 1,
               quiet_hours_start: "22:00",
               quiet_hours_end: "06:00")
      end

      context "when on the scheduled day (1st of month)" do
        it "sends the monthly review email" do
          travel_to Time.find_zone("America/New_York").local(2026, 2, 1, 9, 0, 0) do
            expect { described_class.new.perform }
              .to have_enqueued_mail(ReminderMailer, :monthly_review)
              .with(user, family)
          end
        end
      end

      context "when on a different day" do
        it "does not send the email" do
          travel_to Time.find_zone("America/New_York").local(2026, 2, 15, 9, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :monthly_review)
          end
        end
      end

      context "when monthly_review_day is set to 15" do
        before do
          user.notification_preference.update!(monthly_review_day: 15)
        end

        it "sends on the 15th" do
          travel_to Time.find_zone("America/New_York").local(2026, 2, 15, 9, 0, 0) do
            expect { described_class.new.perform }
              .to have_enqueued_mail(ReminderMailer, :monthly_review)
              .with(user, family)
          end
        end

        it "does not send on the 1st" do
          travel_to Time.find_zone("America/New_York").local(2026, 2, 1, 9, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :monthly_review)
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
               monthly_review: true,
               monthly_review_day: 1,
               quiet_hours_start: "08:00",
               quiet_hours_end: "10:00")
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 2, 1, 9, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :monthly_review)
        end
      end
    end

    context "when monthly_review is disabled" do
      before do
        user = create(:user)
        family = create(:family, timezone: "America/New_York")
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: true,
               monthly_review: false,
               monthly_review_day: 1)
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 2, 1, 9, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :monthly_review)
        end
      end
    end

    context "when push is enabled" do
      let(:user) { create(:user) }
      let(:family) { create(:family, timezone: "America/New_York") }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: false,
               push: true,
               monthly_review: true,
               monthly_review_day: 1,
               quiet_hours_start: "22:00",
               quiet_hours_end: "06:00")
        create(:device_token, user: user)
      end

      it "creates a notification" do
        travel_to Time.find_zone("America/New_York").local(2026, 2, 1, 9, 0, 0) do
          expect { described_class.new.perform }
            .to change(Notification, :count).by(1)
        end
      end
    end
  end
end
