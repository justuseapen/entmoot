# frozen_string_literal: true

require "rails_helper"

RSpec.describe InvitationMailer do
  let(:family) { create(:family, name: "Smith Family") }
  let(:inviter) { create(:user, name: "John Smith") }
  let(:invitation) { create(:invitation, family: family, inviter: inviter, email: "jane@example.com", role: :adult) }

  describe "#send_invitation" do
    let(:mail) { described_class.send_invitation(invitation) }

    it "renders the headers" do
      expect(mail.subject).to eq("John Smith invited you to join Smith Family on Entmoot")
      expect(mail.to).to eq(["jane@example.com"])
      expect(mail.from).to eq(["hello@mail.entmoot.app"])
    end

    it "includes the family name" do
      expect(mail.body.encoded).to include("Smith Family")
    end

    it "includes the inviter name" do
      expect(mail.body.encoded).to include("John Smith")
    end

    it "includes the accept link with token" do
      expect(mail.body.encoded).to include(invitation.token)
      expect(mail.body.encoded).to include("Accept Invitation")
    end

    it "includes the accept URL path" do
      expect(mail.body.encoded).to include("/accept-invitation/#{invitation.token}")
    end

    it "includes the role" do
      expect(mail.body.encoded).to include("Adult")
    end

    it "includes key features" do
      body = mail.body.encoded
      expect(body).to include("Shared Goals")
      expect(body).to include("Daily Planning")
      expect(body).to include("Weekly Reviews")
    end

    context "with different roles" do
      let(:invitation) { create(:invitation, family: family, inviter: inviter, email: "teen@example.com", role: :teen) }

      it "displays the correct role" do
        expect(mail.body.encoded).to include("Teen")
      end
    end
  end
end
