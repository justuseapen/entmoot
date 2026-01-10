# frozen_string_literal: true

class Pet < ApplicationRecord
  belongs_to :family

  validates :name, presence: true
  validates :name, uniqueness: { scope: :family_id, message: :taken_in_family }
end
