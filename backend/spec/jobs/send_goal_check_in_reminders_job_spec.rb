# frozen_string_literal: true

require "rails_helper"

RSpec.describe SendGoalCheckInRemindersJob do
  include ActiveSupport::Testing::TimeHelpers

  describe "#perform" do
    context "when user has email enabled" do
      let(:user) { create(:user) }
      let(:family) { create(:family, timezone: "America/New_York") }

      before { create(:family_membership, user: user, family: family, role: :admin) }

      context "with a goal due within 7 days" do
        let(:goal) do
          # Due date is Jan 18, 2026 which is 3 days from Jan 15, 2026
          create(:goal,
                 family: family,
                 creator: user,
                 status: :in_progress,
                 due_date: Date.new(2026, 1, 18))
        end

        before { create(:notification_preference, user: user, email: true) }

        it "sends the goal check-in email" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 10, 0, 0) do
            expect { described_class.new.perform }
              .to have_enqueued_mail(ReminderMailer, :goal_check_in)
              .with(user, family, goal)
          end
        end
      end

      context "with a goal due more than 7 days away" do
        before do
          create(:notification_preference, user: user, email: true)
          # Due date is Jan 30, 2026 which is > 7 days from Jan 15, 2026
          create(:goal,
                 family: family,
                 creator: user,
                 status: :in_progress,
                 due_date: Date.new(2026, 1, 30))
        end

        it "does not send the email" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 10, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :goal_check_in)
          end
        end
      end

      context "with a completed goal due soon" do
        before do
          create(:notification_preference, user: user, email: true)
          # Due date is Jan 18, 2026 which is 3 days from Jan 15, 2026
          create(:goal,
                 family: family,
                 creator: user,
                 status: :completed,
                 due_date: Date.new(2026, 1, 18))
        end

        it "does not send the email" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 10, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :goal_check_in)
          end
        end
      end

      context "with an abandoned goal due soon" do
        before do
          create(:notification_preference, user: user, email: true)
          # Due date is Jan 18, 2026 which is 3 days from Jan 15, 2026
          create(:goal,
                 family: family,
                 creator: user,
                 status: :abandoned,
                 due_date: Date.new(2026, 1, 18))
        end

        it "does not send the email" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 10, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :goal_check_in)
          end
        end
      end

      context "with a goal with past due date" do
        before do
          create(:notification_preference, user: user, email: true)
          # Due date is Jan 14, 2026 which is in the past compared to Jan 15, 2026
          create(:goal,
                 family: family,
                 creator: user,
                 status: :in_progress,
                 due_date: Date.new(2026, 1, 14))
        end

        it "does not send the email" do
          travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 10, 0, 0) do
            expect { described_class.new.perform }
              .not_to have_enqueued_mail(ReminderMailer, :goal_check_in)
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
               quiet_hours_start: "09:00",
               quiet_hours_end: "11:00")
        # Due date is Jan 18, 2026 which is 3 days from Jan 15, 2026
        create(:goal,
               family: family,
               creator: user,
               status: :in_progress,
               due_date: Date.new(2026, 1, 18))
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 10, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :goal_check_in)
        end
      end
    end

    context "when email is disabled" do
      before do
        user = create(:user)
        family = create(:family, timezone: "America/New_York")
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference, user: user, email: false)
        # Due date is Jan 18, 2026 which is 3 days from Jan 15, 2026
        create(:goal,
               family: family,
               creator: user,
               status: :in_progress,
               due_date: Date.new(2026, 1, 18))
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 10, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :goal_check_in)
        end
      end
    end

    context "when user has no notification preferences" do
      before do
        user = create(:user)
        family = create(:family, timezone: "America/New_York")
        create(:family_membership, user: user, family: family, role: :admin)
        # Due date is Jan 18, 2026 which is 3 days from Jan 15, 2026
        create(:goal,
               family: family,
               creator: user,
               status: :in_progress,
               due_date: Date.new(2026, 1, 18))
      end

      it "does not send the email" do
        travel_to Time.find_zone("America/New_York").local(2026, 1, 15, 10, 0, 0) do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(ReminderMailer, :goal_check_in)
        end
      end
    end
  end
end
