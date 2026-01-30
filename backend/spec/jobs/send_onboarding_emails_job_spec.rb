# frozen_string_literal: true

require "rails_helper"

RSpec.describe SendOnboardingEmailsJob do
  include ActiveSupport::Testing::TimeHelpers

  let(:family) { create(:family) }

  describe "#perform" do
    context "when user is eligible for day 1 email" do
      let(:user) { create(:user, created_at: 1.day.ago) }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference, user: user, email: true)
      end

      it "sends the welcome email" do
        expect { described_class.new.perform }
          .to have_enqueued_mail(OnboardingMailer, :welcome)
          .with(user)
      end

      it "records the email as sent" do
        described_class.new.perform
        user.reload
        expect(user.onboarding_emails_sent).to have_key("day_one")
      end

      it "does not send duplicate emails" do
        described_class.new.perform
        expect { described_class.new.perform }
          .not_to have_enqueued_mail(OnboardingMailer, :welcome)
      end
    end

    context "when user is eligible for day 3 email" do
      let(:emails_sent) { { "day_one" => Time.current.iso8601 } }
      let(:user) { create(:user, created_at: 3.days.ago, onboarding_emails_sent: emails_sent) }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference, user: user, email: true)
      end

      it "sends the morning planning intro email" do
        expect { described_class.new.perform }
          .to have_enqueued_mail(OnboardingMailer, :morning_planning_intro)
          .with(user)
      end

      context "when user has already created daily plans" do
        before do
          create(:daily_plan, user: user, family: family)
        end

        it "skips the morning planning intro email" do
          expect { described_class.new.perform }
            .not_to have_enqueued_mail(OnboardingMailer, :morning_planning_intro)
        end
      end
    end

    context "when user is eligible for day 14 email" do
      let(:user) do
        create(:user, created_at: 14.days.ago, onboarding_emails_sent: {
                 "day_one" => 13.days.ago.iso8601,
                 "day_three" => 11.days.ago.iso8601
               })
      end

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference, user: user, email: true)
      end

      it "sends the two week check-in email" do
        expect { described_class.new.perform }
          .to have_enqueued_mail(OnboardingMailer, :two_week_check_in)
          .with(user)
      end
    end

    context "when user has unsubscribed from onboarding emails" do
      let(:user) { create(:user, created_at: 1.day.ago, onboarding_unsubscribed: true) }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference, user: user, email: true)
      end

      it "does not send any onboarding emails" do
        expect { described_class.new.perform }
          .not_to have_enqueued_mail(OnboardingMailer, :welcome)
      end
    end

    context "when user has email notifications disabled" do
      let(:user) { create(:user, created_at: 1.day.ago) }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference, user: user, email: false)
      end

      it "does not send any onboarding emails" do
        expect { described_class.new.perform }
          .not_to have_enqueued_mail(OnboardingMailer, :welcome)
      end
    end

    context "when user signed up more than 15 days ago" do
      let(:user) { create(:user, created_at: 20.days.ago) }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference, user: user, email: true)
      end

      it "does not send any onboarding emails" do
        expect { described_class.new.perform }
          .not_to have_enqueued_mail(OnboardingMailer, :two_week_check_in)
      end
    end

    context "when processing multiple users" do
      let(:new_user) { create(:user, created_at: 1.day.ago) }
      let(:emails_sent) { { "day_one" => 6.days.ago.iso8601 } }
      let(:existing_user) { create(:user, created_at: 7.days.ago, onboarding_emails_sent: emails_sent) }

      before do
        create(:family_membership, user: new_user, family: family, role: :admin)
        create(:family_membership, user: existing_user, family: family, role: :adult)
        create(:notification_preference, user: new_user, email: true)
        create(:notification_preference, user: existing_user, email: true)
      end

      it "sends appropriate emails to each user" do
        expect { described_class.new.perform }
          .to have_enqueued_mail(OnboardingMailer, :welcome).with(new_user)
          .and have_enqueued_mail(OnboardingMailer, :morning_planning_intro).with(existing_user)
      end
    end

    context "when user is brand new (day 0)" do
      let(:user) { create(:user, created_at: Time.current) }

      before do
        create(:family_membership, user: user, family: family, role: :admin)
        create(:notification_preference, user: user, email: true)
      end

      it "does not send the welcome email yet" do
        expect { described_class.new.perform }
          .not_to have_enqueued_mail(OnboardingMailer, :welcome)
      end
    end
  end
end
