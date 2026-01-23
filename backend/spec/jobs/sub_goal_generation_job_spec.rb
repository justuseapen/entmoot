# frozen_string_literal: true

require "rails_helper"

RSpec.describe SubGoalGenerationJob do
  describe "#perform" do
    let(:user) { create(:user) }
    let(:family) { create(:family) }
    let!(:membership) { create(:family_membership, user: user, family: family, role: :admin) }
    let(:goal) do
      create(:goal,
             family: family,
             creator: user,
             title: "Get pilot's license",
             time_scale: :annual,
             due_date: 1.year.from_now.to_date)
    end

    let(:sub_goals_data) do
      [
        {
          title: "Complete ground school",
          description: "Study and pass the FAA written exam",
          time_scale: "quarterly",
          due_date: 3.months.from_now.to_date,
          order: 1,
          smart_fields: {
            specific: "Pass the FAA written exam",
            measurable: "Score 80% or higher",
            achievable: "Study 5 hours per week",
            relevant: "Required for pilot certification",
            time_bound: "Complete within 3 months"
          }
        },
        {
          title: "Complete flight hours",
          description: "Log minimum 40 hours of flight time",
          time_scale: "quarterly",
          due_date: 9.months.from_now.to_date,
          order: 2,
          smart_fields: {
            specific: "Log 40+ flight hours",
            measurable: "Track hours in logbook",
            achievable: "2-3 flights per week",
            relevant: "FAA minimum requirement",
            time_bound: "Complete within 9 months"
          }
        }
      ]
    end

    let(:service_result) { { sub_goals: sub_goals_data } }
    let(:mock_service) { instance_double(SubGoalGenerationService, generate: service_result) }

    before do
      allow(SubGoalGenerationService).to receive(:new).with(goal).and_return(mock_service)
      allow(NotificationService).to receive(:create_and_broadcast)
    end

    it "creates draft sub-goals" do
      expect {
        described_class.new.perform(goal_id: goal.id, user_id: user.id)
      }.to change(Goal, :count).by(2)

      sub_goals = goal.children.order(:created_at)
      expect(sub_goals.count).to eq(2)

      first_sub_goal = sub_goals.first
      expect(first_sub_goal.title).to eq("Complete ground school")
      expect(first_sub_goal.is_draft).to be(true)
      expect(first_sub_goal.status).to eq("not_started")
      expect(first_sub_goal.parent_id).to eq(goal.id)
      expect(first_sub_goal.family_id).to eq(family.id)
      expect(first_sub_goal.creator_id).to eq(user.id)
      expect(first_sub_goal.specific).to eq("Pass the FAA written exam")
      expect(first_sub_goal.measurable).to eq("Score 80% or higher")
    end

    it "notifies the user of success" do
      described_class.new.perform(goal_id: goal.id, user_id: user.id)

      expect(NotificationService).to have_received(:create_and_broadcast).with(
        user: user,
        title: "Sub-goals generated!",
        body: "2 sub-goals created for 'Get pilot's license'. Review and customize them.",
        link: "/families/#{family.id}/goals/#{goal.id}",
        notification_type: :goal_update
      )
    end

    it "inherits visibility from parent goal" do
      goal.update!(visibility: :family)

      described_class.new.perform(goal_id: goal.id, user_id: user.id)

      sub_goals = goal.children
      expect(sub_goals.pluck(:visibility)).to all(eq("family"))
    end

    context "when service raises GenerationError" do
      before do
        allow(mock_service).to receive(:generate)
          .and_raise(SubGoalGenerationService::GenerationError, "API quota exceeded")
      end

      it "notifies user of failure and does not raise" do
        expect {
          described_class.new.perform(goal_id: goal.id, user_id: user.id)
        }.not_to raise_error

        expect(NotificationService).to have_received(:create_and_broadcast).with(
          user: user,
          title: "Sub-goal generation failed",
          body: "Could not generate sub-goals for 'Get pilot's license': API quota exceeded",
          link: "/families/#{family.id}/goals/#{goal.id}",
          notification_type: :goal_update
        )
      end

      it "does not create any sub-goals" do
        expect {
          described_class.new.perform(goal_id: goal.id, user_id: user.id)
        }.not_to change(Goal, :count)
      end
    end

    context "when goal is not found" do
      it "raises ActiveRecord::RecordNotFound" do
        expect {
          described_class.new.perform(goal_id: -1, user_id: user.id)
        }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context "when user is not found" do
      it "raises ActiveRecord::RecordNotFound" do
        expect {
          described_class.new.perform(goal_id: goal.id, user_id: -1)
        }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end

    context "when an unexpected error occurs" do
      before do
        allow(mock_service).to receive(:generate)
          .and_raise(StandardError, "Unexpected error")
      end

      it "re-raises the error" do
        expect {
          described_class.new.perform(goal_id: goal.id, user_id: user.id)
        }.to raise_error(StandardError, "Unexpected error")
      end
    end
  end
end
