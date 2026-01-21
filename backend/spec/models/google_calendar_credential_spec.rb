# frozen_string_literal: true

require "rails_helper"

RSpec.describe GoogleCalendarCredential do
  describe "associations" do
    it { is_expected.to belong_to(:user) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:calendar_id) }
    it { is_expected.to validate_presence_of(:token_expires_at) }
    it { is_expected.to validate_presence_of(:access_token) }
    it { is_expected.to validate_presence_of(:refresh_token) }
  end

  describe "enums" do
    it "defines sync_status enum" do
      expect(described_class.sync_statuses).to eq(
        "active" => "active",
        "paused" => "paused",
        "error" => "error"
      )
    end
  end

  describe "encryption" do
    let(:credential) { create(:google_calendar_credential) }

    it "encrypts access_token" do
      expect(credential.access_token).to be_present
      # Encrypted values should be different from raw column values
      expect(credential.access_token_before_type_cast).not_to eq(credential.access_token)
    end

    it "encrypts refresh_token" do
      expect(credential.refresh_token).to be_present
      expect(credential.refresh_token_before_type_cast).not_to eq(credential.refresh_token)
    end
  end

  describe "scopes" do
    let!(:active_valid) { create(:google_calendar_credential, :active, token_expires_at: 1.hour.from_now) }
    let!(:active_expired) { create(:google_calendar_credential, :active, token_expires_at: 1.hour.ago) }
    let!(:paused) { create(:google_calendar_credential, :paused, token_expires_at: 1.hour.from_now) }
    let!(:needs_refresh) { create(:google_calendar_credential, :active, token_expires_at: 3.minutes.from_now) }

    describe ".active_and_valid" do
      it "returns only active credentials with valid tokens" do
        expect(described_class.active_and_valid).to include(active_valid, needs_refresh)
        expect(described_class.active_and_valid).not_to include(active_expired, paused)
      end
    end

    describe ".needing_refresh" do
      it "returns credentials expiring within 5 minutes" do
        expect(described_class.needing_refresh).to include(needs_refresh, active_expired)
        expect(described_class.needing_refresh).not_to include(active_valid)
      end
    end
  end

  describe "#token_expired?" do
    it "returns true when token has expired" do
      credential = build(:google_calendar_credential, token_expires_at: 1.hour.ago)
      expect(credential.token_expired?).to be true
    end

    it "returns false when token has not expired" do
      credential = build(:google_calendar_credential, token_expires_at: 1.hour.from_now)
      expect(credential.token_expired?).to be false
    end
  end

  describe "#token_expiring_soon?" do
    it "returns true when token expires within 5 minutes" do
      credential = build(:google_calendar_credential, token_expires_at: 3.minutes.from_now)
      expect(credential.token_expiring_soon?).to be true
    end

    it "returns false when token expires after 5 minutes" do
      credential = build(:google_calendar_credential, token_expires_at: 10.minutes.from_now)
      expect(credential.token_expiring_soon?).to be false
    end

    it "returns true when token has already expired" do
      credential = build(:google_calendar_credential, token_expires_at: 1.minute.ago)
      expect(credential.token_expiring_soon?).to be true
    end
  end

  describe "#mark_error!" do
    let(:credential) { create(:google_calendar_credential, :active) }

    it "updates sync_status to error" do
      credential.mark_error!("Test error message")
      expect(credential.reload.sync_status).to eq("error")
    end

    it "stores the error message" do
      credential.mark_error!("Test error message")
      expect(credential.reload.last_error).to eq("Test error message")
    end
  end

  describe "#mark_synced!" do
    let(:credential) { create(:google_calendar_credential, :error, last_sync_at: 1.day.ago) }

    it "updates last_sync_at to current time" do
      freeze_time do
        credential.mark_synced!
        expect(credential.reload.last_sync_at).to be_within(1.second).of(Time.current)
      end
    end

    it "sets sync_status to active" do
      credential.mark_synced!
      expect(credential.reload.sync_status).to eq("active")
    end

    it "clears last_error" do
      credential.mark_synced!
      expect(credential.reload.last_error).to be_nil
    end
  end
end
