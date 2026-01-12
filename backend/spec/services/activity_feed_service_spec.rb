# frozen_string_literal: true

require "rails_helper"

RSpec.describe ActivityFeedService do
  describe ".get_family_activity" do
    let(:family) { create(:family) }
    let(:user) { create(:user, name: "Alice") }

    before do
      create(:family_membership, family: family, user: user, role: :admin)
    end

    it "returns an empty array when there are no activities" do
      activities = described_class.get_family_activity(family)

      expect(activities).to eq([])
    end

    context "with goal activities" do
      it "includes recently created family-visible goals" do
        create(:goal, family: family, creator: user, title: "Test Goal", visibility: :family)

        activities = described_class.get_family_activity(family)

        expect(activities.length).to eq(1)
        expect(activities.first).to include(
          type: "goal_created",
          description: "created a new goal: Test Goal"
        )
        expect(activities.first[:user]).to include(id: user.id, name: "Alice")
      end

      it "includes recently completed goals" do
        create(:goal, family: family, creator: user, title: "Completed Goal", visibility: :family,
                      status: :completed)

        activities = described_class.get_family_activity(family)

        activity_types = activities.pluck(:type)
        expect(activity_types).to include("goal_completed")
      end

      it "excludes personal and shared goals from feed" do
        create(:goal, family: family, creator: user, visibility: :personal)
        create(:goal, family: family, creator: user, visibility: :shared)

        activities = described_class.get_family_activity(family)

        expect(activities).to eq([])
      end

      it "excludes goals older than 7 days" do
        travel_to 10.days.ago do
          create(:goal, family: family, creator: user, visibility: :family)
        end

        activities = described_class.get_family_activity(family)

        expect(activities).to eq([])
      end
    end

    context "with badge activities" do
      let(:badge) { create(:badge, name: "First Goal", icon: "target") }

      it "includes recently earned badges" do
        create(:user_badge, user: user, badge: badge)

        activities = described_class.get_family_activity(family)

        expect(activities.length).to eq(1)
        expect(activities.first).to include(
          type: "badge_earned",
          description: "earned the First Goal badge"
        )
        expect(activities.first[:metadata]).to include(badge_name: "First Goal", badge_icon: "target")
      end

      it "excludes badges earned more than 7 days ago" do
        travel_to 10.days.ago do
          create(:user_badge, user: user, badge: badge)
        end

        activities = described_class.get_family_activity(family)

        expect(activities).to eq([])
      end
    end

    context "with streak activities" do
      it "includes streak milestone achievements" do
        create(:points_ledger_entry,
               user: user,
               activity_type: :streak_milestone,
               points: 50,
               metadata: { streak_type: "daily_planning", days: 7 })

        activities = described_class.get_family_activity(family)

        expect(activities.length).to eq(1)
        expect(activities.first).to include(type: "streak_milestone")
        expect(activities.first[:description]).to include("7-day")
      end
    end

    context "with reflection activities" do
      it "includes completed evening reflections" do
        daily_plan = create(:daily_plan, family: family, user: user)
        create(:reflection, :completed, daily_plan: daily_plan, reflection_type: :evening)

        activities = described_class.get_family_activity(family)

        expect(activities.length).to eq(1)
        expect(activities.first).to include(
          type: "reflection_completed",
          description: "completed their evening reflection"
        )
      end

      it "excludes incomplete reflections" do
        daily_plan = create(:daily_plan, family: family, user: user)
        create(:reflection, daily_plan: daily_plan, reflection_type: :evening)

        activities = described_class.get_family_activity(family)

        expect(activities).to eq([])
      end
    end

    context "with multiple activities" do
      it "returns activities sorted by timestamp descending" do
        # Create activities at different times
        travel_to 3.days.ago do
          create(:goal, family: family, creator: user, visibility: :family)
        end

        travel_to 1.day.ago do
          badge = create(:badge, name: "Test Badge")
          create(:user_badge, user: user, badge: badge)
        end

        activities = described_class.get_family_activity(family)

        # Badge activity should come first (more recent)
        expect(activities.first[:type]).to eq("badge_earned")
      end

      it "respects the limit parameter" do
        5.times do |i|
          create(:goal, family: family, creator: user, title: "Goal #{i}", visibility: :family)
        end

        activities = described_class.get_family_activity(family, limit: 3)

        expect(activities.length).to eq(3)
      end
    end

    context "with multiple family members" do
      let(:user2) { create(:user, name: "Bob") }

      before do
        create(:family_membership, family: family, user: user2, role: :adult)
      end

      it "includes activities from all family members" do
        create(:goal, family: family, creator: user, title: "Alice's Goal", visibility: :family)
        create(:goal, family: family, creator: user2, title: "Bob's Goal", visibility: :family)

        activities = described_class.get_family_activity(family)
        user_names = activities.map { |a| a[:user][:name] }

        expect(user_names).to include("Alice", "Bob")
      end
    end
  end
end
