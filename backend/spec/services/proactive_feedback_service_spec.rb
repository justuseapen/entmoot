# frozen_string_literal: true

require "rails_helper"

RSpec.describe ProactiveFeedbackService do
  let(:user) { create(:user) }
  let(:family) { create(:family) }

  before do
    create(:family_membership, user: user, family: family, role: "admin")
  end

  describe ".should_show_nps?" do
    context "when user account is less than 30 days old" do
      let(:new_user) { create(:user, created_at: 10.days.ago) }

      it "returns false" do
        expect(described_class.should_show_nps?(new_user)).to be(false)
      end
    end

    context "when user has no meaningful activity" do
      let(:old_user) { create(:user, created_at: 60.days.ago) }

      it "returns false" do
        expect(described_class.should_show_nps?(old_user)).to be(false)
      end
    end

    context "when user has meaningful activity and is old enough" do
      let(:eligible_user) { create(:user, created_at: 60.days.ago) }

      before do
        create(:family_membership, user: eligible_user, family: family, role: "adult")
        create(:goal, family: family, creator: eligible_user)
      end

      it "returns true" do
        expect(described_class.should_show_nps?(eligible_user)).to be(true)
      end
    end

    context "when user was prompted for NPS recently" do
      let(:prompted_user) { create(:user, created_at: 60.days.ago, last_nps_prompt_date: 30.days.ago) }

      before do
        create(:family_membership, user: prompted_user, family: family, role: "adult")
        create(:goal, family: family, creator: prompted_user)
      end

      it "returns false" do
        expect(described_class.should_show_nps?(prompted_user)).to be(false)
      end
    end

    context "when user was prompted for NPS more than 90 days ago" do
      let(:long_ago_user) { create(:user, created_at: 120.days.ago, last_nps_prompt_date: 100.days.ago) }

      before do
        create(:family_membership, user: long_ago_user, family: family, role: "adult")
        create(:goal, family: family, creator: long_ago_user)
      end

      it "returns true" do
        expect(described_class.should_show_nps?(long_ago_user)).to be(true)
      end
    end
  end

  describe ".should_show_feature_feedback?" do
    it "returns true for a feature not yet rated" do
      expect(described_class.should_show_feature_feedback?(user, "goal_refinement")).to be(true)
    end

    it "returns false for a feature already rated" do
      user.update(first_actions: { "feature_feedback_goal_refinement" => Time.current.iso8601 })

      expect(described_class.should_show_feature_feedback?(user, "goal_refinement")).to be(false)
    end

    it "returns false for nil user" do
      expect(described_class.should_show_feature_feedback?(nil, "goal_refinement")).to be(false)
    end
  end

  describe ".should_show_session_feedback?" do
    it "returns false for user with no completions" do
      expect(described_class.should_show_session_feedback?(user, "weekly_review")).to be(false)
    end

    it "returns true on 5th completion" do
      # Create 5 completed weekly reviews
      5.times do |i|
        create(:weekly_review, user: user, family: family, week_start_date: (i + 1).weeks.ago.to_date, completed: true)
      end

      expect(described_class.should_show_session_feedback?(user, "weekly_review")).to be(true)
    end

    it "returns false on 4th completion" do
      # Create 4 completed weekly reviews
      4.times do |i|
        create(:weekly_review, user: user, family: family, week_start_date: (i + 1).weeks.ago.to_date, completed: true)
      end

      expect(described_class.should_show_session_feedback?(user, "weekly_review")).to be(false)
    end

    it "returns false for nil user" do
      expect(described_class.should_show_session_feedback?(nil, "weekly_review")).to be(false)
    end
  end

  describe ".record_nps_prompted" do
    it "updates user's last_nps_prompt_date" do
      expect do
        described_class.record_nps_prompted(user)
      end.to change { user.reload.last_nps_prompt_date }.from(nil)
    end
  end

  describe ".record_feature_feedback_shown" do
    it "records feature feedback in first_actions" do
      described_class.record_feature_feedback_shown(user, "goal_refinement")

      expect(user.reload.first_actions).to have_key("feature_feedback_goal_refinement")
    end
  end

  describe ".nps_follow_up_question" do
    it "returns promoter question for scores 9-10" do
      expect(described_class.nps_follow_up_question(9)).to include("love most")
      expect(described_class.nps_follow_up_question(10)).to include("love most")
    end

    it "returns passive question for scores 7-8" do
      expect(described_class.nps_follow_up_question(7)).to include("improve")
      expect(described_class.nps_follow_up_question(8)).to include("improve")
    end

    it "returns detractor question for scores 0-6" do
      expect(described_class.nps_follow_up_question(0)).to include("sorry")
      expect(described_class.nps_follow_up_question(6)).to include("sorry")
    end
  end

  describe ".nps_category" do
    it "returns :promoter for scores 9-10" do
      expect(described_class.nps_category(9)).to eq(:promoter)
      expect(described_class.nps_category(10)).to eq(:promoter)
    end

    it "returns :passive for scores 7-8" do
      expect(described_class.nps_category(7)).to eq(:passive)
      expect(described_class.nps_category(8)).to eq(:passive)
    end

    it "returns :detractor for scores 0-6" do
      expect(described_class.nps_category(0)).to eq(:detractor)
      expect(described_class.nps_category(6)).to eq(:detractor)
    end

    it "returns :unknown for invalid scores" do
      expect(described_class.nps_category(-1)).to eq(:unknown)
      expect(described_class.nps_category(11)).to eq(:unknown)
    end
  end

  describe ".feedback_status" do
    let(:eligible_user) { create(:user, created_at: 60.days.ago) }

    before do
      create(:family_membership, user: eligible_user, family: family, role: "adult")
      create(:goal, family: family, creator: eligible_user)
    end

    it "returns comprehensive feedback status" do
      status = described_class.feedback_status(eligible_user)

      expect(status).to have_key(:nps_eligible)
      expect(status).to have_key(:days_until_nps_eligible)
      expect(status).to have_key(:last_nps_date)
      expect(status).to have_key(:features_not_rated)
    end

    it "shows all ratable features when none have been rated" do
      status = described_class.feedback_status(eligible_user)

      expect(status[:features_not_rated]).to include("goal_refinement")
      expect(status[:features_not_rated]).to include("daily_planning")
    end
  end
end
