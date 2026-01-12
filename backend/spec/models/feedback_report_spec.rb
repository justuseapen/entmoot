# frozen_string_literal: true

require "rails_helper"

RSpec.describe FeedbackReport do
  describe "factory" do
    it "has a valid factory" do
      expect(build(:feedback_report)).to be_valid
    end

    it "has valid bug trait" do
      expect(build(:feedback_report, :bug)).to be_valid
    end

    it "has valid feature_request trait" do
      expect(build(:feedback_report, :feature_request)).to be_valid
    end

    it "has valid feedback trait" do
      expect(build(:feedback_report, :feedback)).to be_valid
    end

    it "has valid anonymous trait" do
      expect(build(:feedback_report, :anonymous)).to be_valid
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:user).optional }

    it "can attach a screenshot" do
      report = build(:feedback_report)
      expect(report).to respond_to(:screenshot)
      expect(report.screenshot).not_to be_attached
    end
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:title) }
    it { is_expected.to validate_presence_of(:report_type) }

    describe "description validation" do
      context "when report_type is bug" do
        subject { build(:feedback_report, report_type: "bug") }

        it { is_expected.to validate_presence_of(:description) }
      end

      context "when report_type is feature_request" do
        subject { build(:feedback_report, report_type: "feature_request", description: nil) }

        it { is_expected.to be_valid }
      end

      context "when report_type is feedback" do
        subject { build(:feedback_report, report_type: "feedback", description: nil) }

        it { is_expected.to be_valid }
      end
    end

    describe "contact_email validation" do
      it "is valid with a proper email format" do
        report = build(:feedback_report, :with_contact, contact_email: "test@example.com")
        expect(report).to be_valid
      end

      it "is valid when blank" do
        report = build(:feedback_report, contact_email: "")
        expect(report).to be_valid
      end

      it "is invalid with improper email format" do
        report = build(:feedback_report, contact_email: "not-an-email")
        expect(report).not_to be_valid
        expect(report.errors[:contact_email]).to include("is invalid")
      end
    end
  end

  describe "enums" do
    it do
      expect(described_class.new).to define_enum_for(:report_type)
        .with_values(bug: "bug", feature_request: "feature_request", feedback: "feedback", nps: "nps",
                     quick_feedback: "quick_feedback")
        .backed_by_column_of_type(:string)
    end

    it do
      expect(described_class.new).to define_enum_for(:severity)
        .with_values(blocker: "blocker", major: "major", minor: "minor", cosmetic: "cosmetic")
        .with_prefix(:severity)
        .backed_by_column_of_type(:string)
    end

    it do
      expect(described_class.new).to define_enum_for(:status)
        .with_values(new: "new", acknowledged: "acknowledged", in_progress: "in_progress", resolved: "resolved",
                     closed: "closed")
        .with_prefix(:status)
        .backed_by_column_of_type(:string)
    end
  end

  describe "scopes" do
    describe ".by_type" do
      let!(:bug_report) { create(:feedback_report, :bug) }
      let!(:feature_request) { create(:feedback_report, :feature_request) }

      it "returns reports of the specified type" do
        expect(described_class.by_type("bug")).to include(bug_report)
        expect(described_class.by_type("bug")).not_to include(feature_request)
      end

      it "returns all reports when type is nil" do
        expect(described_class.by_type(nil)).to include(bug_report, feature_request)
      end
    end

    describe ".by_status" do
      let!(:new_report) { create(:feedback_report) }
      let!(:resolved_report) { create(:feedback_report, :resolved) }

      it "returns reports of the specified status" do
        expect(described_class.by_status("new")).to include(new_report)
        expect(described_class.by_status("new")).not_to include(resolved_report)
      end

      it "returns all reports when status is nil" do
        expect(described_class.by_status(nil)).to include(new_report, resolved_report)
      end
    end

    describe ".recent" do
      let!(:old_report) { create(:feedback_report, created_at: 2.days.ago) }
      let!(:new_report) { create(:feedback_report, created_at: 1.hour.ago) }

      it "returns reports ordered by created_at descending" do
        expect(described_class.recent.first).to eq(new_report)
        expect(described_class.recent.last).to eq(old_report)
      end
    end
  end

  describe "#resolve!" do
    let(:report) { create(:feedback_report) }

    it "updates status to resolved" do
      expect { report.resolve! }.to change { report.reload.status }.from("new").to("resolved")
    end

    it "sets resolved_at timestamp" do
      freeze_time do
        expect { report.resolve! }.to change { report.reload.resolved_at }.from(nil).to(Time.current)
      end
    end
  end
end
