# frozen_string_literal: true

require "rails_helper"

RSpec.describe QuarterlyReview do
  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:family) }
    it { is_expected.to have_many(:mentions).dependent(:destroy) }
  end

  describe "Mentionable concern" do
    let(:family) { create(:family) }
    let(:user) { create(:user, name: "Alice Smith") }
    let(:bob) { create(:user, name: "Bob Jones") }

    before do
      create(:family_membership, family: family, user: user, role: :admin)
      create(:family_membership, family: family, user: bob, role: :adult)
    end

    it "defines mentionable_fields as :insights" do
      expect(described_class.mentionable_text_fields).to eq([:insights])
    end

    it "creates mentions when saving with @mentions in insights" do
      review = create(:quarterly_review, user: user, family: family, insights: "Great collaboration with @bob")

      expect(review.mentions.count).to eq(1)
      expect(review.mentions.first.mentioned_user).to eq(bob)
      expect(review.mentions.first.user).to eq(user)
      expect(review.mentions.first.text_field).to eq("insights")
    end
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:quarter_start_date) }

    describe "uniqueness of quarter_start_date per user and family" do
      subject(:quarterly_review) { create(:quarterly_review) }

      it "validates uniqueness scoped to user and family" do
        expect(quarterly_review).to validate_uniqueness_of(:quarter_start_date)
          .scoped_to(%i[user_id family_id])
          .with_message(:already_exists_for_quarter)
      end
    end
  end
end
