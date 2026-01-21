# frozen_string_literal: true

module Api
  module V1
    class OnboardingController < ApplicationController
      before_action :authenticate_user!

      VALID_STEPS = %w[welcome family_basics big_goal calendar invite complete].freeze
      REQUIRED_STEPS = %w[welcome family_basics].freeze

      # GET /api/v1/onboarding/status
      def status
        render json: {
          completed: current_user.onboarding_wizard_completed_at.present?,
          completed_at: current_user.onboarding_wizard_completed_at,
          current_step: current_user.onboarding_wizard_last_step || 1,
          skipped_steps: current_user.onboarding_skipped_steps || [],
          challenge: current_user.onboarding_challenge,
          calendar_waitlist: current_user.calendar_waitlist || {},
          has_family: current_user.families.any?,
          has_goal: current_user.created_goals.any?
        }
      end

      # POST /api/v1/onboarding/step/:step_name
      def update_step
        step_name = params[:step_name]

        unless VALID_STEPS.include?(step_name)
          return render json: { error: "Invalid step: #{step_name}" }, status: :bad_request
        end

        step_index = VALID_STEPS.index(step_name) + 1

        case step_name
        when "welcome"
          update_welcome_step
        when "family_basics"
          update_family_basics_step
        when "big_goal"
          update_big_goal_step
        when "calendar"
          update_calendar_step
        when "invite"
          update_invite_step
        when "complete"
          complete_onboarding
        end
      end

      # POST /api/v1/onboarding/skip/:step_name
      def skip_step
        step_name = params[:step_name]

        unless VALID_STEPS.include?(step_name)
          return render json: { error: "Invalid step: #{step_name}" }, status: :bad_request
        end

        if REQUIRED_STEPS.include?(step_name)
          return render json: { error: "Cannot skip required step: #{step_name}" }, status: :unprocessable_content
        end

        skipped_steps = current_user.onboarding_skipped_steps || []
        skipped_steps << step_name unless skipped_steps.include?(step_name)

        step_index = VALID_STEPS.index(step_name) + 1
        current_user.update!(
          onboarding_skipped_steps: skipped_steps,
          onboarding_wizard_last_step: step_index + 1
        )

        render json: {
          message: "Step skipped",
          skipped_steps: skipped_steps,
          next_step: step_index + 1
        }
      end

      # POST /api/v1/calendar_waitlist
      def calendar_waitlist
        provider = params[:provider]

        unless %w[apple microsoft].include?(provider)
          return render json: { error: "Invalid provider" }, status: :bad_request
        end

        waitlist = current_user.calendar_waitlist || {}
        waitlist[provider] = Time.current.iso8601

        current_user.update!(calendar_waitlist: waitlist)

        render json: {
          message: "Added to #{provider.titleize} Calendar waitlist",
          calendar_waitlist: waitlist
        }
      end

      private

      def update_welcome_step
        challenge = params[:challenge]

        current_user.update!(
          onboarding_challenge: challenge,
          onboarding_wizard_last_step: 2
        )

        render json: {
          message: "Welcome step completed",
          next_step: 2
        }
      end

      def update_family_basics_step
        # Family creation is handled by the families controller
        # This just marks the step as complete
        current_user.update!(onboarding_wizard_last_step: 3)

        render json: {
          message: "Family basics step completed",
          next_step: 3
        }
      end

      def update_big_goal_step
        # Goal creation is handled by the goals controller
        # This just marks the step as complete
        current_user.update!(onboarding_wizard_last_step: 4)

        render json: {
          message: "Big goal step completed",
          next_step: 4
        }
      end

      def update_calendar_step
        # Calendar connection is handled by the google_calendar controller
        # This just marks the step as complete
        current_user.update!(onboarding_wizard_last_step: 5)

        render json: {
          message: "Calendar step completed",
          next_step: 5
        }
      end

      def update_invite_step
        # Invitations are handled by the invitations controller
        # This just marks the step as complete
        current_user.update!(onboarding_wizard_last_step: 6)

        render json: {
          message: "Invite step completed",
          next_step: 6
        }
      end

      def complete_onboarding
        current_user.update!(
          onboarding_wizard_completed_at: Time.current,
          onboarding_wizard_last_step: 6
        )

        render json: {
          message: "Onboarding completed!",
          completed_at: current_user.onboarding_wizard_completed_at
        }
      end
    end
  end
end
