# frozen_string_literal: true

require "rails_helper"

RSpec.describe Mention do
  describe "associations" do
    it { is_expected.to belong_to(:mentionable) }
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:mentioned_user).class_name("User") }
  end

  describe "validations" do
    subject { build(:mention) }

    it { is_expected.to validate_presence_of(:text_field) }

    it "validates uniqueness of mentioned_user_id scoped to mentionable and text_field" do
      family = create(:family)
      user = create(:user)
      mentioned_user = create(:user)
      create(:family_membership, family: family, user: user)
      create(:family_membership, family: family, user: mentioned_user)
      goal = create(:goal, family: family, creator: user)

      create(:mention, mentionable: goal, user: user, mentioned_user: mentioned_user, text_field: "title")

      duplicate = build(:mention, mentionable: goal, user: user, mentioned_user: mentioned_user, text_field: "title")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:mentioned_user_id]).to be_present
    end
  end

  describe "callbacks" do
    describe "after_create :send_notification" do
      let(:family) { create(:family) }
      let(:mentioner) { create(:user, name: "John Doe") }
      let(:mentioned_user) { create(:user, name: "Jane Smith") }

      before do
        create(:family_membership, family: family, user: mentioner)
        create(:family_membership, family: family, user: mentioned_user)
        # Stub external broadcast calls
        allow(NotificationsChannel).to receive(:broadcast_to_user)
        allow(NotificationService).to receive(:send_push_notification)
      end

      context "when mentioning another user" do
        it "creates a notification for the mentioned user" do
          goal = create(:goal, family: family, creator: mentioner, title: "Test Goal")

          expect do
            create(:mention, mentionable: goal, user: mentioner, mentioned_user: mentioned_user, text_field: "title")
          end.to change(Notification, :count).by(1)

          notification = Notification.last
          expect(notification.user).to eq(mentioned_user)
          expect(notification.title).to eq("John Doe mentioned you")
          expect(notification.notification_type).to eq("mention")
        end

        it "includes goal context in the notification body" do
          goal = create(:goal, family: family, creator: mentioner, title: "Test Goal")

          create(:mention, mentionable: goal, user: mentioner, mentioned_user: mentioned_user, text_field: "title")

          notification = Notification.last
          expect(notification.body).to include("in goal: Test Goal")
        end

        it "includes a link to the goal" do
          goal = create(:goal, family: family, creator: mentioner)

          create(:mention, mentionable: goal, user: mentioner, mentioned_user: mentioned_user, text_field: "title")

          notification = Notification.last
          expect(notification.link).to eq("/families/#{family.id}/goals/#{goal.id}")
        end
      end

      context "when user mentions themselves" do
        it "does not create a notification" do
          goal = create(:goal, family: family, creator: mentioner)

          expect do
            create(:mention, mentionable: goal, user: mentioner, mentioned_user: mentioner, text_field: "title")
          end.not_to change(Notification, :count)
        end
      end

      context "with different mentionable types", :aggregate_failures do
        it "generates correct context for DailyPlan" do
          daily_plan = create(:daily_plan, family: family, user: mentioner, date: Date.new(2026, 1, 15))

          create(:mention, mentionable: daily_plan, user: mentioner, mentioned_user: mentioned_user,
                           text_field: "shutdown_shipped")

          notification = Notification.last
          expect(notification.body).to include("in their daily plan for January 15")
          expect(notification.link).to eq("/planner?date=2026-01-15")
        end

        it "generates correct context for WeeklyReview" do
          weekly_review = create(:weekly_review, family: family, user: mentioner,
                                                 week_start_date: Date.new(2026, 1, 13))

          create(:mention, mentionable: weekly_review, user: mentioner, mentioned_user: mentioned_user,
                           text_field: "wins_shipped")

          notification = Notification.last
          expect(notification.body).to include("in their weekly review")
          expect(notification.link).to eq("/weekly-review?date=2026-01-13")
        end

        it "generates correct context for MonthlyReview" do
          monthly_review = create(:monthly_review, family: family, user: mentioner,
                                                   month: Date.new(2026, 1, 1))

          create(:mention, mentionable: monthly_review, user: mentioner, mentioned_user: mentioned_user,
                           text_field: "lessons_learned")

          notification = Notification.last
          expect(notification.body).to include("in their monthly review")
          expect(notification.link).to eq("/monthly-review?date=2026-01-01")
        end

        it "generates correct context for QuarterlyReview" do
          quarterly_review = create(:quarterly_review, family: family, user: mentioner,
                                                       quarter_start_date: Date.new(2026, 1, 1))

          create(:mention, mentionable: quarterly_review, user: mentioner, mentioned_user: mentioned_user,
                           text_field: "insights")

          notification = Notification.last
          expect(notification.body).to include("in their quarterly review")
          expect(notification.link).to eq("/quarterly-review?date=2026-01-01")
        end

        it "generates correct context for AnnualReview" do
          annual_review = create(:annual_review, family: family, user: mentioner, year: 2026)

          create(:mention, mentionable: annual_review, user: mentioner, mentioned_user: mentioned_user,
                           text_field: "lessons_learned")

          notification = Notification.last
          expect(notification.body).to include("in their annual review")
          expect(notification.link).to eq("/annual-review?year=2026")
        end

        it "generates correct context for TopPriority" do
          daily_plan = create(:daily_plan, family: family, user: mentioner, date: Date.new(2026, 1, 15))
          top_priority = create(:top_priority, daily_plan: daily_plan)

          create(:mention, mentionable: top_priority, user: mentioner, mentioned_user: mentioned_user,
                           text_field: "title")

          notification = Notification.last
          expect(notification.body).to include("in a top priority")
          expect(notification.link).to eq("/planner?date=2026-01-15")
        end
      end
    end
  end
end
