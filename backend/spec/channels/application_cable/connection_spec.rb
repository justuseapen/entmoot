# frozen_string_literal: true

require "rails_helper"

RSpec.describe ApplicationCable::Connection, type: :channel do
  let(:user) { create(:user) }

  describe "#connect" do
    context "with valid JWT token" do
      it "successfully connects when user is authenticated via JWT" do
        token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
        connect "/cable?token=#{token}"

        expect(connection.current_user).to eq(user)
      end
    end

    context "without token" do
      it "rejects connection when no token is provided" do
        expect { connect "/cable" }.to have_rejected_connection
      end

      it "rejects connection when token is invalid" do
        expect { connect "/cable?token=invalid_token" }.to have_rejected_connection
      end
    end
  end
end
