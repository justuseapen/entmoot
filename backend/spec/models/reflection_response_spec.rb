# frozen_string_literal: true

require "rails_helper"

RSpec.describe ReflectionResponse do
  describe "associations" do
    it { is_expected.to belong_to(:reflection) }
  end

  describe "validations" do
    subject { build(:reflection_response) }

    it { is_expected.to validate_presence_of(:prompt) }

    it "validates uniqueness of prompt scoped to reflection_id" do
      reflection = create(:reflection)
      create(:reflection_response, reflection: reflection, prompt: "What went well?")

      duplicate = build(:reflection_response, reflection: reflection, prompt: "What went well?")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:prompt]).to include("has already been answered for this reflection")
    end

    it "allows same prompt for different reflections" do
      reflection1 = create(:reflection)
      reflection2 = create(:reflection)
      create(:reflection_response, reflection: reflection1, prompt: "What went well?")

      same_prompt = build(:reflection_response, reflection: reflection2, prompt: "What went well?")
      expect(same_prompt).to be_valid
    end
  end

  describe "#response?" do
    it "returns true when response is present" do
      reflection_response = build(:reflection_response, response: "Some text")

      expect(reflection_response.response?).to be(true)
    end

    it "returns false when response is nil" do
      reflection_response = build(:reflection_response, response: nil)

      expect(reflection_response.response?).to be(false)
    end

    it "returns false when response is empty string" do
      reflection_response = build(:reflection_response, response: "")

      expect(reflection_response.response?).to be(false)
    end

    it "returns false when response is blank" do
      reflection_response = build(:reflection_response, response: "   ")

      expect(reflection_response.response?).to be(false)
    end
  end
end
