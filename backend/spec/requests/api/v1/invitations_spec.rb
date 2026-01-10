# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invitations" do
  let(:user) { create(:user) }
  let(:family) { create(:family) }

  before do
    create(:family_membership, :admin, family: family, user: user)
  end

  describe "GET /api/v1/families/:family_id/invitations" do
    it "returns only pending invitations" do
      pending_invitation = create(:invitation, family: family, inviter: user)
      create(:invitation, :expired, family: family, inviter: user)
      create(:invitation, :accepted, family: family, inviter: user)

      get "/api/v1/families/#{family.id}/invitations", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["invitations"].length).to eq(1)
      expect(json_response["invitations"][0]["id"]).to eq(pending_invitation.id)
    end

    context "when user is not a member" do
      it "returns 403" do
        other_user = create(:user)
        get "/api/v1/families/#{family.id}/invitations", headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST /api/v1/families/:family_id/invitations" do
    let(:valid_params) do
      {
        invitation: {
          email: "newmember@example.com",
          role: "adult"
        }
      }
    end

    context "when user can invite (admin/adult)" do
      it "creates an invitation" do
        expect do
          post "/api/v1/families/#{family.id}/invitations",
               params: valid_params,
               headers: auth_headers(user)
        end.to change(Invitation, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response["message"]).to eq("Invitation sent successfully.")
        expect(json_response["invitation"]["email"]).to eq("newmember@example.com")
        expect(json_response["invitation"]["role"]).to eq("adult")
      end
    end

    context "when user is adult" do
      let(:adult_user) { create(:user) }

      before do
        create(:family_membership, :adult, family: family, user: adult_user)
      end

      it "can create an invitation" do
        post "/api/v1/families/#{family.id}/invitations",
             params: valid_params,
             headers: auth_headers(adult_user)

        expect(response).to have_http_status(:created)
      end
    end

    context "when user is teen" do
      let(:teen_user) { create(:user) }

      before do
        create(:family_membership, :teen, family: family, user: teen_user)
      end

      it "returns 403" do
        post "/api/v1/families/#{family.id}/invitations",
             params: valid_params,
             headers: auth_headers(teen_user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when inviting an existing member" do
      let(:existing_member) { create(:user) }

      before do
        create(:family_membership, family: family, user: existing_member)
      end

      it "returns 422" do
        params = { invitation: { email: existing_member.email, role: "adult" } }

        post "/api/v1/families/#{family.id}/invitations",
             params: params,
             headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["error"]).to include("already a member")
      end
    end

    context "with invalid email" do
      it "returns 422" do
        invalid_params = { invitation: { email: "not-an-email", role: "adult" } }

        post "/api/v1/families/#{family.id}/invitations",
             params: invalid_params,
             headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to include("Email is invalid")
      end
    end
  end

  describe "DELETE /api/v1/families/:family_id/invitations/:id" do
    let!(:invitation) { create(:invitation, family: family, inviter: user) }

    context "when user is admin" do
      it "deletes the invitation" do
        expect do
          delete "/api/v1/families/#{family.id}/invitations/#{invitation.id}",
                 headers: auth_headers(user)
        end.to change(Invitation, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Invitation cancelled successfully.")
      end
    end

    context "when user is the inviter" do
      let(:adult_user) { create(:user) }
      let!(:adult_invitation) { create(:invitation, family: family, inviter: adult_user) }

      before do
        create(:family_membership, :adult, family: family, user: adult_user)
      end

      it "can delete their own invitation" do
        delete "/api/v1/families/#{family.id}/invitations/#{adult_invitation.id}",
               headers: auth_headers(adult_user)

        expect(response).to have_http_status(:ok)
      end
    end

    context "when user cannot delete" do
      let(:other_user) { create(:user) }

      before do
        create(:family_membership, :adult, family: family, user: other_user)
      end

      it "returns 403" do
        delete "/api/v1/families/#{family.id}/invitations/#{invitation.id}",
               headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST /api/v1/families/:family_id/invitations/:id/resend" do
    it "does not change expiration for non-expired invitation" do
      invitation = create(:invitation, family: family, inviter: user)
      original_expires_at = invitation.expires_at

      post "/api/v1/families/#{family.id}/invitations/#{invitation.id}/resend",
           headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["message"]).to eq("Invitation resent successfully.")
      expect(invitation.reload.expires_at).to eq(original_expires_at)
    end

    context "with expired invitation" do
      it "extends expiration" do
        expired_invitation = create(:invitation, :expired, family: family, inviter: user)

        freeze_time do
          post "/api/v1/families/#{family.id}/invitations/#{expired_invitation.id}/resend",
               headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(expired_invitation.reload.expires_at).to be_within(1.second).of(7.days.from_now)
        end
      end
    end
  end

  describe "POST /api/v1/invitations/:token/accept" do
    let(:invitation) { create(:invitation, family: family, inviter: user, email: "invitee@example.com") }

    context "when user is authenticated" do
      let(:invitee) { create(:user) }

      it "accepts the invitation and creates membership" do
        expect do
          post "/api/v1/invitations/#{invitation.token}/accept",
               headers: auth_headers(invitee)
        end.to change(FamilyMembership, :count).by(1)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Invitation accepted successfully.")
        expect(json_response["family"]["id"]).to eq(family.id)
      end

      context "when already a member" do
        before do
          create(:family_membership, family: family, user: invitee)
        end

        it "returns 422" do
          post "/api/v1/invitations/#{invitation.token}/accept",
               headers: auth_headers(invitee)

          expect(response).to have_http_status(:unprocessable_content)
          expect(json_response["error"]).to include("already a member")
        end
      end
    end

    context "when not authenticated" do
      it "returns auth required info" do
        post "/api/v1/invitations/#{invitation.token}/accept"

        expect(response).to have_http_status(:unauthorized)
        expect(json_response["requires_auth"]).to be true
        expect(json_response["invitation"]["email"]).to eq("invitee@example.com")
        expect(json_response["invitation"]["family_name"]).to eq(family.name)
      end

      context "with user registration params" do
        let(:user_params) do
          {
            user: {
              name: "New User",
              password: "password123",
              password_confirmation: "password123"
            }
          }
        end

        it "creates user and accepts invitation" do
          expect do
            post "/api/v1/invitations/#{invitation.token}/accept", params: user_params
          end.to change(User, :count).by(1)
                                     .and change(FamilyMembership, :count).by(1)

          expect(response).to have_http_status(:ok)
          new_user = User.find_by(email: invitation.email)
          expect(new_user.name).to eq("New User")
        end
      end
    end

    context "with invalid token" do
      it "returns 404" do
        post "/api/v1/invitations/invalid-token/accept"

        expect(response).to have_http_status(:not_found)
      end
    end

    context "with expired invitation" do
      let(:expired_invitation) { create(:invitation, :expired, family: family, inviter: user) }

      it "returns 410 gone" do
        post "/api/v1/invitations/#{expired_invitation.token}/accept"

        expect(response).to have_http_status(:gone)
        expect(json_response["error"]).to eq("Invitation has expired")
      end
    end

    context "with already accepted invitation" do
      let(:accepted_invitation) { create(:invitation, :accepted, family: family, inviter: user) }

      it "returns 410 gone" do
        post "/api/v1/invitations/#{accepted_invitation.token}/accept"

        expect(response).to have_http_status(:gone)
        expect(json_response["error"]).to eq("Invitation has already been accepted")
      end
    end
  end
end
