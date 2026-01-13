# frozen_string_literal: true

require "rails_helper"

RSpec.describe DetectInactiveUsersJob do
  include ActiveSupport::Testing::TimeHelpers

  describe "#perform" do
    let(:user) { create(:user, last_active_at: 8.days.ago) }
    let(:family) { create(:family, timezone: "UTC") }

    before do
      create(:family_membership, user: user, family: family, role: :admin)
      create(:notification_preference,
             user: user,
             reengagement_enabled: true,
             email: true)
    end

    context "when job is enabled" do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with("REENGAGEMENT_JOBS_ENABLED", "true").and_return("true")
        allow(ENV).to receive(:fetch).with("INACTIVITY_THRESHOLDS", nil).and_return(nil)
        allow(OutreachService).to receive(:send_to_candidates).and_return({ sent: 1, skipped: 0, failed: 0 })
        allow(Rails.logger).to receive(:info)
      end

      context "when user is inactive for 7+ days" do
        it "detects and sends outreach to inactive user" do
          described_class.new.perform

          expect(OutreachService).to have_received(:send_to_candidates).with(
            satisfy { |candidates| candidates.any? { |c| c.user == user && c.reason == :inactive_7_days } }
          )
        end
      end

      context "when user is inactive for 30+ days" do
        let(:user) { create(:user, last_active_at: 31.days.ago) }

        it "detects user with inactive_30_days reason" do
          described_class.new.perform

          expect(OutreachService).to have_received(:send_to_candidates).with(
            satisfy { |candidates| candidates.any? { |c| c.user == user && c.reason == :inactive_30_days } }
          )
        end
      end

      context "when user is inactive for 14+ days" do
        let(:user) { create(:user, last_active_at: 15.days.ago) }

        it "detects user with inactive_14_days reason" do
          described_class.new.perform

          expect(OutreachService).to have_received(:send_to_candidates).with(
            satisfy { |candidates| candidates.any? { |c| c.user == user && c.reason == :inactive_14_days } }
          )
        end
      end

      context "when user is inactive for 3+ days" do
        let(:user) { create(:user, last_active_at: 4.days.ago) }

        it "detects user with inactive_3_days reason" do
          described_class.new.perform

          expect(OutreachService).to have_received(:send_to_candidates).with(
            satisfy { |candidates| candidates.any? { |c| c.user == user && c.reason == :inactive_3_days } }
          )
        end
      end

      context "when user was recently active" do
        let(:user) { create(:user, last_active_at: 2.days.ago) }

        it "does not send outreach" do
          described_class.new.perform

          # Empty candidates means job returns early
          expect(OutreachService).not_to have_received(:send_to_candidates)
        end
      end

      context "when reengagement is disabled for user" do
        before do
          user.notification_preference.update!(reengagement_enabled: false)
        end

        it "does not send outreach" do
          described_class.new.perform

          expect(OutreachService).not_to have_received(:send_to_candidates)
        end
      end

      context "when user has never been active (nil last_active_at)" do
        let(:user) { create(:user, last_active_at: nil) }

        it "does not send outreach" do
          described_class.new.perform

          expect(OutreachService).not_to have_received(:send_to_candidates)
        end
      end

      context "when custom thresholds are passed" do
        let(:user) { create(:user, last_active_at: 6.days.ago) }

        it "uses custom thresholds when provided" do
          described_class.new.perform(thresholds: [5, 10])

          expect(OutreachService).to have_received(:send_to_candidates).with(
            satisfy { |candidates| candidates.any? { |c| c.user == user && c.reason == :inactive_5_days } }
          )
        end
      end

      context "when thresholds are set via environment variable" do
        before do
          allow(ENV).to receive(:fetch).with("INACTIVITY_THRESHOLDS", nil).and_return("5,10,20")
        end

        let(:user) { create(:user, last_active_at: 6.days.ago) }

        it "uses environment thresholds" do
          described_class.new.perform

          expect(OutreachService).to have_received(:send_to_candidates).with(
            satisfy { |candidates| candidates.any? { |c| c.user == user && c.reason == :inactive_5_days } }
          )
        end
      end

      it "logs job execution information" do
        described_class.new.perform

        expect(Rails.logger).to have_received(:info).with(/Starting inactive user detection with thresholds/)
        expect(Rails.logger).to have_received(:info).with(/Found 1 inactive users/)
        expect(Rails.logger).to have_received(:info).with(/Completed - sent: 1/)
      end
    end

    context "when job is disabled via environment variable" do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with("REENGAGEMENT_JOBS_ENABLED", "true").and_return("false")
        allow(ReengagementDetectionService).to receive(:detect_inactive_users)
        allow(OutreachService).to receive(:send_to_candidates)
      end

      it "does not process anything" do
        described_class.new.perform

        expect(ReengagementDetectionService).not_to have_received(:detect_inactive_users)
        expect(OutreachService).not_to have_received(:send_to_candidates)
      end
    end
  end

  describe "#parse_thresholds_from_env" do
    context "when INACTIVITY_THRESHOLDS is blank" do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with("INACTIVITY_THRESHOLDS", nil).and_return(nil)
      end

      it "returns default thresholds" do
        expect(described_class.new.send(:parse_thresholds_from_env)).to eq([3, 7, 14, 30])
      end
    end

    context "when INACTIVITY_THRESHOLDS contains valid values" do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with("INACTIVITY_THRESHOLDS", nil).and_return("5, 10, 20, 60")
      end

      it "parses and returns the thresholds" do
        expect(described_class.new.send(:parse_thresholds_from_env)).to eq([5, 10, 20, 60])
      end
    end

    context "when INACTIVITY_THRESHOLDS contains invalid values" do
      before do
        allow(ENV).to receive(:fetch).and_call_original
        allow(ENV).to receive(:fetch).with("INACTIVITY_THRESHOLDS", nil).and_return("5, invalid, -1, 10")
      end

      it "filters out invalid values" do
        expect(described_class.new.send(:parse_thresholds_from_env)).to eq([5, 10])
      end
    end
  end
end
