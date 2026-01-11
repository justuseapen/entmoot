# frozen_string_literal: true

class ReflectionResponse < ApplicationRecord
  belongs_to :reflection

  validates :prompt, presence: true
  validates :prompt, uniqueness: { scope: :reflection_id, message: :already_answered }

  def response?
    response.present?
  end
end
