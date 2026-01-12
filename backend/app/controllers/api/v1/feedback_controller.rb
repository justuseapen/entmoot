# frozen_string_literal: true

module Api
  module V1
    class FeedbackController < BaseController
      skip_before_action :authenticate_user!, only: [:create]

      def show
        @feedback_report = current_user.feedback_reports.find(params[:id])
        render json: feedback_response(@feedback_report)
      end

      def create
        @feedback_report = build_feedback_report
        attach_screenshot if params[:screenshot].present?

        if @feedback_report.save
          handle_proactive_feedback_recording
          render json: feedback_response(@feedback_report), status: :created
        else
          render json: { errors: @feedback_report.errors.full_messages }, status: :unprocessable_content
        end
      end

      # GET /api/v1/feedback/eligibility
      # Returns user's eligibility for proactive feedback prompts
      def eligibility
        render json: {
          nps_eligible: ProactiveFeedbackService.should_show_nps?(current_user),
          nps_follow_up_question: nil, # Will be set based on score
          days_until_nps_eligible: days_until_nps_eligible,
          last_nps_date: current_user.last_nps_prompt_date
        }
      end

      # POST /api/v1/feedback/dismiss_nps
      # Records that NPS prompt was dismissed (counts as prompted for quarterly limit)
      def dismiss_nps
        ProactiveFeedbackService.record_nps_prompted(current_user)
        render json: { success: true, next_eligible_date: next_nps_eligible_date }
      end

      # GET /api/v1/feedback/nps_follow_up
      # Returns the appropriate follow-up question based on NPS score
      def nps_follow_up
        score = params[:score].to_i
        render json: {
          question: ProactiveFeedbackService.nps_follow_up_question(score),
          category: ProactiveFeedbackService.nps_category(score)
        }
      end

      private

      def handle_proactive_feedback_recording
        return unless user_signed_in?

        case @feedback_report.report_type
        when "nps"
          ProactiveFeedbackService.record_nps_prompted(current_user)
        when "quick_feedback"
          feature = @feedback_report.context_data&.dig("feature")
          ProactiveFeedbackService.record_feature_feedback_shown(current_user, feature) if feature.present?
        end
      end

      def days_until_nps_eligible
        ProactiveFeedbackService.send(:days_until_nps_eligible, current_user)
      end

      def next_nps_eligible_date
        Time.current + ProactiveFeedbackService::NPS_QUARTERLY_DAYS.days
      end

      def build_feedback_report
        FeedbackReport.new(feedback_params.merge(user: current_user_if_authenticated))
      end

      def current_user_if_authenticated
        return nil unless user_signed_in?

        current_user
      end

      def attach_screenshot
        @feedback_report.screenshot.attach(params[:screenshot])
      end

      def feedback_params
        params.permit(
          :report_type,
          :title,
          :description,
          :severity,
          :allow_contact,
          :contact_email,
          context_data: {}
        ).tap do |permitted|
          # Ensure context_data is a hash even if not provided
          permitted[:context_data] ||= {}
        end
      end

      def feedback_response(report)
        { feedback_report: report_attributes(report) }
      end

      def report_attributes(report)
        {
          id: report.id, report_type: report.report_type, title: report.title,
          description: report.description, severity: report.severity, status: report.status,
          context_data: report.context_data, allow_contact: report.allow_contact,
          contact_email: report.contact_email, has_screenshot: report.screenshot.attached?,
          created_at: report.created_at, resolved_at: report.resolved_at
        }
      end
    end
  end
end
