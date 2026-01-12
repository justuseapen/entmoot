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
    it { is_expected.to belong_to(:assigned_to).class_name("User").optional }
    it { is_expected.to belong_to(:duplicate_of).class_name("FeedbackReport").optional }
    it { is_expected.to have_many(:duplicates).class_name("FeedbackReport").with_foreign_key(:duplicate_of_id) }

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

    describe ".by_severity" do
      let!(:blocker_report) { create(:feedback_report, :bug, :blocker) }
      let!(:minor_report) { create(:feedback_report, :bug, :minor) }

      it "returns reports of the specified severity" do
        expect(described_class.by_severity("blocker")).to include(blocker_report)
        expect(described_class.by_severity("blocker")).not_to include(minor_report)
      end

      it "returns all reports when severity is nil" do
        expect(described_class.by_severity(nil)).to include(blocker_report, minor_report)
      end
    end

    describe ".by_date_range" do
      let!(:old_report) { create(:feedback_report, created_at: 10.days.ago) }
      let!(:recent_report) { create(:feedback_report, created_at: 2.days.ago) }

      it "filters by start_date" do
        result = described_class.by_date_range(5.days.ago, nil)
        expect(result).to include(recent_report)
        expect(result).not_to include(old_report)
      end

      it "filters by end_date" do
        result = described_class.by_date_range(nil, 5.days.ago)
        expect(result).to include(old_report)
        expect(result).not_to include(recent_report)
      end

      it "filters by both dates" do
        result = described_class.by_date_range(5.days.ago, 1.day.ago)
        expect(result).to include(recent_report)
        expect(result).not_to include(old_report)
      end
    end

    describe ".unassigned" do
      let!(:unassigned_report) { create(:feedback_report) }
      let!(:assigned_report) { create(:feedback_report, assigned_to: create(:user)) }

      it "returns only unassigned reports" do
        expect(described_class.unassigned).to include(unassigned_report)
        expect(described_class.unassigned).not_to include(assigned_report)
      end
    end

    describe ".assigned_to_user" do
      let(:user) { create(:user) }
      let!(:assigned_report) { create(:feedback_report, assigned_to: user) }
      let!(:other_report) { create(:feedback_report) }

      it "returns reports assigned to specified user" do
        expect(described_class.assigned_to_user(user.id)).to include(assigned_report)
        expect(described_class.assigned_to_user(user.id)).not_to include(other_report)
      end

      it "returns all reports when user_id is nil" do
        expect(described_class.assigned_to_user(nil)).to include(assigned_report, other_report)
      end
    end

    describe ".not_duplicates" do
      let!(:original_report) { create(:feedback_report) }
      let!(:duplicate_report) { create(:feedback_report, duplicate_of: original_report) }

      it "excludes duplicate reports" do
        expect(described_class.not_duplicates).to include(original_report)
        expect(described_class.not_duplicates).not_to include(duplicate_report)
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

  describe "#mark_as_duplicate!" do
    let(:original) { create(:feedback_report) }
    let(:duplicate) { create(:feedback_report) }

    it "sets duplicate_of_id" do
      expect { duplicate.mark_as_duplicate!(original.id) }
        .to change { duplicate.reload.duplicate_of_id }.from(nil).to(original.id)
    end

    it "sets status to closed" do
      expect { duplicate.mark_as_duplicate!(original.id) }
        .to change { duplicate.reload.status }.from("new").to("closed")
    end
  end

  describe "#duplicate?" do
    it "returns true when duplicate_of_id is present" do
      original = create(:feedback_report)
      duplicate = create(:feedback_report, duplicate_of: original)

      expect(duplicate.duplicate?).to be(true)
    end

    it "returns false when duplicate_of_id is nil" do
      report = create(:feedback_report)

      expect(report.duplicate?).to be(false)
    end
  end
end
