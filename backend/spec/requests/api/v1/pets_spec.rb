# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Pets" do
  let(:user) { create(:user) }
  let(:family) { create(:family) }

  describe "GET /api/v1/families/:family_id/pets" do
    context "when user is a family member" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "returns all pets in the family" do
        pets = create_list(:pet, 3, family: family)

        get "/api/v1/families/#{family.id}/pets", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["pets"].length).to eq(3)
        expect(json_response["pets"].pluck("id")).to match_array(pets.map(&:id))
      end

      it "returns empty array when family has no pets" do
        get "/api/v1/families/#{family.id}/pets", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["pets"]).to eq([])
      end

      it "does not return pets from other families" do
        create(:pet, family: family)
        other_family = create(:family)
        create(:pet, family: other_family)

        get "/api/v1/families/#{family.id}/pets", headers: auth_headers(user)

        expect(json_response["pets"].length).to eq(1)
      end
    end

    context "when user is not a family member" do
      it "returns 403" do
        get "/api/v1/families/#{family.id}/pets", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when family does not exist" do
      it "returns 404" do
        get "/api/v1/families/999999/pets", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end

    context "when not authenticated" do
      it "returns 401" do
        get "/api/v1/families/#{family.id}/pets"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/families/:family_id/pets/:id" do
    let!(:pet) { create(:pet, family: family, name: "Buddy", pet_type: "dog") }

    context "when user is a family member" do
      before { create(:family_membership, :child, family: family, user: user) }

      it "returns the pet details" do
        get "/api/v1/families/#{family.id}/pets/#{pet.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["pet"]).to include(
          "id" => pet.id,
          "name" => "Buddy",
          "pet_type" => "dog",
          "family_id" => family.id
        )
      end
    end

    context "when user is not a family member" do
      it "returns 403" do
        get "/api/v1/families/#{family.id}/pets/#{pet.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when pet does not exist" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "returns 404" do
        get "/api/v1/families/#{family.id}/pets/999999", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end

    context "when pet belongs to a different family" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "returns 404" do
        other_family = create(:family)
        other_pet = create(:pet, family: other_family)

        get "/api/v1/families/#{family.id}/pets/#{other_pet.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "POST /api/v1/families/:family_id/pets" do
    let(:valid_params) do
      {
        pet: {
          name: "Max",
          pet_type: "dog",
          birthday: "2020-05-15",
          notes: "Loves to play fetch"
        }
      }
    end

    context "when user is admin" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "creates a new pet" do
        expect do
          post "/api/v1/families/#{family.id}/pets", params: valid_params, headers: auth_headers(user)
        end.to change(Pet, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response["message"]).to eq("Pet created successfully.")
      end

      it "returns the created pet data" do
        post "/api/v1/families/#{family.id}/pets", params: valid_params, headers: auth_headers(user)

        expect(json_response["pet"]).to include(
          "name" => "Max",
          "pet_type" => "dog",
          "family_id" => family.id
        )
      end

      it "creates a pet with minimal data" do
        minimal_params = { pet: { name: "Whiskers" } }

        expect do
          post "/api/v1/families/#{family.id}/pets", params: minimal_params, headers: auth_headers(user)
        end.to change(Pet, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(json_response["pet"]["name"]).to eq("Whiskers")
      end
    end

    context "when user is adult" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "creates a new pet" do
        expect do
          post "/api/v1/families/#{family.id}/pets", params: valid_params, headers: auth_headers(user)
        end.to change(Pet, :count).by(1)

        expect(response).to have_http_status(:created)
      end
    end

    context "when user is teen" do
      before { create(:family_membership, :teen, family: family, user: user) }

      it "returns 403" do
        post "/api/v1/families/#{family.id}/pets", params: valid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is child" do
      before { create(:family_membership, :child, family: family, user: user) }

      it "returns 403" do
        post "/api/v1/families/#{family.id}/pets", params: valid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is observer" do
      before { create(:family_membership, :observer, family: family, user: user) }

      it "returns 403" do
        post "/api/v1/families/#{family.id}/pets", params: valid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "with invalid parameters" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "returns 422 when name is missing" do
        invalid_params = { pet: { pet_type: "dog" } }

        post "/api/v1/families/#{family.id}/pets", params: invalid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to include("Name can't be blank")
      end

      it "returns 422 when name is duplicate within family" do
        create(:pet, family: family, name: "Max")

        post "/api/v1/families/#{family.id}/pets", params: valid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to include("Name has already been taken for this family")
      end
    end

    context "when user is not a family member" do
      it "returns 403" do
        post "/api/v1/families/#{family.id}/pets", params: valid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH /api/v1/families/:family_id/pets/:id" do
    let!(:pet) { create(:pet, family: family, name: "Buddy") }

    context "when user is admin" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "updates the pet" do
        patch "/api/v1/families/#{family.id}/pets/#{pet.id}",
              params: { pet: { name: "Max", pet_type: "cat" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Pet updated successfully.")
        expect(json_response["pet"]["name"]).to eq("Max")
        expect(json_response["pet"]["pet_type"]).to eq("cat")
        expect(pet.reload.name).to eq("Max")
      end

      it "updates only provided fields" do
        original_type = pet.pet_type

        patch "/api/v1/families/#{family.id}/pets/#{pet.id}",
              params: { pet: { notes: "Updated notes" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(pet.reload.notes).to eq("Updated notes")
        expect(pet.pet_type).to eq(original_type)
      end
    end

    context "when user is adult" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "updates the pet" do
        patch "/api/v1/families/#{family.id}/pets/#{pet.id}",
              params: { pet: { name: "Max" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["pet"]["name"]).to eq("Max")
      end
    end

    context "when user is teen" do
      before { create(:family_membership, :teen, family: family, user: user) }

      it "returns 403" do
        patch "/api/v1/families/#{family.id}/pets/#{pet.id}",
              params: { pet: { name: "Max" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is not a family member" do
      it "returns 403" do
        patch "/api/v1/families/#{family.id}/pets/#{pet.id}",
              params: { pet: { name: "Max" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "with invalid parameters" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "returns 422 when name becomes empty" do
        patch "/api/v1/families/#{family.id}/pets/#{pet.id}",
              params: { pet: { name: "" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response["errors"]).to include("Name can't be blank")
      end

      it "returns 422 when name becomes duplicate" do
        create(:pet, family: family, name: "Max")

        patch "/api/v1/families/#{family.id}/pets/#{pet.id}",
              params: { pet: { name: "Max" } },
              headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_content)
      end
    end
  end

  describe "DELETE /api/v1/families/:family_id/pets/:id" do
    let!(:pet) { create(:pet, family: family) }

    context "when user is admin" do
      before { create(:family_membership, :admin, family: family, user: user) }

      it "deletes the pet" do
        expect do
          delete "/api/v1/families/#{family.id}/pets/#{pet.id}", headers: auth_headers(user)
        end.to change(Pet, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(json_response["message"]).to eq("Pet deleted successfully.")
      end
    end

    context "when user is adult" do
      before { create(:family_membership, :adult, family: family, user: user) }

      it "deletes the pet" do
        expect do
          delete "/api/v1/families/#{family.id}/pets/#{pet.id}", headers: auth_headers(user)
        end.to change(Pet, :count).by(-1)

        expect(response).to have_http_status(:ok)
      end
    end

    context "when user is teen" do
      before { create(:family_membership, :teen, family: family, user: user) }

      it "returns 403" do
        delete "/api/v1/families/#{family.id}/pets/#{pet.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is child" do
      before { create(:family_membership, :child, family: family, user: user) }

      it "returns 403" do
        delete "/api/v1/families/#{family.id}/pets/#{pet.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when user is not a family member" do
      it "returns 403" do
        delete "/api/v1/families/#{family.id}/pets/#{pet.id}", headers: auth_headers(user)

        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
