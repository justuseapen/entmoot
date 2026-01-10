# frozen_string_literal: true

require "rails_helper"

RSpec.describe Pet do
  describe "associations" do
    it { is_expected.to belong_to(:family) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:name) }

    describe "uniqueness of name within family" do
      let(:family) { create(:family) }

      it "does not allow duplicate names in the same family" do
        create(:pet, family: family, name: "Buddy")
        new_pet = build(:pet, family: family, name: "Buddy")
        expect(new_pet).not_to be_valid
        expect(new_pet.errors[:name]).to include("has already been taken for this family")
      end

      it "allows the same name in different families" do
        create(:pet, family: family, name: "Buddy")
        other_family = create(:family)
        new_pet = build(:pet, family: other_family, name: "Buddy")
        expect(new_pet).to be_valid
      end

      it "allows different names in the same family" do
        create(:pet, family: family, name: "Buddy")
        new_pet = build(:pet, family: family, name: "Max")
        expect(new_pet).to be_valid
      end
    end
  end

  describe "attributes" do
    let(:pet) do
      create(:pet, name: "Max", pet_type: "dog", birthday: Date.new(2020, 5, 15), notes: "Loves to play fetch")
    end

    it "stores all pet attributes correctly" do
      expect(pet).to have_attributes(
        name: "Max",
        pet_type: "dog",
        birthday: Date.new(2020, 5, 15),
        notes: "Loves to play fetch"
      )
    end

    it "allows nil for optional fields" do
      pet = create(:pet, pet_type: nil, avatar_url: nil, birthday: nil, notes: nil)
      expect(pet).to be_valid
    end
  end
end
