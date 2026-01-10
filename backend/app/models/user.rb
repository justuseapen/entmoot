# frozen_string_literal: true

class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  has_many :refresh_tokens, dependent: :destroy

  validates :name, presence: true

  def jwt_payload
    { user_id: id }
  end
end
