# frozen_string_literal: true

require "rails_helper"

RSpec.describe ReminderMailer do
  let(:user) { create(:user) }
  let(:family) { create(:family) }

  before { create(:family_membership, user: user, family: family, role: :admin) }

  describe "#morning_planning" do
    let(:mail) { described_class.morning_planning(user, family) }

    it "renders the headers" do
      expect(mail.subject).to eq("Time for Morning Planning - What are your top priorities today?")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["reminders@entmoot.app"])
    end

    it "renders the body with user name" do
      expect(mail.body.encoded).to include(user.name)
    end

    it "includes planning tips in the body" do
      expect(mail.body.encoded).to include("top 3 priorities")
      expect(mail.body.encoded).to include("daily intention")
    end

    it "includes the app URL" do
      expect(mail.body.encoded).to include("/families/#{family.id}/planner")
    end

    it "includes an unsubscribe token" do
      expect(mail.body.encoded).to include("unsubscribe")
    end
  end

  describe "#evening_reflection" do
    let(:mail) { described_class.evening_reflection(user, family) }

    it "renders the headers" do
      expect(mail.subject).to eq("Evening Reflection - Take a moment to reflect on your day")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["reminders@entmoot.app"])
    end

    it "renders the body with user name" do
      expect(mail.body.encoded).to include(user.name)
    end

    it "includes reflection prompts in the body" do
      expect(mail.body.encoded).to include("What went well")
      expect(mail.body.encoded).to include("grateful")
    end

    it "includes the app URL" do
      expect(mail.body.encoded).to include("/families/#{family.id}/reflection")
    end

    it "includes an unsubscribe token" do
      expect(mail.body.encoded).to include("unsubscribe")
    end
  end

  describe "#weekly_review" do
    let(:mail) { described_class.weekly_review(user, family) }

    it "renders the headers" do
      expect(mail.subject).to eq("Weekly Review Time - Celebrate wins and plan ahead!")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["reminders@entmoot.app"])
    end

    it "renders the body with user name" do
      expect(mail.body.encoded).to include(user.name)
    end

    it "includes review prompts in the body" do
      expect(mail.body.encoded).to include("wins")
      expect(mail.body.encoded).to include("lessons")
    end

    it "includes the app URL" do
      expect(mail.body.encoded).to include("/families/#{family.id}/weekly-review")
    end

    it "includes an unsubscribe token" do
      expect(mail.body.encoded).to include("unsubscribe")
    end
  end

  describe "#goal_check_in" do
    let(:goal) { create(:goal, family: family, creator: user, title: "Learn Ruby on Rails") }
    let(:mail) { described_class.goal_check_in(user, family, goal) }

    it "renders the headers" do
      expect(mail.subject).to eq("Goal Check-in: Learn Ruby on Rails")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(["reminders@entmoot.app"])
    end

    it "renders the body with user name" do
      expect(mail.body.encoded).to include(user.name)
    end

    it "includes the goal title" do
      expect(mail.body.encoded).to include("Learn Ruby on Rails")
    end

    it "includes check-in prompts" do
      expect(mail.body.encoded).to include("Update your progress")
      expect(mail.body.encoded).to include("blockers")
    end

    it "includes the goal URL" do
      expect(mail.body.encoded).to include("/families/#{family.id}/goals/#{goal.id}")
    end

    context "when goal has progress" do
      let(:goal) { create(:goal, family: family, creator: user, progress: 50) }

      it "shows the current progress" do
        expect(mail.body.encoded).to include("50%")
      end
    end

    context "when goal has due date" do
      let(:goal) { create(:goal, family: family, creator: user, due_date: Date.new(2026, 2, 15)) }

      it "shows the due date" do
        expect(mail.body.encoded).to include("February 15, 2026")
      end
    end
  end
end
