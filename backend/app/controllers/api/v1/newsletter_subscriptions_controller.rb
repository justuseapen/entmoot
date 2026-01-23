# frozen_string_literal: true

module Api
  module V1
    class NewsletterSubscriptionsController < BaseController
      skip_before_action :authenticate_user!

      def create
        existing = NewsletterSubscription.find_by("LOWER(email) = LOWER(?)", email_param)

        if existing
          render json: { errors: ["This email is already subscribed to our newsletter"] },
                 status: :unprocessable_content
          return
        end

        @subscription = NewsletterSubscription.new(
          email: email_param,
          subscribed_at: Time.current
        )

        if @subscription.save
          render json: { message: "Successfully subscribed", email: @subscription.email }, status: :created
        else
          render json: { errors: @subscription.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def email_param
        params.require(:email)
      end
    end
  end
end
