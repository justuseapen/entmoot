# frozen_string_literal: true

module Api
  module V1
    module Admin
      class FeedbackController < BaseController
        before_action :authorize_admin!
        before_action :set_feedback_report, only: %i[show update]

        def index
          @feedback_reports = filtered_feedback_reports
                              .includes(:user, :assigned_to, :duplicate_of)
                              .recent
                              .limit(per_page)
                              .offset(offset)

          total_count = filtered_feedback_reports.count

          render json: {
            feedback_reports: @feedback_reports.map { |report| admin_report_attributes(report) },
            meta: pagination_meta(total_count)
          }
        end

        def show
          render json: { feedback_report: admin_report_attributes(@feedback_report, detailed: true) }
        end

        def update
          if @feedback_report.update(admin_feedback_params)
            render json: { feedback_report: admin_report_attributes(@feedback_report, detailed: true) }
          else
            render json: { errors: @feedback_report.errors.full_messages }, status: :unprocessable_content
          end
        end

        private

        def authorize_admin!
          return if current_user_is_admin?

          render json: { error: "Admin access required" }, status: :forbidden
        end

        def current_user_is_admin?
          current_user.family_memberships.exists?(role: "admin")
        end

        def set_feedback_report
          @feedback_report = FeedbackReport.find(params[:id])
        end

        def filtered_feedback_reports
          FeedbackReport
            .by_type(params[:type])
            .by_status(params[:status])
            .by_severity(params[:severity])
            .by_date_range(parse_date(params[:start_date]), parse_date(params[:end_date]))
        end

        def admin_feedback_params
          params.require(:feedback_report).permit(
            :status,
            :assigned_to_id,
            :internal_notes,
            :duplicate_of_id
          )
        end

        def admin_report_attributes(report, detailed: false)
          base_attributes(report).merge(admin_attributes(report)).tap do |attrs|
            attrs.merge!(detailed_attributes(report)) if detailed
          end
        end

        def base_attributes(report)
          {
            id: report.id,
            report_type: report.report_type,
            title: report.title,
            severity: report.severity,
            status: report.status,
            created_at: report.created_at
          }
        end

        def admin_attributes(report)
          {
            user: user_summary(report.user),
            assigned_to: user_summary(report.assigned_to),
            duplicate_of_id: report.duplicate_of_id,
            internal_notes: report.internal_notes
          }
        end

        def detailed_attributes(report)
          {
            description: report.description,
            context_data: report.context_data,
            allow_contact: report.allow_contact,
            contact_email: report.contact_email,
            has_screenshot: report.screenshot.attached?,
            screenshot_url: screenshot_url(report),
            resolved_at: report.resolved_at,
            duplicate_of: report.duplicate_of ? duplicate_summary(report.duplicate_of) : nil,
            duplicates_count: report.duplicates.count
          }
        end

        def user_summary(user)
          return nil unless user

          { id: user.id, name: user.name, email: user.email }
        end

        def duplicate_summary(report)
          { id: report.id, title: report.title, status: report.status }
        end

        def screenshot_url(report)
          return nil unless report.screenshot.attached?

          Rails.application.routes.url_helpers.rails_blob_url(
            report.screenshot,
            only_path: true
          )
        end

        def parse_date(date_string)
          return nil if date_string.blank?

          Date.parse(date_string)
        rescue ArgumentError
          nil
        end

        def per_page
          [(params[:per_page] || 20).to_i, 100].min
        end

        def offset
          page = [params[:page].to_i, 1].max
          (page - 1) * per_page
        end

        def pagination_meta(total_count)
          page = [params[:page].to_i, 1].max
          {
            current_page: page,
            total_pages: (total_count.to_f / per_page).ceil,
            total_count: total_count,
            per_page: per_page
          }
        end
      end
    end
  end
end
