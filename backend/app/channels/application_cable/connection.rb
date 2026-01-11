# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      token = request.params[:token]
      return reject_unauthorized_connection if token.blank?

      begin
        decoded = Warden::JWTAuth::TokenDecoder.new.call(token)
        user = User.find(decoded["sub"])
        user || reject_unauthorized_connection
      rescue JWT::DecodeError, ActiveRecord::RecordNotFound
        reject_unauthorized_connection
      end
    end
  end
end
