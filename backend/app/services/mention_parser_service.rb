# frozen_string_literal: true

class MentionParserService
  # Regex to match @mentions: @ followed by word characters (letters, numbers, underscore)
  # Case-insensitive matching done at database level
  MENTION_PATTERN = /@(\w+)/i

  class << self
    # Extract user objects from text that are mentioned with @firstname format
    # @param text [String, nil] The text to parse for mentions
    # @param family_id [Integer] The family to search for members in
    # @return [Array<User>] Array of unique User objects that were mentioned
    def extract_mentions(text, family_id)
      return [] if text.blank?

      # Extract all potential names from text
      mentioned_names = extract_names(text)
      return [] if mentioned_names.empty?

      # Find users in the family matching those names (case-insensitive)
      find_family_members(mentioned_names, family_id)
    end

    private

    # Extract unique lowercase names from @mentions in text
    def extract_names(text)
      text.scan(MENTION_PATTERN).flatten.map(&:downcase).uniq
    end

    # Find family members whose first name matches any of the mentioned names
    def find_family_members(names, family_id)
      family = Family.find_by(id: family_id)
      return [] if family.nil?

      # Get members where first name (first word of name) matches case-insensitively
      family.members.select do |member|
        first_name = member.name.split.first&.downcase
        names.include?(first_name)
      end.uniq
    end
  end
end
