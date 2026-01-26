# frozen_string_literal: true

require "rails_helper"

RSpec.describe GoalTrackabilityAssessmentJob, type: :job do
  let(:user) { create(:user) }
  let(:family) { create(:family) }
  # Create goal as draft to avoid triggering automatic trackability assessment
  let(:goal) { create(:goal, family: family, creator: user, trackable: false, is_draft: true) }

  describe "#perform" do
    context "when assessment succeeds and goal is trackable" do
      before do
        allow_any_instance_of(GoalTrackabilityService).to receive(:assess).and_return(
          is_trackable: true,
          reason: "This goal can be tracked via Plaid",
          potential_integrations: ["Plaid", "Personal Capital"]
        )
      end

      it "updates goal trackability" do
        described_class.perform_now(goal.id)

        goal.reload
        expect(goal.trackable).to be true
        expect(goal.trackability_assessment["reason"]).to eq("This goal can be tracked via Plaid")
        expect(goal.trackability_assessment["potential_integrations"]).to include("Plaid")
        expect(goal.trackability_assessed_at).not_to be_nil
      end

      it "triggers GitHub issue job via model callback when goal becomes trackable" do
        # The Goal model callback handles GitHub issue creation
        # when trackable status changes from false to true
        expect do
          described_class.perform_now(goal.id)
        end.to have_enqueued_job(TrackableGoalIssueJob)
      end
    end

    context "when assessment succeeds and goal is not trackable" do
      before do
        allow_any_instance_of(GoalTrackabilityService).to receive(:assess).and_return(
          is_trackable: false,
          reason: "No direct integration available",
          potential_integrations: []
        )
      end

      it "updates goal as not trackable" do
        described_class.perform_now(goal.id)

        goal.reload
        expect(goal.trackable).to be false
        expect(goal.trackability_assessed_at).not_to be_nil
      end

      it "does not trigger GitHub issue job" do
        expect do
          described_class.perform_now(goal.id)
        end.not_to have_enqueued_job(TrackableGoalIssueJob)
      end
    end

    context "when goal is already trackable" do
      # Create goal as draft with default trackable: false, then set trackable via update_column
      # to avoid triggering callbacks during setup
      let(:goal) do
        g = create(:goal, family: family, creator: user, trackable: false, is_draft: true)
        g.update_column(:trackable, true)
        g.reload
      end

      before do
        allow_any_instance_of(GoalTrackabilityService).to receive(:assess).and_return(
          is_trackable: true,
          reason: "Still trackable",
          potential_integrations: ["Plaid"]
        )
      end

      it "does not trigger another GitHub issue job since trackable status unchanged" do
        # Model callback only triggers when trackable changes from false to true
        expect do
          described_class.perform_now(goal.id)
        end.not_to have_enqueued_job(TrackableGoalIssueJob)
      end
    end

    context "when goal is deleted" do
      it "handles gracefully" do
        goal.destroy

        expect { described_class.perform_now(goal.id) }.not_to raise_error
      end
    end

    context "when assessment fails" do
      before do
        allow_any_instance_of(GoalTrackabilityService).to receive(:assess)
          .and_raise(GoalTrackabilityService::AssessmentError, "API error")
      end

      it "does not raise error" do
        expect { described_class.perform_now(goal.id) }.not_to raise_error
      end

      it "does not update the goal" do
        original_assessed_at = goal.trackability_assessed_at

        described_class.perform_now(goal.id)

        goal.reload
        expect(goal.trackability_assessed_at).to eq(original_assessed_at)
      end
    end
  end
end
