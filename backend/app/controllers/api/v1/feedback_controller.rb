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
          render json: feedback_response(@feedback_report), status: :created
        else
          render json: { errors: @feedback_report.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

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
