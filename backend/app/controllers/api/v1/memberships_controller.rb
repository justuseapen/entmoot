# frozen_string_literal: true

module Api
  module V1
    class MembershipsController < BaseController
      before_action :set_family
      before_action :set_membership, only: %i[update destroy]

      def index
        authorize FamilyMembership.new(family: @family)
        @memberships = @family.family_memberships.includes(:user)

        render json: {
          members: @memberships.map { |m| membership_response(m) }
        }
      end

      def update
        authorize @membership

        if @membership.update(membership_params)
          render json: {
            message: "Member role updated successfully.",
            member: membership_response(@membership)
          }
        else
          render_errors(@membership.errors.full_messages)
        end
      end

      def destroy
        authorize @membership

        if @membership.admin? && @family.family_memberships.admin.one?
          return render_error("Cannot remove the last admin from the family")
        end

        @membership.destroy
        render json: { message: "Member removed from family successfully." }
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def set_membership
        @membership = @family.family_memberships.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Member not found" }, status: :not_found
      end

      def membership_params
        params.require(:membership).permit(:role)
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
