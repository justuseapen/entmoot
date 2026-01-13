# frozen_string_literal: true

class Family < ApplicationRecord
  has_many :family_memberships, dependent: :destroy
  has_many :members, through: :family_memberships, source: :user
  has_many :invitations, dependent: :destroy
  has_many :pets, dependent: :destroy
  has_many :goals, dependent: :destroy
  has_many :daily_plans, dependent: :destroy
  has_many :weekly_reviews, dependent: :destroy
  has_many :monthly_reviews, dependent: :destroy
  has_many :reflections, dependent: :destroy

  validates :name, presence: true
  validates :timezone, presence: true

  def admin_members
    members.joins(:family_memberships).where(family_memberships: { role: :admin })
  end
end
