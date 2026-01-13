# frozen_string_literal: true

require "rails_helper"

RSpec.describe SendQuarterlyReviewRemindersJob do
  include ActiveSupport::Testing::TimeHelpers

  describe "#perform" do
    context "when user has email and quarterly_review enabled" do
      let(:user) { create(:user) }
      let(:family) { create(:family, timezone: "America/New_York") }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: true,
               push: false,
               quarterly_review: true,
               quiet_hours_start: "22:00",
               quiet_hours_end: "06:00")
      end

      context "when in the last week of Q1 (March 25-31)" do
        it "sends the quarterly review email on March 25" do
          travel_to Time.find_zone("America/New_York").local(2026, 3, 25, 9, 0, 0) do
            expect { described_class.new.perform }
              .to have_enqueued_mail(ReminderMailer, :quarterly_review)
              .with(user, family)
          end
        end

        it "sends the quarterly review email on March 31" do
          travel_to Time.find_zone("America/New_York").local(2026, 3, 31, 9, 0, 0) do
            expect { described_class.new.perform }
              .to have_enqueued_mail(ReminderMailer, :quarterly_review)
              .with(user, family)
          end
        end
      end

      context "when in the last week of Q2 (June 24-30)" do
        it "sends the quarterly review email on June 30" do
          travel_to Time.find_zone("America/New_York").local(2026, 6, 30, 9, 0, 0) do
            expect { described_class.new.perform }
              .to have_enqueued_mail(ReminderMailer, :quarterly_review)
              .with(user, family)
          end
        end
      end

      context "when in the last week of Q3 (September 24-30)" do
        it "sends the quarterly review email on September 30" do
          travel_to Time.find_zone("America/New_York").local(2026, 9, 30, 9, 0, 0) do
            expect { described_class.new.perform }
              .to have_enqueued_mail(ReminderMailer, :quarterly_review)
              .with(user, family)
          end
        end
      end

      context "when in the last week of Q4 (December 25-31)" do
        it "sends the quarterly review email on December 31" do
          travel_to Time.find_zone("America/New_York").local(2026, 12, 31, 9, 0, 0) do
            expect { described_class.new.perform }
              .to have_enqueued_mail(ReminderMailer, :quarterly_review)
              .with(user, family)
          end
        end
      end

      context "when not in the last week of a quarter" do
        it "does not send the email in February" do
          travel_to Time.find_zone("America/New_York").local(2026, 2, 15, 9, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :quarterly_review)
          end
        end

        it "does not send the email early in March" do
          travel_to Time.find_zone("America/New_York").local(2026, 3, 15, 9, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :quarterly_review)
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
               quarterly_review: true,
               quiet_hours_start: "08:00",
               quiet_hours_end: "10:00")
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 3, 31, 9, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :quarterly_review)
        end
      end
    end

    context "when quarterly_review is disabled" do
      before do
        user = create(:user)
        family = create(:family, timezone: "America/New_York")
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference,
               user: user,
               email: true,
               quarterly_review: false)
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 3, 31, 9, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :quarterly_review)
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
               quarterly_review: true,
               quiet_hours_start: "22:00",
               quiet_hours_end: "06:00")
        create(:device_token, user: user)
      end

      it "creates a notification" do
        travel_to Time.find_zone("America/New_York").local(2026, 3, 31, 9, 0, 0) do
          expect { described_class.new.perform }
            .to change(Notification, :count).by(1)
        end
      end
    end
  end
end
