# frozen_string_literal: true

require "rails_helper"

RSpec.describe AnnualReview do
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

    it "defines mentionable_fields as :lessons_learned and :next_year_theme" do
      expect(described_class.mentionable_text_fields).to eq(%i[lessons_learned next_year_theme])
    end

    it "creates mentions when saving with @mentions in lessons_learned" do
      review = create(:annual_review, user: user, family: family, lessons_learned: "Learned from @bob")

      expect(review.mentions.count).to eq(1)
      expect(review.mentions.first.mentioned_user).to eq(bob)
      expect(review.mentions.first.user).to eq(user)
      expect(review.mentions.first.text_field).to eq("lessons_learned")
    end

    it "creates mentions when saving with @mentions in next_year_theme" do
      review = create(:annual_review, user: user, family: family, next_year_theme: "More collaboration with @bob")

      expect(review.mentions.count).to eq(1)
      expect(review.mentions.first.text_field).to eq("next_year_theme")
    end
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:year) }

    describe "uniqueness of year per user and family" do
      subject(:annual_review) { create(:annual_review) }

      it "validates uniqueness scoped to user and family" do
        expect(annual_review).to validate_uniqueness_of(:year)
          .scoped_to(%i[user_id family_id])
          .with_message(:already_exists_for_year)
      end
    end
  end
end
