# frozen_string_literal: true

module Api
  module V1
    class InvitationsController < BaseController
      before_action :set_family, only: %i[index create]
      before_action :set_invitation, only: %i[destroy resend]
      skip_before_action :authenticate_user!, only: [:accept]

      def index
        authorize Invitation.new(family: @family)
        @invitations = @family.invitations.pending.includes(:inviter)

        render json: {
          invitations: @invitations.map { |i| invitation_response(i) }
        }
      end

      def create
        @invitation = @family.invitations.new(invitation_params)
        @invitation.inviter = current_user
        authorize @invitation

        if existing_member?
          return render_error("User is already a member of this family", status: :unprocessable_content)
        end

        if @invitation.save
          track_first_family_invite
          render json: {
            message: "Invitation sent successfully.",
            invitation: invitation_response(@invitation)
          }, status: :created
        else
          render_errors(@invitation.errors.full_messages)
        end
      end

      def destroy
        authorize @invitation
        @invitation.destroy
        render json: { message: "Invitation cancelled successfully." }
      end

      def resend
        authorize @invitation

        @invitation.update!(expires_at: 7.days.from_now) if @invitation.expired?

        render json: {
          message: "Invitation resent successfully.",
          invitation: invitation_response(@invitation)
        }
      end

      def accept
        @invitation = Invitation.find_by(token: params[:token])

        return render_not_found("Invitation not found") if @invitation.nil?
        return render_gone("Invitation has expired") if @invitation.expired?
        return render_gone("Invitation has already been accepted") if @invitation.accepted?

        process_invitation_acceptance
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def set_invitation
        @invitation = Invitation.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Invitation not found" }, status: :not_found
      end

      def invitation_params
        params.require(:invitation).permit(:email, :role)
      end

      def existing_member?
        user = User.find_by(email: @invitation.email)
        user&.member_of?(@family)
      end

      def process_invitation_acceptance
        user = find_or_require_user
        return unless user

        if user.member_of?(@invitation.family)
          return render_error("You are already a member of this family", status: :unprocessable_content)
        end

        accept_and_render(user)
      end

      def accept_and_render(user)
        if @invitation.accept!(user)
          is_first_action = user.record_first_action?(:invitation_accepted)
          render json: {
            message: "Invitation accepted successfully.",
            family: family_response(@invitation.family),
            is_first_action: is_first_action
          }
        else
          render_error("Failed to accept invitation")
        end
      end

      def render_not_found(message)
        render json: { error: message }, status: :not_found
      end

      def render_gone(message)
        render json: { error: message }, status: :gone
      end

      def find_or_require_user
        return current_user if current_user
        return find_or_create_user_from_params if params[:user].present?

        render_auth_required
        nil
      end

      def render_auth_required
        render json: {
          error: "Authentication required",
          requires_auth: true,
          invitation: { email: @invitation.email, family_name: @invitation.family.name, role: @invitation.role }
        }, status: :unauthorized
      end

      def find_or_create_user_from_params
        existing_user = User.find_by(email: @invitation.email)
        return authenticate_existing_user(existing_user) if existing_user

        create_new_user
      end

      def authenticate_existing_user(user)
        return user if user.valid_password?(params[:user][:password])

        render json: { error: "Invalid password" }, status: :unauthorized
        nil
      end

      def create_new_user
        user = User.new(user_params_for_invitation)
        return user if user.save

        render_errors(user.errors.full_messages)
        nil
      end

      def user_params_for_invitation
        { email: @invitation.email }.merge(params[:user].permit(:password, :password_confirmation, :name).to_h)
      end

      def track_first_family_invite
        return if current_user.first_family_invite_sent_at.present?

        current_user.update(first_family_invite_sent_at: Time.current)
      end

      def invitation_response(invitation)
        {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expires_at: invitation.expires_at,
          created_at: invitation.created_at,
          inviter: {
            id: invitation.inviter.id,
            name: invitation.inviter.name
          }
        }
      end

      def family_response(family)
        {
          id: family.id,
          name: family.name,
          timezone: family.timezone
        }
      end
    end
  end
end
