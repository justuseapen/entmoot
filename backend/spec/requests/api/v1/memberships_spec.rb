# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Memberships" do
  let(:admin_user) { create(:user) }
  let(:family) { create(:family) }
  let(:admin_membership) { create(:family_membership, :admin, family: family, user: admin_user) }

  before { admin_membership }

  describe "GET /api/v1/families/:family_id/memberships" do
    context "when user is a member" do
      it "returns all family members" do
        adult_user = create(:user)
        create(:family_membership, :adult, family: family, user: adult_user)

        get "/api/v1/families/#{family.id}/memberships", headers: auth_headers(admin_user)

        expect(response).to have_http_status(:ok)
        expect(json_response["members"].length).to eq(2)
      end

      it "includes member details and roles" do
        get "/api/v1/families/#{family.id}/memberships", headers: auth_headers(admin_user)

        member = json_response["members"].find { |m| m["user_id"] == admin_user.id }
        expect(member["name"]).to eq(admin_user.name)
        expect(member["email"]).to eq(admin_user.email)
        expect(member["role"]).to eq("admin")
      end
    end

    context "when user is not a member" do
      it "returns 403" do
        other_user = create(:user)
        get "/api/v1/families/#{family.id}/memberships", headers: auth_headers(other_user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH /api/v1/families/:family_id/memberships/:id" do
    context "when user is admin" do
      it "updates member role" do
        adult_user = create(:user)
        adult_membership = create(:family_membership, :adult, family: family, user: adult_user)

        patch "/api/v1/families/#{family.id}/memberships/#{adult_membership.id}",
              params: { membership: { role: "teen" } },
              headers: auth_headers(admin_user)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Member role updated successfully.")
        expect(json_response["member"]["role"]).to eq("teen")
        expect(adult_membership.reload.role).to eq("teen")
      end

      it "cannot update own membership" do
        patch "/api/v1/families/#{family.id}/memberships/#{admin_membership.id}",
              params: { membership: { role: "adult" } },
              headers: auth_headers(admin_user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is not admin" do
      it "returns 403" do
        adult_user = create(:user)
        adult_membership = create(:family_membership, :adult, family: family, user: adult_user)

        patch "/api/v1/families/#{family.id}/memberships/#{adult_membership.id}",
              params: { membership: { role: "teen" } },
              headers: auth_headers(adult_user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /api/v1/families/:family_id/memberships/:id" do
    context "when user is admin" do
      it "removes member from family" do
        adult_user = create(:user)
        adult_membership = create(:family_membership, :adult, family: family, user: adult_user)

        expect do
          delete "/api/v1/families/#{family.id}/memberships/#{adult_membership.id}",
                 headers: auth_headers(admin_user)
        end.to change(FamilyMembership, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Member removed from family successfully.")
      end

      it "cannot remove self from family" do
        delete "/api/v1/families/#{family.id}/memberships/#{admin_membership.id}",
               headers: auth_headers(admin_user)

        expect(response).to have_http_status(:forbidden)
      end

      it "allows removal when there are other admins" do
        adult_user = create(:user)
        adult_membership = create(:family_membership, :admin, family: family, user: adult_user)

        delete "/api/v1/families/#{family.id}/memberships/#{adult_membership.id}",
               headers: auth_headers(admin_user)

        expect(response).to have_http_status(:ok)
      end
    end

    context "when user is not admin" do
      it "returns 403" do
        adult_user = create(:user)
        adult_membership = create(:family_membership, :adult, family: family, user: adult_user)

        delete "/api/v1/families/#{family.id}/memberships/#{adult_membership.id}",
               headers: auth_headers(adult_user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
