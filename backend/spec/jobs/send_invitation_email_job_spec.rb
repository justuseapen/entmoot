# frozen_string_literal: true

require "rails_helper"

RSpec.describe SendInvitationEmailJob do
  let(:family) { create(:family) }
  let(:inviter) { create(:user) }
  let(:invitation) { create(:invitation, family: family, inviter: inviter) }

  describe "#perform" do
    it "sends invitation email" do
      expect { described_class.new.perform(invitation.id) }
        .to have_enqueued_mail(InvitationMailer, :send_invitation)
        .with(invitation)
    end

    it "does not send email for accepted invitation" do
      invitation.update!(accepted_at: Time.current)
      expect { described_class.new.perform(invitation.id) }
        .not_to have_enqueued_mail(InvitationMailer)
    end

    it "does not raise for missing invitation" do
      expect { described_class.new.perform(999_999) }.not_to raise_error
    end

    it "does not send email when invitation is nil" do
      expect { described_class.new.perform(999_999) }
        .not_to have_enqueued_mail(InvitationMailer)
    end
  end
end
