# frozen_string_literal: true

require "rails_helper"

RSpec.describe SendAnnualReviewRemindersJob do
  include ActiveSupport::Testing::TimeHelpers

  describe "#perform" do
    context "when user has email and annual_review enabled" do
      let(:user) { create(:user) }
      let(:family) { create(:family, timezone: "America/New_York") }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: true,
               push: false,
               annual_review: true,
               quiet_hours_start: "22:00",
               quiet_hours_end: "06:00")
      end

      context "when in the annual review period (December 20-31)" do
        it "sends the annual review email on December 20" do
          travel_to Time.find_zone("America/New_York").local(2026, 12, 20, 9, 0, 0) do
            expect { described_class.new.perform }
              .to have_enqueued_mail(ReminderMailer, :annual_review)
              .with(user, family)
          end
        end

        it "sends the annual review email on December 25" do
          travel_to Time.find_zone("America/New_York").local(2026, 12, 25, 9, 0, 0) do
            expect { described_class.new.perform }
              .to have_enqueued_mail(ReminderMailer, :annual_review)
              .with(user, family)
          end
        end

        it "sends the annual review email on December 31" do
          travel_to Time.find_zone("America/New_York").local(2026, 12, 31, 9, 0, 0) do
            expect { described_class.new.perform }
              .to have_enqueued_mail(ReminderMailer, :annual_review)
              .with(user, family)
          end
        end
      end

      context "when not in the annual review period" do
        it "does not send the email in November" do
          travel_to Time.find_zone("America/New_York").local(2026, 11, 15, 9, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :annual_review)
          end
        end

        it "does not send the email on December 19" do
          travel_to Time.find_zone("America/New_York").local(2026, 12, 19, 9, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :annual_review)
          end
        end

        it "does not send the email on January 1" do
          travel_to Time.find_zone("America/New_York").local(2027, 1, 1, 9, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :annual_review)
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
               annual_review: true,
               quiet_hours_start: "08:00",
               quiet_hours_end: "10:00")
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 12, 25, 9, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :annual_review)
        end
      end
    end

    context "when annual_review is disabled" do
      before do
        user = create(:user)
        family = create(:family, timezone: "America/New_York")
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: true,
               annual_review: false)
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 12, 25, 9, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :annual_review)
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
               annual_review: true,
               quiet_hours_start: "22:00",
               quiet_hours_end: "06:00")
        create(:device_token, user: user)
      end

      it "creates a notification" do
        travel_to Time.find_zone("America/New_York").local(2026, 12, 25, 9, 0, 0) do
          expect { described_class.new.perform }
            .to change(Notification, :count).by(1)
        end
      end
    end
  end
end
