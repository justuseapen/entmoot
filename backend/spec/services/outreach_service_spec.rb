# frozen_string_literal: true

require "rails_helper"

RSpec.describe OutreachService do
  let(:user) { create(:user) }
  let(:family) { create(:family) }
  let!(:notification_preference) do
    create(:notification_preference, user: user, push: true, email: true, sms: false)
  end

  before do
    create(:family_membership, user: user, family: family)
    # Mock PushNotificationService by default
    allow_any_instance_of(PushNotificationService).to receive(:send_to_user)
      .and_return({ sent: 1, failed: 0, invalid_tokens: [] })
  end

  describe ".send_outreach" do
    context "with push notification available" do
      before do
        create(:device_token, user: user, platform: "ios")
      end

      it "sends via push as first priority" do
        result = described_class.send_outreach(
          user: user,
          outreach_type: :missed_checkin,
          family: family
        )

        expect(result[:success]).to be true
        expect(result[:channel]).to eq "push"
      end

      it "records outreach history" do
        expect do
          described_class.send_outreach(user: user, outreach_type: :missed_checkin, family: family)
        end.to change(OutreachHistory, :count).by(1)

        history = OutreachHistory.last
        expect(history.user).to eq user
        expect(history.outreach_type).to eq "missed_checkin"
        expect(history.channel).to eq "push"
      end

      it "includes deep link in message" do
        expect_any_instance_of(PushNotificationService).to receive(:send_to_user).with(
          hash_including(
            user: user,
            title: "Time for Your Morning Check-in",
            link: "/families/#{family.id}/planner"
          )
        )

        described_class.send_outreach(user: user, outreach_type: :missed_checkin, family: family)
      end
    end

    context "with push disabled but email available" do
      before do
        notification_preference.update!(push: false, email: true)
        ActiveJob::Base.queue_adapter = :test
      end

      it "sends via email as fallback" do
        result = described_class.send_outreach(
          user: user,
          outreach_type: :missed_reflection,
          family: family
        )

        expect(result[:success]).to be true
        expect(result[:channel]).to eq "email"
      end

      it "enqueues the email" do
        expect do
          described_class.send_outreach(user: user, outreach_type: :missed_reflection, family: family)
        end.to have_enqueued_mail(OutreachMailer, :re_engagement)
      end
    end

    context "with push failing and email as fallback" do
      before do
        create(:device_token, user: user, platform: "ios")
        allow_any_instance_of(PushNotificationService).to receive(:send_to_user)
          .and_raise(StandardError.new("Push service unavailable"))
      end

      it "falls back to email" do
        result = described_class.send_outreach(
          user: user,
          outreach_type: :inactive_3_days,
          family: family
        )

        expect(result[:success]).to be true
        expect(result[:channel]).to eq "email"
      end
    end

    context "with SMS for high-priority inactivity" do
      before do
        notification_preference.update!(push: false, email: false, sms: true)
        user.update!(phone_number: "+14155551234", phone_verified: true)
        allow_any_instance_of(SmsService).to receive(:send_to_user)
          .and_return({ success: true, message_sid: "test_sid" })
      end

      it "sends SMS for inactive_7_days" do
        result = described_class.send_outreach(
          user: user,
          outreach_type: :inactive_7_days,
          family: family
        )

        expect(result[:success]).to be true
        expect(result[:channel]).to eq "sms"
      end

      it "sends SMS for inactive_14_days" do
        result = described_class.send_outreach(
          user: user,
          outreach_type: :inactive_14_days,
          family: family
        )

        expect(result[:success]).to be true
        expect(result[:channel]).to eq "sms"
      end

      it "sends SMS for inactive_30_days" do
        result = described_class.send_outreach(
          user: user,
          outreach_type: :inactive_30_days,
          family: family
        )

        expect(result[:success]).to be true
        expect(result[:channel]).to eq "sms"
      end

      it "does not send SMS for missed_checkin (low priority)" do
        result = described_class.send_outreach(
          user: user,
          outreach_type: :missed_checkin,
          family: family
        )

        expect(result[:success]).to be false
        expect(result[:error]).to eq :no_available_channel
      end

      it "does not send SMS for inactive_3_days (low priority)" do
        result = described_class.send_outreach(
          user: user,
          outreach_type: :inactive_3_days,
          family: family
        )

        expect(result[:success]).to be false
        expect(result[:error]).to eq :no_available_channel
      end
    end

    context "with no phone number for SMS" do
      before do
        notification_preference.update!(push: false, email: false, sms: true)
        user.update!(phone_number: nil, phone_verified: false)
      end

      it "skips SMS when no phone number" do
        result = described_class.send_outreach(
          user: user,
          outreach_type: :inactive_7_days,
          family: family
        )

        expect(result[:success]).to be false
        expect(result[:error]).to eq :no_available_channel
      end
    end

    context "with unverified phone for SMS" do
      before do
        notification_preference.update!(push: false, email: false, sms: true)
        user.update!(phone_number: "+14155551234", phone_verified: false)
      end

      it "skips SMS when phone not verified" do
        result = described_class.send_outreach(
          user: user,
          outreach_type: :inactive_7_days,
          family: family
        )

        expect(result[:success]).to be false
        expect(result[:error]).to eq :no_available_channel
      end
    end

    context "with duplicate outreach prevention" do
      before do
        create(:device_token, user: user, platform: "ios")
      end

      it "prevents duplicate outreach of same type on same day" do
        # First outreach succeeds
        result1 = described_class.send_outreach(
          user: user,
          outreach_type: :missed_checkin,
          family: family
        )
        expect(result1[:success]).to be true

        # Second outreach of same type is skipped
        result2 = described_class.send_outreach(
          user: user,
          outreach_type: :missed_checkin,
          family: family
        )
        expect(result2[:success]).to be false
        expect(result2[:skipped]).to be true
        expect(result2[:reason]).to eq :already_sent_today
      end

      it "allows different outreach types on same day" do
        result1 = described_class.send_outreach(
          user: user,
          outreach_type: :missed_checkin,
          family: family
        )
        expect(result1[:success]).to be true

        result2 = described_class.send_outreach(
          user: user,
          outreach_type: :missed_reflection,
          family: family
        )
        expect(result2[:success]).to be true
      end

      it "allows same outreach type on different days" do
        # Outreach yesterday
        travel_to 1.day.ago do
          described_class.send_outreach(user: user, outreach_type: :missed_checkin, family: family)
        end

        # Outreach today should work
        result = described_class.send_outreach(
          user: user,
          outreach_type: :missed_checkin,
          family: family
        )
        expect(result[:success]).to be true
      end
    end

    context "with no channels available" do
      before do
        notification_preference.update!(push: false, email: false, sms: false)
      end

      it "returns no available channel error" do
        result = described_class.send_outreach(
          user: user,
          outreach_type: :missed_checkin,
          family: family
        )

        expect(result[:success]).to be false
        expect(result[:error]).to eq :no_available_channel
      end

      it "does not record outreach history" do
        expect do
          described_class.send_outreach(user: user, outreach_type: :missed_checkin, family: family)
        end.not_to change(OutreachHistory, :count)
      end
    end

    context "with invalid outreach type" do
      it "returns skipped with no_template reason" do
        result = described_class.send_outreach(
          user: user,
          outreach_type: :invalid_type,
          family: family
        )

        expect(result[:success]).to be false
        expect(result[:skipped]).to be true
        expect(result[:reason]).to eq :no_template
      end
    end

    context "with personalized messages" do
      before do
        create(:device_token, user: user, platform: "ios")
      end

      it "includes user name in message body" do
        expect_any_instance_of(PushNotificationService).to receive(:send_to_user).with(
          hash_including(
            body: /Hi #{user.name}!/
          )
        )

        described_class.send_outreach(user: user, outreach_type: :missed_checkin, family: family)
      end
    end
  end

  describe ".send_to_candidates" do
    let(:user2) { create(:user) }
    let!(:notification_preference2) do
      create(:notification_preference, user: user2, push: true, email: true)
    end
    let(:candidates) do
      [
        ReengagementDetectionService::OutreachCandidate.new(user: user, reason: :missed_checkin, priority: 1),
        ReengagementDetectionService::OutreachCandidate.new(user: user2, reason: :missed_reflection, priority: 2)
      ]
    end

    before do
      create(:family_membership, user: user2, family: family)
      create(:device_token, user: user, platform: "ios")
      create(:device_token, user: user2, platform: "android")
    end

    it "sends outreach to all candidates" do
      results = described_class.send_to_candidates(candidates)

      expect(results[:sent]).to eq 2
      expect(results[:skipped]).to eq 0
      expect(results[:failed]).to eq 0
    end

    it "returns details for each candidate" do # rubocop:disable RSpec/MultipleExpectations
      results = described_class.send_to_candidates(candidates)

      expect(results[:details].length).to eq 2
      expect(results[:details][0][:user_id]).to eq user.id
      expect(results[:details][0][:reason]).to eq :missed_checkin
      expect(results[:details][0][:success]).to be true
      expect(results[:details][1][:user_id]).to eq user2.id
      expect(results[:details][1][:reason]).to eq :missed_reflection
      expect(results[:details][1][:success]).to be true
    end

    it "handles mixed success and failure" do
      notification_preference2.update!(push: false, email: false)

      results = described_class.send_to_candidates(candidates)

      expect(results[:sent]).to eq 1
      expect(results[:failed]).to eq 1
    end

    it "handles already sent today (skipped)" do
      # Pre-send to user
      described_class.send_outreach(user: user, outreach_type: :missed_checkin, family: family)

      results = described_class.send_to_candidates(candidates)

      expect(results[:sent]).to eq 1
      expect(results[:skipped]).to eq 1
    end
  end

  describe "message templates" do
    it "has templates for all outreach types" do
      OutreachHistory::OUTREACH_TYPES.each do |type|
        expect(OutreachService::MESSAGE_TEMPLATES).to have_key(type.to_sym),
                                                      "Missing template for #{type}"
      end
    end

    it "has required keys in each template" do
      OutreachService::MESSAGE_TEMPLATES.each do |type, template|
        expect(template).to have_key(:title), "Missing title for #{type}"
        expect(template).to have_key(:body), "Missing body for #{type}"
        expect(template).to have_key(:link), "Missing link for #{type}"
      end
    end
  end
end
