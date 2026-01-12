# frozen_string_literal: true

class Reflection < ApplicationRecord
  belongs_to :daily_plan, optional: true
  belongs_to :user, optional: true
  belongs_to :family, optional: true

  has_many :reflection_responses, dependent: :destroy

  # Reflection types: evening (daily), weekly, monthly, quarterly, annual, quick (lightweight first-login)
  enum :reflection_type, { evening: 0, weekly: 1, monthly: 2, quarterly: 3, annual: 4, quick: 5 }, validate: true

  # Mood options (optional)
  enum :mood, { great: 0, good: 1, okay: 2, difficult: 3, rough: 4 }, prefix: true

  validates :reflection_type, presence: true
  validates :reflection_type, uniqueness: { scope: :daily_plan_id, message: :already_exists }, if: :daily_plan_id
  validates :energy_level, numericality: { in: 1..5 }, allow_nil: true
  validates :daily_plan, presence: true, unless: :quick?
  validates :user, presence: true, if: :quick?
  validates :family, presence: true, if: :quick?

  accepts_nested_attributes_for :reflection_responses, allow_destroy: true

  # For non-quick reflections, delegate to daily_plan. For quick reflections, use direct associations.
  def effective_user
    quick? ? user : daily_plan&.user
  end

  def effective_family
    quick? ? family : daily_plan&.family
  end

  def completed?
    reflection_responses.any?(&:response?)
  end
end
