# frozen_string_literal: true

class Mention < ApplicationRecord
  belongs_to :mentionable, polymorphic: true
  belongs_to :user
  belongs_to :mentioned_user, class_name: "User"

  validates :text_field, presence: true
  validates :mentioned_user_id, uniqueness: {
    scope: %i[mentionable_type mentionable_id user_id text_field],
    message: :already_mentioned
  }
end
