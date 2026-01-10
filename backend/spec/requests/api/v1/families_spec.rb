# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Families" do
  let(:user) { create(:user) }

  describe "GET /api/v1/families" do
    context "when authenticated" do
      it "returns only families the user is a member of" do
        family = create(:family)
        create(:family_membership, :admin, family: family, user: user)
        create(:family) # other family that user is not a member of

        get "/api/v1/families", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["families"].length).to eq(1)
        expect(json_response["families"][0]["id"]).to eq(family.id)
      end
    end

    context "when not authenticated" do
      it "returns 401" do
        get "/api/v1/families"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/families/:id" do
    let(:family) { create(:family) }

    context "when user is a member" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "returns the family with members" do
        get "/api/v1/families/#{family.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["family"]["id"]).to eq(family.id)
        expect(json_response["family"]["name"]).to eq(family.name)
        expect(json_response["family"]["members"]).to be_an(Array)
      end
    end

    context "when user is not a member" do
      it "returns 403" do
        get "/api/v1/families/#{family.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when family does not exist" do
      it "returns 404" do
        get "/api/v1/families/999999", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "POST /api/v1/families" do
    let(:valid_params) do
      {
        family: {
          name: "The Smiths",
          timezone: "America/New_York"
        }
      }
    end

    context "with valid parameters" do
      it "creates a new family" do
        expect do
          post "/api/v1/families", params: valid_params, headers: auth_headers(user)
        end.to change(Family, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response["message"]).to eq("Family created successfully.")
        expect(json_response["family"]["name"]).to eq("The Smiths")
      end

      it "makes the creator an admin member" do
        expect do
          post "/api/v1/families", params: valid_params, headers: auth_headers(user)
        end.to change(FamilyMembership, :count).by(1)

        membership = FamilyMembership.last
        expect(membership.user).to eq(user)
        expect(membership.role).to eq("admin")
      end

      it "uses default UTC timezone if not provided" do
        params = { family: { name: "No Timezone Family" } }
        post "/api/v1/families", params: params, headers: auth_headers(user)

        expect(response).to have_http_status(:created)
        expect(json_response["family"]["timezone"]).to eq("UTC")
      end
    end

    context "with invalid parameters" do
      it "returns 422 when name is missing" do
        invalid_params = { family: { timezone: "America/New_York" } }

        post "/api/v1/families", params: invalid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to include("Name can't be blank")
      end
    end
  end

  describe "PATCH /api/v1/families/:id" do
    let(:family) { create(:family, name: "Original Name") }

    context "when user is admin" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "updates the family" do
        patch "/api/v1/families/#{family.id}",
              params: { family: { name: "Updated Name" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["family"]["name"]).to eq("Updated Name")
        expect(family.reload.name).to eq("Updated Name")
      end
    end

    context "when user is adult (not admin)" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "returns 403" do
        patch "/api/v1/families/#{family.id}",
              params: { family: { name: "Updated Name" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is not a member" do
      it "returns 403" do
        patch "/api/v1/families/#{family.id}",
              params: { family: { name: "Updated Name" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "DELETE /api/v1/families/:id" do
    let(:family) { create(:family) }

    context "when user is admin" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "deletes the family" do
        expect do
          delete "/api/v1/families/#{family.id}", headers: auth_headers(user)
        end.to change(Family, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Family deleted successfully.")
      end
    end

    context "when user is not admin" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "returns 403" do
        delete "/api/v1/families/#{family.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /api/v1/families/:id/members" do
    let(:family) { create(:family) }
    let(:other_user) { create(:user) }

    before do
      create(:family_membership, :admin, family: family, user: user)
      create(:family_membership, :adult, family: family, user: other_user)
    end

    it "returns all family members" do
      get "/api/v1/families/#{family.id}/members", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["members"].length).to eq(2)
    end

    it "includes member details" do
      get "/api/v1/families/#{family.id}/members", headers: auth_headers(user)

      member = json_response["members"].find { |m| m["user_id"] == user.id }
      expect(member["name"]).to eq(user.name)
      expect(member["email"]).to eq(user.email)
      expect(member["role"]).to eq("admin")
    end
  end
end
