# frozen_string_literal: true

module Api
  module V1
    class FamiliesController < BaseController
      before_action :set_family, only: %i[show update destroy members]

      def index
        @families = policy_scope(Family)
        render json: { families: @families.map { |f| family_response(f) } }
      end

      def show
        authorize @family
        render json: { family: family_response(@family, include_members: true) }
      end

      def create
        @family = Family.new(family_params)
        authorize @family

        create_family_with_membership
        render_created_family
      rescue ActiveRecord::RecordInvalid => e
        render_validation_errors(e.record)
      end

      def update
        authorize @family

        if @family.update(family_params)
          render json: {
            message: "Family updated successfully.",
            family: family_response(@family)
          }
        else
          render_validation_errors(@family)
        end
      end

      def destroy
        authorize @family

        @family.destroy
        render json: { message: "Family deleted successfully." }
      end

      def members
        authorize @family, :show?
        memberships = @family.family_memberships.includes(:user)

        render json: {
          members: memberships.map { |m| membership_response(m) }
        }
      end

      private

      def set_family
        @family = Family.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_error(
          "This family doesn't exist or you don't have access to it.",
          status: :not_found
        )
      end

      def family_params
        params.require(:family).permit(:name, :timezone, settings: {})
      end

      def create_family_with_membership
        Family.transaction do
          @family.save!
          FamilyMembership.create!(family: @family, user: current_user, role: :admin)
        end
      end

      def render_created_family
        render json: {
          message: "Family created successfully.",
          family: family_response(@family, include_members: true)
        }, status: :created
      end

      def family_response(family, include_members: false)
        response = {
          id: family.id,
          name: family.name,
          timezone: family.timezone,
          settings: family.settings,
          created_at: family.created_at,
          updated_at: family.updated_at
        }

        if include_members
          response[:members] = family.family_memberships.includes(:user).map do |m|
            membership_response(m)
          end
        end

        response
      end

      def membership_response(membership)
        {
          id: membership.id,
          user_id: membership.user.id,
          name: membership.user.name,
          email: membership.user.email,
          avatar_url: membership.user.avatar_url,
          role: membership.role,
          joined_at: membership.created_at
        }
      end
    end
  end
end
