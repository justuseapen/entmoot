# frozen_string_literal: true

module Api
  module V1
    class GoalImportsController < BaseController
      before_action :set_family

      MAX_SYNC_SIZE = 100.kilobytes

      def create
        authorize @family, policy_class: GoalPolicy

        csv_content = extract_csv_content
        return render json: { error: "No CSV file provided" }, status: :bad_request if csv_content.blank?

        if csv_content.bytesize > MAX_SYNC_SIZE
          process_async(csv_content)
        else
          process_sync(csv_content)
        end
      rescue GoalImportService::ImportError => e
        render json: { error: e.message }, status: :unprocessable_content
      end

      def status
        authorize @family, :index?, policy_class: GoalPolicy

        job_id = params[:job_id]
        return render json: { error: "No job_id provided" }, status: :bad_request if job_id.blank?

        result = Rails.cache.read("goal_import:#{job_id}")

        if result.nil?
          render json: { status: "processing" }
        elsif result[:error]
          render json: { status: "failed", error: result[:error] }
        else
          render json: { status: "completed", results: result }
        end
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def extract_csv_content
        if params[:file].respond_to?(:read)
          params[:file].read
        elsif params[:csv_content].present?
          params[:csv_content]
        end
      end

      def process_sync(csv_content)
        service = GoalImportService.new(family: @family, user: current_user)
        results = service.import(
          csv_content: csv_content,
          generate_sub_goals: ActiveModel::Type::Boolean.new.cast(params[:generate_sub_goals])
        )

        render json: {
          status: "completed",
          results: format_results(results)
        }, status: :created
      end

      def process_async(csv_content)
        job_id = SecureRandom.uuid
        GoalImportJob.perform_later(
          job_id: job_id,
          family_id: @family.id,
          user_id: current_user.id,
          csv_content: csv_content,
          generate_sub_goals: ActiveModel::Type::Boolean.new.cast(params[:generate_sub_goals])
        )

        render json: {
          status: "processing",
          job_id: job_id,
          message: "Import queued for processing. Poll /status?job_id=#{job_id} for results."
        }, status: :accepted
      end

      def format_results(results)
        {
          created_count: results[:created_count],
          failed_count: results[:failed_count],
          categories: results[:categories],
          goals: results[:goals],
          failures: results[:failures],
          sub_goal_suggestions: results[:sub_goal_suggestions]
        }
      end
    end
  end
end
