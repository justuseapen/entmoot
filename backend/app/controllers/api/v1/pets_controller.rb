# frozen_string_literal: true

module Api
  module V1
    class PetsController < BaseController
      before_action :set_family
      before_action :set_pet, only: %i[show update destroy]

      def index
        @pets = @family.pets
        authorize @family, policy_class: PetPolicy

        render json: { pets: @pets.map { |pet| pet_response(pet) } }
      end

      def show
        authorize @pet

        render json: { pet: pet_response(@pet) }
      end

      def create
        @pet = @family.pets.build(pet_params)
        authorize @pet

        if @pet.save
          render json: {
            message: "Pet created successfully.",
            pet: pet_response(@pet)
          }, status: :created
        else
          render_errors(@pet.errors.full_messages)
        end
      end

      def update
        authorize @pet

        if @pet.update(pet_params)
          render json: {
            message: "Pet updated successfully.",
            pet: pet_response(@pet)
          }
        else
          render_errors(@pet.errors.full_messages)
        end
      end

      def destroy
        authorize @pet

        @pet.destroy
        render json: { message: "Pet deleted successfully." }
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def set_pet
        @pet = @family.pets.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Pet not found" }, status: :not_found
      end

      def pet_params
        params.require(:pet).permit(:name, :pet_type, :avatar_url, :birthday, :notes)
      end

      def pet_response(pet)
        {
          id: pet.id,
          name: pet.name,
          pet_type: pet.pet_type,
          avatar_url: pet.avatar_url,
          birthday: pet.birthday,
          notes: pet.notes,
          family_id: pet.family_id,
          created_at: pet.created_at,
          updated_at: pet.updated_at
        }
      end
    end
  end
end
