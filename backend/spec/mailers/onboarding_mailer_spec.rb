# frozen_string_literal: true

require "rails_helper"

RSpec.describe OnboardingMailer do
  let(:user) { create(:user) }
  let(:family) { create(:family) }

  before { create(:family_membership, user: user, family: family, role: :admin) }

  describe "#welcome" do
    let(:mail) { described_class.welcome(user) }

    it "renders the headers" do
      expect(mail.subject).to eq("Welcome to Entmoot! Let's get your family organized")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["hello@mail.entmoot.app"])
    end

    it "renders the body with user name" do
      expect(mail.body.encoded).to include(user.name)
    end

    it "includes key features in the body" do
      body = mail.body.encoded
      expect(body).to include("SMART Goals")
      expect(body).to include("Morning Planning")
      expect(body).to include("Evening Reflection")
      expect(body).to include("Weekly Reviews")
    end

    it "includes an unsubscribe link" do
      expect(mail.body.encoded).to include("unsubscribe")
    end
  end

  describe "#morning_planning_intro" do
    let(:mail) { described_class.morning_planning_intro(user) }

    it "renders the headers" do
      expect(mail.subject).to eq("Have you tried morning planning? Start your day with intention")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["hello@mail.entmoot.app"])
    end

    it "renders the body with user name" do
      expect(mail.body.encoded).to include(user.name)
    end

    it "includes planning tips in the body" do
      body = mail.body.encoded
      expect(body).to include("top 3 priorities")
      expect(body).to include("daily intention")
    end

    it "includes the app URL for planner" do
      expect(mail.body.encoded).to include("/families/#{family.id}/planner")
    end

    it "includes an unsubscribe link" do
      expect(mail.body.encoded).to include("unsubscribe")
    end
  end

  describe "#ai_coach_intro" do
    let(:mail) { described_class.ai_coach_intro(user) }

    it "renders the headers" do
      expect(mail.subject).to eq("Meet your AI coach - Get personalized goal guidance")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["hello@mail.entmoot.app"])
    end

    it "renders the body with user name" do
      expect(mail.body.encoded).to include(user.name)
    end

    it "includes AI coach features" do
      body = mail.body.encoded
      expect(body).to include("Refine your goals")
      expect(body).to include("Identify obstacles")
      expect(body).to include("milestones")
    end

    it "includes the app URL for goals" do
      expect(mail.body.encoded).to include("/families/#{family.id}/goals")
    end

    it "includes an unsubscribe link" do
      expect(mail.body.encoded).to include("unsubscribe")
    end
  end

  describe "#weekly_review_intro" do
    let(:mail) { described_class.weekly_review_intro(user) }

    it "renders the headers" do
      expect(mail.subject).to eq("Time for your first weekly review! Celebrate your wins")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["hello@mail.entmoot.app"])
    end

    it "renders the body with user name" do
      expect(mail.body.encoded).to include(user.name)
    end

    it "includes review benefits" do
      body = mail.body.encoded
      expect(body).to include("Celebrate wins")
      expect(body).to include("Learn from challenges")
      expect(body).to include("patterns")
    end

    it "includes the app URL for weekly review" do
      expect(mail.body.encoded).to include("/families/#{family.id}/weekly-review")
    end

    it "includes an unsubscribe link" do
      expect(mail.body.encoded).to include("unsubscribe")
    end
  end

  describe "#two_week_check_in" do
    let(:mail) { described_class.two_week_check_in(user) }

    it "renders the headers" do
      expect(mail.subject).to eq("How's it going? We'd love your feedback")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["hello@mail.entmoot.app"])
    end

    it "renders the body with user name" do
      expect(mail.body.encoded).to include(user.name)
    end

    it "includes feedback questions" do
      body = mail.body.encoded
      expect(body).to include("routine that works")
      expect(body).to include("feedback")
    end

    it "includes feature highlights" do
      body = mail.body.encoded
      expect(body).to include("Gamification")
      expect(body).to include("Leaderboard")
      expect(body).to include("Goal Hierarchy")
    end

    it "includes an unsubscribe link" do
      expect(mail.body.encoded).to include("unsubscribe")
    end
  end

  context "when user has no family" do
    let(:user_without_family) { create(:user) }

    describe "#welcome" do
      let(:mail) { described_class.welcome(user_without_family) }

      it "still sends the email" do
        expect(mail.to).to eq([user_without_family.email])
      end

      it "renders without family-specific URL" do
        expect(mail.body.encoded).to include(user_without_family.name)
      end
    end
  end
end
