# frozen_string_literal: true

module Api
  module V1
    class ProfileController < BaseController
      # PATCH /api/v1/users/me/profile
      def update
        if current_user.update(profile_params)
          render json: { user: user_response(current_user) }, status: :ok
        else
          render_errors(current_user.errors.full_messages)
        end
      end

      # PATCH /api/v1/users/me/password
      def update_password
        return render_invalid_current_password unless valid_current_password?
        return render_password_mismatch unless passwords_match?

        if current_user.update(password: params[:password], password_confirmation: params[:password_confirmation])
          render json: { message: "Password updated successfully" }, status: :ok
        else
          render_errors(current_user.errors.full_messages)
        end
      end

      # DELETE /api/v1/users/me
      def destroy
        unless current_user.valid_password?(params[:password])
          return render_error("Password is incorrect", status: :unprocessable_content)
        end

        # Revoke all tokens before destroying
        current_user.refresh_tokens.update_all(revoked_at: Time.current) # rubocop:disable Rails/SkipsModelValidations
        current_user.destroy!

        render json: { message: "Account deleted successfully" }, status: :ok
      end

      # GET /api/v1/users/me/export
      def export
        export_data = UserDataExportService.export(current_user)
        render json: export_data, status: :ok
      end

      private

      def profile_params
        params.permit(:name, :avatar_url)
      end

      def user_response(user)
        {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          created_at: user.created_at
        }
      end

      def valid_current_password?
        current_user.valid_password?(params[:current_password])
      end

      def passwords_match?
        params[:password] == params[:password_confirmation]
      end

      def render_invalid_current_password
        render_error("Current password is incorrect", status: :unprocessable_content)
      end

      def render_password_mismatch
        render_error("Password confirmation doesn't match", status: :unprocessable_content)
      end
    end
  end
end
