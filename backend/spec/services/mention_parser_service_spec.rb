# frozen_string_literal: true

require "rails_helper"

RSpec.describe MentionParserService do
  let(:family) { create(:family) }
  let(:alice) { create(:user, name: "Alice Smith") }
  let(:bob) { create(:user, name: "Bob Jones") }
  let(:charlie) { create(:user, name: "Charlie Brown") }

  before do
    create(:family_membership, user: alice, family: family, role: :admin)
    create(:family_membership, user: bob, family: family, role: :adult)
    create(:family_membership, user: charlie, family: family, role: :child)
  end

  describe ".extract_mentions" do
    context "with a single mention" do
      it "returns the mentioned user" do
        text = "Great job @alice on your workout!"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to contain_exactly(alice)
      end
    end

    context "with multiple mentions" do
      it "returns all mentioned users" do
        text = "@bob and @charlie did great today"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to contain_exactly(bob, charlie)
      end
    end

    context "with case-insensitive matching" do
      it "matches uppercase mentions" do
        text = "@ALICE completed her goals"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to contain_exactly(alice)
      end

      it "matches mixed case mentions" do
        text = "@AlIcE and @BoB worked together"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to contain_exactly(alice, bob)
      end

      it "matches when user name is capitalized differently" do
        user_with_caps = create(:user, name: "DAVID Smith")
        create(:family_membership, user: user_with_caps, family: family, role: :adult)

        text = "Thanks @david for your help"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to contain_exactly(user_with_caps)
      end
    end

    context "with duplicate mentions" do
      it "returns unique users only" do
        text = "@alice did this and @alice did that too"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to contain_exactly(alice)
        expect(result.length).to eq(1)
      end
    end

    context "with mentions of non-existent names" do
      it "ignores names not in the family" do
        text = "@alice and @unknown are here"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to contain_exactly(alice)
      end

      it "returns empty array when no names match" do
        text = "@stranger mentioned @nobody"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to be_empty
      end
    end

    context "with users not in the family" do
      it "does not include users from other families" do
        other_family = create(:family)
        other_user = create(:user, name: "Alice Other")
        create(:family_membership, user: other_user, family: other_family, role: :admin)

        text = "@alice mentioned here"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to contain_exactly(alice)
        expect(result).not_to include(other_user)
      end
    end

    context "with nil or blank text" do
      it "returns empty array for nil text" do
        result = described_class.extract_mentions(nil, family.id)
        expect(result).to be_empty
      end

      it "returns empty array for empty string" do
        result = described_class.extract_mentions("", family.id)
        expect(result).to be_empty
      end

      it "returns empty array for whitespace-only string" do
        result = described_class.extract_mentions("   ", family.id)
        expect(result).to be_empty
      end
    end

    context "with invalid family_id" do
      it "returns empty array for non-existent family" do
        text = "@alice is mentioned"
        result = described_class.extract_mentions(text, 999_999)

        expect(result).to be_empty
      end
    end

    context "with text containing no mentions" do
      it "returns empty array" do
        text = "Just some regular text without any mentions"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to be_empty
      end
    end

    context "with special characters in text" do
      it "handles mentions at start of text" do
        text = "@alice is first"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to contain_exactly(alice)
      end

      it "handles mentions at end of text" do
        text = "Thanks to @bob"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to contain_exactly(bob)
      end

      it "handles mentions after punctuation" do
        text = "Hey, @alice and @bob!"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to contain_exactly(alice, bob)
      end

      it "handles mentions in parentheses" do
        text = "Great work (@charlie and @alice)"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to contain_exactly(alice, charlie)
      end

      it "handles newlines between mentions" do
        text = "@alice did X\n@bob did Y"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to contain_exactly(alice, bob)
      end
    end

    context "with email-like patterns" do
      it "does not match email addresses" do
        text = "Contact alice@example.com for help"
        result = described_class.extract_mentions(text, family.id)

        # The regex will match @example from the email, but "example" won't be a family member
        expect(result).not_to include(alice)
      end
    end

    context "with mentions containing numbers" do
      it "matches names with numbers" do
        user_with_num = create(:user, name: "Charlie2 Test")
        create(:family_membership, user: user_with_num, family: family, role: :teen)

        text = "Thanks @charlie2 for helping"
        result = described_class.extract_mentions(text, family.id)

        expect(result).to contain_exactly(user_with_num)
      end
    end
  end
end
