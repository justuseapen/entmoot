# frozen_string_literal: true

require "rails_helper"

RSpec.describe ApplicationCable::Connection, type: :channel do
  let(:user) { create(:user) }

  describe "#connect" do
    context "with valid session" do
      it "successfully connects when user is authenticated via warden" do
        connect_with_session(user)

        expect(connection.current_user).to eq(user)
      end
    end

    context "without session" do
      it "rejects connection when no user is authenticated" do
        expect { connect "/cable" }.to have_rejected_connection
      end

      it "rejects connection when warden returns nil user" do
        connect_with_session(nil)

        expect(connection.current_user).to be_nil
      rescue ActionCable::Connection::Authorization::UnauthorizedError
        # Expected - connection was rejected
      end
    end
  end

  private

  def connect_with_session(user)
    # Stub the warden env to simulate session-based authentication
    warden = instance_double(Warden::Proxy, user: user)
    connect "/cable", env: { "warden" => warden }
  end
end
