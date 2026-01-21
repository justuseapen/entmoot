# frozen_string_literal: true

require "rails_helper"

RSpec.describe Mentionable do
  # We need to include the concern in a real model for testing
  # Using WeeklyReview which already has the mentions association

  # rubocop:disable RSpec/BeforeAfterAll
  before(:all) do
    # Include the concern and configure mentionable fields for testing
    WeeklyReview.include(described_class)
    WeeklyReview.mentionable_fields :wins_shipped, :losses_friction
  end

  after(:all) do
    # Reset the mentionable fields
    WeeklyReview.instance_variable_set(:@mentionable_fields, [])
  end
  # rubocop:enable RSpec/BeforeAfterAll

  let(:family) { create(:family) }
  let(:user) { create(:user, name: "Alice Smith") }
  let(:bob) { create(:user, name: "Bob Jones") }
  let(:carol) { create(:user, name: "Carol Williams") }

  before do
    create(:family_membership, family: family, user: user, role: :admin)
    create(:family_membership, family: family, user: bob, role: :adult)
    create(:family_membership, family: family, user: carol, role: :adult)
  end

  describe ".mentionable_fields" do
    it "sets the fields to scan for mentions" do
      expect(WeeklyReview.mentionable_text_fields).to eq(%i[wins_shipped losses_friction])
    end
  end

  describe "#process_mentions" do
    let(:review) do
      create(:weekly_review, user: user, family: family)
    end

    context "when creating a record with mentions" do
      it "creates Mention records for @mentions in text fields" do
        review.update!(wins_shipped: "Great work with @bob on the project!")

        expect(review.mentions.count).to eq(1)
        mention = review.mentions.first
        expect(mention.mentioned_user).to eq(bob)
        expect(mention.user).to eq(user)
        expect(mention.text_field).to eq("wins_shipped")
      end

      it "creates mentions for multiple users in one field" do
        review.update!(wins_shipped: "Thanks to @bob and @carol for helping!")

        expect(review.mentions.count).to eq(2)
        mentioned_user_ids = review.mentions.pluck(:mentioned_user_id)
        expect(mentioned_user_ids).to contain_exactly(bob.id, carol.id)
      end

      it "creates mentions across multiple fields" do
        review.update!(
          wins_shipped: "Thanks @bob!",
          losses_friction: "Blocked by @carol"
        )

        expect(review.mentions.count).to eq(2)

        bob_mention = review.mentions.find_by(mentioned_user: bob)
        expect(bob_mention.text_field).to eq("wins_shipped")

        carol_mention = review.mentions.find_by(mentioned_user: carol)
        expect(carol_mention.text_field).to eq("losses_friction")
      end

      it "is case-insensitive when matching names" do
        review.update!(wins_shipped: "Thanks @BOB and @Carol!")

        expect(review.mentions.count).to eq(2)
      end

      it "does not create duplicate mentions for the same user in the same field" do
        review.update!(wins_shipped: "Thanks @bob and @bob again!")

        expect(review.mentions.count).to eq(1)
      end
    end

    context "when updating a record" do
      before do
        review.update!(wins_shipped: "Thanks @bob!")
      end

      it "creates new mentions when new users are added" do
        review.update!(wins_shipped: "Thanks @bob and @carol!")

        expect(review.mentions.count).to eq(2)
        mentioned_user_ids = review.mentions.pluck(:mentioned_user_id)
        expect(mentioned_user_ids).to contain_exactly(bob.id, carol.id)
      end

      it "removes mentions when users are removed from text" do
        expect(review.mentions.count).to eq(1)

        review.update!(wins_shipped: "Thanks team!")

        expect(review.mentions.count).to eq(0)
      end

      it "handles replacement of one user with another" do
        review.update!(wins_shipped: "Thanks @carol!")

        expect(review.mentions.count).to eq(1)
        expect(review.mentions.first.mentioned_user).to eq(carol)
      end

      it "does not process mentions if the field did not change" do
        # Create initial mention
        expect(review.mentions.count).to eq(1)

        # Update a different field (that is not in mentionable_fields)
        review.update!(completed: true)

        # Mentions should remain unchanged
        expect(review.mentions.count).to eq(1)
      end

      it "only processes fields that actually changed" do
        review.update!(
          wins_shipped: "Thanks @bob!",
          losses_friction: "Blocked by @carol"
        )

        # Should have bob from wins_shipped and carol from losses_friction
        expect(review.mentions.count).to eq(2)
      end
    end

    context "when mentions are in non-mentionable fields" do
      it "does not create mentions for fields not in mentionable_fields" do
        review.update!(metrics_notes: "Thanks @bob!")

        expect(review.mentions.count).to eq(0)
      end
    end

    context "when text contains non-existent users" do
      it "ignores mentions of users not in the family" do
        review.update!(wins_shipped: "Thanks @unknown and @bob!")

        expect(review.mentions.count).to eq(1)
        expect(review.mentions.first.mentioned_user).to eq(bob)
      end
    end

    context "when text is empty or nil" do
      it "handles nil text fields gracefully" do
        review.update!(wins_shipped: "@bob helped")
        expect(review.mentions.count).to eq(1)

        review.update!(wins_shipped: nil)
        expect(review.mentions.count).to eq(0)
      end

      it "handles empty string text fields gracefully" do
        review.update!(wins_shipped: "@bob helped")
        expect(review.mentions.count).to eq(1)

        review.update!(wins_shipped: "")
        expect(review.mentions.count).to eq(0)
      end
    end

    context "when the same user is mentioned in multiple fields" do
      it "creates separate mention records for each field" do
        review.update!(
          wins_shipped: "Thanks @bob for the help!",
          losses_friction: "Need to sync with @bob more"
        )

        bob_mentions = review.mentions.where(mentioned_user: bob)
        expect(bob_mentions.count).to eq(2)
        expect(bob_mentions.pluck(:text_field)).to contain_exactly("wins_shipped", "losses_friction")
      end
    end
  end

  describe "mentionable_family_id" do
    let(:review) { create(:weekly_review, user: user, family: family) }

    it "returns the family_id" do
      expect(review.send(:mentionable_family_id)).to eq(family.id)
    end
  end

  describe "mentionable_user" do
    let(:review) { create(:weekly_review, user: user, family: family) }

    it "returns the user" do
      expect(review.send(:mentionable_user)).to eq(user)
    end
  end

  describe "has_many :mentions association" do
    let(:review) do
      create(:weekly_review, user: user, family: family)
    end

    before do
      review.update!(wins_shipped: "Thanks @bob!")
    end

    it "includes the mentions association" do
      expect(review).to respond_to(:mentions)
      expect(review.mentions).to be_a(ActiveRecord::Associations::CollectionProxy)
    end

    it "destroys mentions when the record is destroyed" do
      expect { review.destroy }.to change(Mention, :count).by(-1)
    end
  end

  # Test for TopPriority which gets family through daily_plan
  describe "indirect family association" do
    # rubocop:disable RSpec/BeforeAfterAll
    before(:all) do
      TopPriority.include(described_class)
      TopPriority.mentionable_fields :title
    end

    after(:all) do
      TopPriority.instance_variable_set(:@mentionable_fields, [])
    end
    # rubocop:enable RSpec/BeforeAfterAll

    let(:daily_plan) { create(:daily_plan, user: user, family: family) }
    let(:priority) do
      TopPriority.create!(
        daily_plan: daily_plan,
        title: "Test priority",
        priority_order: 1
      )
    end

    it "returns family_id via daily_plan association" do
      expect(priority.send(:mentionable_family_id)).to eq(family.id)
    end

    it "creates mentions when text contains @mentions" do
      priority.update!(title: "Work with @bob on task")

      expect(priority.mentions.count).to eq(1)
      expect(priority.mentions.first.mentioned_user).to eq(bob)
    end
  end

  # Test for Goal which uses creator instead of user
  describe "creator association" do
    # rubocop:disable RSpec/BeforeAfterAll
    before(:all) do
      Goal.include(described_class)
      Goal.mentionable_fields :title, :description
    end

    after(:all) do
      Goal.instance_variable_set(:@mentionable_fields, [])
    end
    # rubocop:enable RSpec/BeforeAfterAll

    let(:goal) do
      create(:goal, family: family, creator: user)
    end

    it "returns the creator as mentionable_user" do
      expect(goal.send(:mentionable_user)).to eq(user)
    end

    it "creates mentions with creator as the user" do
      goal.update!(title: "Help @bob achieve this")

      expect(goal.mentions.count).to eq(1)
      expect(goal.mentions.first.user).to eq(user)
      expect(goal.mentions.first.mentioned_user).to eq(bob)
    end
  end
end
