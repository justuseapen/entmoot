# frozen_string_literal: true

class Reflection < ApplicationRecord
  belongs_to :daily_plan

  has_many :reflection_responses, dependent: :destroy

  # Reflection types: evening (daily), weekly, monthly, quarterly, annual
  enum :reflection_type, { evening: 0, weekly: 1, monthly: 2, quarterly: 3, annual: 4 }, validate: true

  # Mood options (optional)
  enum :mood, { great: 0, good: 1, okay: 2, difficult: 3, rough: 4 }, prefix: true

  validates :reflection_type, presence: true
  validates :reflection_type, uniqueness: { scope: :daily_plan_id, message: :already_exists }
  validates :energy_level, numericality: { in: 1..5 }, allow_nil: true

  accepts_nested_attributes_for :reflection_responses, allow_destroy: true

  delegate :user, :family, to: :daily_plan

  def completed?
    reflection_responses.any?(&:response?)
  end
end
