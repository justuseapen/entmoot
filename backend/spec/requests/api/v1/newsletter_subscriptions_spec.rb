# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::NewsletterSubscriptions" do
  describe "POST /api/v1/newsletter/subscribe" do
    context "with valid email" do
      it "creates a subscription and returns 201" do
        expect do
          post "/api/v1/newsletter/subscribe", params: { email: "test@example.com" }
        end.to change(NewsletterSubscription, :count).by(1)

        expect(response).to have_http_status(:created)
        json = response.parsed_body
        expect(json["message"]).to eq("Successfully subscribed")
        expect(json["email"]).to eq("test@example.com")
      end

      it "sets subscribed_at timestamp" do
        freeze_time do
          post "/api/v1/newsletter/subscribe", params: { email: "test@example.com" }

          subscription = NewsletterSubscription.last
          expect(subscription.subscribed_at).to eq(Time.current)
        end
      end

      it "sets status to pending by default" do
        post "/api/v1/newsletter/subscribe", params: { email: "test@example.com" }

        subscription = NewsletterSubscription.last
        expect(subscription.status).to eq("pending")
      end
    end

    context "with invalid email format" do
      it "returns 422 with error message" do
        post "/api/v1/newsletter/subscribe", params: { email: "invalid-email" }

        expect(response).to have_http_status(:unprocessable_content)
        json = response.parsed_body
        expect(json["errors"]).to include("Email is invalid")
      end

      it "does not create a subscription" do
        expect do
          post "/api/v1/newsletter/subscribe", params: { email: "invalid-email" }
        end.not_to change(NewsletterSubscription, :count)
      end
    end

    context "with duplicate email" do
      before do
        NewsletterSubscription.create!(email: "existing@example.com", subscribed_at: Time.current)
      end

      it "returns 422 with already subscribed message" do
        post "/api/v1/newsletter/subscribe", params: { email: "existing@example.com" }

        expect(response).to have_http_status(:unprocessable_content)
        json = response.parsed_body
        expect(json["errors"]).to include("This email is already subscribed to our newsletter")
      end

      it "handles case-insensitive duplicates" do
        post "/api/v1/newsletter/subscribe", params: { email: "EXISTING@example.com" }

        expect(response).to have_http_status(:unprocessable_content)
        json = response.parsed_body
        expect(json["errors"]).to include("This email is already subscribed to our newsletter")
      end

      it "does not create a duplicate subscription" do
        expect do
          post "/api/v1/newsletter/subscribe", params: { email: "existing@example.com" }
        end.not_to change(NewsletterSubscription, :count)
      end
    end

    context "with missing email" do
      it "returns 400 bad request" do
        post "/api/v1/newsletter/subscribe", params: {}

        expect(response).to have_http_status(:bad_request)
      end
    end

    context "with empty email" do
      it "returns 400 bad request" do
        post "/api/v1/newsletter/subscribe", params: { email: "" }

        expect(response).to have_http_status(:bad_request)
      end
    end
  end
end
