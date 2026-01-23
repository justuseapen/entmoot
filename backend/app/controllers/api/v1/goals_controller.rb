# frozen_string_literal: true

module Api
  module V1
    class GoalsController < BaseController
      before_action :set_family
      before_action :set_goal, only: %i[show update destroy refine regenerate_sub_goals]

      def index
        authorize @family, policy_class: GoalPolicy

        @goals = filtered_goals

        render json: { goals: @goals.map { |goal| goal_response(goal) } }
      end

      def show
        authorize @goal

        render json: { goal: goal_response(@goal, include_smart: true) }
      end

      def create
        @goal = @family.goals.build(goal_params)
        @goal.creator = current_user
        authorize @goal

        if @goal.save
          handle_goal_creation
        else
          render_validation_errors(@goal)
        end
      end

      def update
        authorize @goal

        was_completed_before = @goal.completed?

        if @goal.update(goal_params)
          update_assignments if params.dig(:goal, :assignee_ids).present?
          # Award points if goal just became completed
          award_goal_completion_points if !was_completed_before && @goal.completed?
          render_updated_goal
        else
          render_validation_errors(@goal)
        end
      end

      def destroy
        authorize @goal

        @goal.destroy
        render json: { message: "Goal deleted successfully." }
      end

      def refine
        authorize @goal

        service = GoalRefinementService.new(@goal)
        suggestions = service.refine

        render json: { suggestions: suggestions }
      rescue GoalRefinementService::RefinementError
        render_error("Our AI assistant is temporarily unavailable. Please try again in a few minutes.",
                     status: :service_unavailable)
      end

      def regenerate_sub_goals
        authorize @goal

        # Delete existing draft sub-goals
        @goal.children.where(is_draft: true).destroy_all

        # Trigger async sub-goal generation
        SubGoalGenerationJob.perform_later(goal_id: @goal.id, user_id: current_user.id)

        render json: {
          message: "Sub-goal generation started. You'll be notified when complete.",
          goal: goal_response(@goal, include_smart: true)
        }
      end

      def update_positions
        authorize @family, :update_positions?, policy_class: GoalPolicy

        ActiveRecord::Base.transaction do
          # First, assign temporary negative positions to avoid uniqueness conflicts
          positions_params.each_with_index do |position_data, index|
            goal = current_user.created_goals.where(family: @family).find(position_data[:id])
            goal.update_column(:position, -(index + 1))
          end

          # Then, assign the final positions
          positions_params.each do |position_data|
            goal = current_user.created_goals.where(family: @family).find(position_data[:id])
            goal.update_column(:position, position_data[:position])
          end
        end

        goals = filtered_goals
        render json: {
          message: "Positions updated successfully.",
          goals: goals.map { |goal| goal_response(goal) }
        }
      rescue ActiveRecord::RecordNotFound
        render_error("Goal not found", status: :not_found)
      rescue ActiveRecord::RecordInvalid => e
        render_error(e.record.errors.full_messages.join(", "), status: :unprocessable_content)
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render_error("This family doesn't exist or you don't have access to it.", status: :not_found)
      end

      def set_goal
        @goal = @family.goals.includes(:creator, :assignees, :parent).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_error("This goal doesn't exist or has been deleted.", status: :not_found)
      end

      def goal_params
        params.require(:goal).permit(
          :title, :description,
          :specific, :measurable, :achievable, :relevant, :time_bound,
          :time_scale, :status, :visibility,
          :progress, :due_date, :parent_id, :is_draft, :position
        )
      end

      def positions_params
        params.require(:positions).map do |p|
          p.permit(:id, :position)
        end
      end

      def filtered_goals
        policy_scope(Goal)
          .where(family: @family)
          .by_time_scale(params[:time_scale])
          .by_status(params[:status])
          .by_visibility(params[:visibility])
          .by_assignee(params[:assignee_id])
          .mentioned_by(params[:mentioned_by])
          .ordered
          .includes(:creator, :assignees)
      end

      def assign_users
        ids = Array(params[:goal][:assignee_ids]).map(&:to_i)
        ids.each { |user_id| @goal.goal_assignments.find_or_create_by(user_id: user_id) }
      end

      def update_assignments
        ids = Array(params[:goal][:assignee_ids]).map(&:to_i)
        @goal.goal_assignments.where.not(user_id: ids).destroy_all
        ids.each { |user_id| @goal.goal_assignments.find_or_create_by(user_id: user_id) }
      end

      def first_goal?
        current_user.created_goals.one?
      end

      def render_updated_goal
        @goal.reload
        render json: { message: "Goal updated successfully.", goal: goal_response(@goal, include_smart: true) }
      end

      def goal_response(goal, include_smart: false)
        base_goal_response(goal).merge(include_smart ? smart_fields(goal) : {})
      end

      def base_goal_response(goal)
        goal_attributes(goal).merge(goal_relations(goal))
      end

      def goal_attributes(goal)
        {
          id: goal.id, title: goal.title, description: goal.description,
          time_scale: goal.time_scale, status: goal.status, visibility: goal.visibility,
          progress: goal.progress, due_date: goal.due_date, parent_id: goal.parent_id,
          family_id: goal.family_id, created_at: goal.created_at, updated_at: goal.updated_at,
          is_draft: goal.is_draft, children_count: goal.children_count,
          draft_children_count: goal.draft_children_count, aggregated_progress: goal.aggregated_progress,
          position: goal.position
        }
      end

      def goal_relations(goal)
        { creator: user_response(goal.creator), assignees: goal.assignees.map { |u| user_response(u) } }
      end

      def smart_fields(goal)
        {
          specific: goal.specific, measurable: goal.measurable, achievable: goal.achievable,
          relevant: goal.relevant, time_bound: goal.time_bound
        }
      end

      def user_response(user)
        { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url }
      end

      def award_goal_completion_points
        PointsService.award_goal_completion(user: current_user, goal: @goal)
      end

      def handle_goal_creation
        assign_users if params.dig(:goal, :assignee_ids).present?
        PointsService.award_goal_creation(user: current_user, goal: @goal)
        track_first_goal
        track_first_action_goal
        trigger_sub_goal_generation if should_generate_sub_goals?
        render_created_goal
      end

      def should_generate_sub_goals?
        return false unless %w[annual quarterly].include?(@goal.time_scale)
        return false unless @goal.due_date.present?

        # Only skip generation if explicitly set to false
        generate_param = params.dig(:goal, :generate_sub_goals)
        return true if generate_param.nil? # Default to true

        ActiveModel::Type::Boolean.new.cast(generate_param)
      end

      def trigger_sub_goal_generation
        SubGoalGenerationJob.perform_later(goal_id: @goal.id, user_id: current_user.id)
      end

      def track_first_goal
        return if current_user.first_goal_created_at.present?

        current_user.update!(first_goal_created_at: Time.current)
      end

      def track_first_action_goal
        @is_first_action_goal = current_user.record_first_action?(:goal_created)
      end

      def render_created_goal
        @goal.reload
        response = {
          message: "Goal created successfully.",
          goal: goal_response(@goal, include_smart: true),
          is_first_goal: first_goal?,
          is_first_action: @is_first_action_goal || false
        }
        render json: response, status: :created
      end
    end
  end
end
