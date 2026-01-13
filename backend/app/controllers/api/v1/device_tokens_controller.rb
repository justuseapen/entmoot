# frozen_string_literal: true

module Api
  module V1
    class DeviceTokensController < Api::V1::BaseController
      before_action :set_device_token, only: [:destroy]

      # POST /api/v1/device_tokens
      def create
        @device_token = find_or_initialize_token

        if @device_token.new_record?
          create_new_token
        else
          update_existing_token
        end
      end

      # DELETE /api/v1/device_tokens/:id
      def destroy
        @device_token.destroy
        head :no_content
      end

      # DELETE /api/v1/device_tokens/unregister
      def unregister
        device_token = current_user.device_tokens.find_by(token: params[:token])

        if device_token
          device_token.destroy
          head :no_content
        else
          render_error("Device token not found", status: :not_found)
        end
      end

      private

      def set_device_token
        @device_token = current_user.device_tokens.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_error("Device token not found", status: :not_found)
      end

      def find_or_initialize_token
        current_user.device_tokens.find_or_initialize_by(token: device_token_params[:token])
      end

      def create_new_token
        @device_token.assign_attributes(device_token_params)
        if @device_token.save
          render json: { device_token: device_token_response(@device_token) }, status: :created
        else
          render_errors(@device_token.errors.full_messages)
        end
      end

      def update_existing_token
        @device_token.update(
          platform: device_token_params[:platform],
          device_name: device_token_params[:device_name],
          last_used_at: Time.current
        )
        render json: { device_token: device_token_response(@device_token) }, status: :ok
      end

      def device_token_params
        params.require(:device_token).permit(:token, :platform, :device_name)
      end

      def device_token_response(token)
        {
          id: token.id,
          token: token.token,
          platform: token.platform,
          device_name: token.device_name,
          last_used_at: token.last_used_at,
          created_at: token.created_at,
          updated_at: token.updated_at
        }
      end
    end
  end
end
