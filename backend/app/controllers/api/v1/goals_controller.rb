# frozen_string_literal: true

module Api
  module V1
    class GoalsController < BaseController
      before_action :set_family
      before_action :set_goal, only: %i[show update destroy refine]

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
          render_errors(@goal.errors.full_messages)
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
          render_errors(@goal.errors.full_messages)
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
      rescue GoalRefinementService::RefinementError => e
        render json: { error: "AI refinement failed: #{e.message}" }, status: :service_unavailable
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def set_goal
        @goal = @family.goals.includes(:creator, :assignees, :parent).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Goal not found" }, status: :not_found
      end

      def goal_params
        params.require(:goal).permit(
          :title, :description,
          :specific, :measurable, :achievable, :relevant, :time_bound,
          :time_scale, :status, :visibility,
          :progress, :due_date, :parent_id
        )
      end

      def filtered_goals
        policy_scope(Goal)
          .where(family: @family)
          .by_time_scale(params[:time_scale])
          .by_status(params[:status])
          .by_visibility(params[:visibility])
          .by_assignee(params[:assignee_id])
          .order(created_at: :desc)
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

      def render_created_goal
        @goal.reload
        response = {
          message: "Goal created successfully.",
          goal: goal_response(@goal, include_smart: true),
          is_first_goal: first_goal?
        }
        render json: response, status: :created
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
          family_id: goal.family_id, created_at: goal.created_at, updated_at: goal.updated_at
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
        render_created_goal
      end

      def track_first_goal
        return if current_user.first_goal_created_at.present?

        current_user.update!(first_goal_created_at: Time.current)
      end
    end
  end
end
