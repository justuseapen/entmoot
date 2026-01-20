# frozen_string_literal: true

# Concern that adds @mention processing to models
# Include this concern and define mentionable_fields to specify which fields to scan for mentions
#
# Usage:
#   class Goal < ApplicationRecord
#     include Mentionable
#     mentionable_fields :title, :description, :notes
#   end
module Mentionable
  extend ActiveSupport::Concern

  included do
    # Only add the mentions association if it doesn't already exist
    has_many :mentions, as: :mentionable, dependent: :destroy unless reflect_on_association(:mentions)

    after_save :process_mentions, if: :should_process_mentions?
  end

  class_methods do
    # Define which fields on this model should be scanned for @mentions
    # @param fields [Array<Symbol>] List of field names to scan
    def mentionable_fields(*fields)
      @mentionable_fields = fields
    end

    # Get the list of mentionable fields for this model
    # @return [Array<Symbol>] List of field names
    def mentionable_text_fields
      @mentionable_fields || []
    end
  end

  private

  # Check if any mentionable fields changed
  def should_process_mentions?
    return false if self.class.mentionable_text_fields.empty?

    self.class.mentionable_text_fields.any? { |field| saved_change_to_attribute?(field) }
  end

  # Process mentions for all mentionable fields
  # Creates new Mention records for new @mentions
  # Deletes Mention records for removed @mentions
  def process_mentions
    self.class.mentionable_text_fields.each do |field|
      next unless saved_change_to_attribute?(field)

      process_field_mentions(field)
    end
  end

  # Process mentions for a single field
  # @param field [Symbol] The field name to process
  def process_field_mentions(field)
    text = send(field)
    field_name = field.to_s

    # Get currently mentioned users from the text
    mentioned_users = MentionParserService.extract_mentions(text, mentionable_family_id)

    # Get existing mentions for this field
    existing_mentions = mentions.where(text_field: field_name)

    # Create new mentions
    create_new_mentions(mentioned_users, existing_mentions, field_name)

    # Remove stale mentions
    remove_stale_mentions(mentioned_users, existing_mentions)
  end

  # Create Mention records for newly mentioned users
  def create_new_mentions(mentioned_users, existing_mentions, field_name)
    existing_user_ids = existing_mentions.pluck(:mentioned_user_id)

    mentioned_users.each do |mentioned_user|
      next if existing_user_ids.include?(mentioned_user.id)

      mentions.create!(
        user: mentionable_user,
        mentioned_user: mentioned_user,
        text_field: field_name
      )
    end
  end

  # Remove Mention records for users no longer mentioned
  def remove_stale_mentions(mentioned_users, existing_mentions)
    current_user_ids = mentioned_users.map(&:id)

    existing_mentions.each do |mention|
      mention.destroy unless current_user_ids.include?(mention.mentioned_user_id)
    end
  end

  # Get the family ID for this mentionable record
  # Override this method if the model doesn't have a direct family_id
  def mentionable_family_id
    return family_id if respond_to?(:family_id)
    return daily_plan&.family_id if respond_to?(:daily_plan)

    raise NotImplementedError, "#{self.class.name} must define mentionable_family_id or have a family association"
  end

  # Get the user who created/owns this mentionable record
  # Override this method if the model uses a different attribute name
  def mentionable_user
    find_user_from_associations || raise_mentionable_user_error
  end

  def find_user_from_associations
    find_direct_user || find_creator || find_user_via_daily_plan
  end

  def find_direct_user
    user if respond_to?(:user) && user.present?
  end

  def find_creator
    creator if respond_to?(:creator) && creator.present?
  end

  def find_user_via_daily_plan
    daily_plan.user if respond_to?(:daily_plan) && daily_plan&.user.present?
  end

  def raise_mentionable_user_error
    raise NotImplementedError, "#{self.class.name} must define mentionable_user or have a user/creator association"
  end
end
