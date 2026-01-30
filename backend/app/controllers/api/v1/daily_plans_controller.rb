# frozen_string_literal: true

module Api
  module V1
    class DailyPlansController < BaseController
      before_action :set_family
      before_action :set_daily_plan, only: %i[show update]

      def index
        authorize @family, policy_class: DailyPlanPolicy

        @daily_plans = policy_scope(DailyPlan)
                       .where(family: @family, user: current_user)
                       .order(date: :desc)

        render json: { daily_plans: @daily_plans.map { |plan| plan_summary(plan) } }
      end

      def today
        authorize @family, policy_class: DailyPlanPolicy

        @daily_plan = DailyPlan.find_or_create_for_today(user: current_user, family: @family)

        render json: daily_plan_response(@daily_plan)
      end

      def show
        authorize @daily_plan

        render json: daily_plan_response(@daily_plan)
      end

      def update
        authorize @daily_plan
        tasks_before = tasks_completion_state

        if @daily_plan.update(daily_plan_params)
          is_first_action = handle_plan_content_update?
          award_task_completion_points(tasks_before)
          render_updated_plan(is_first_action)
        else
          render_errors(@daily_plan.errors.full_messages)
        end
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def set_daily_plan
        @daily_plan = @family.daily_plans.includes(:daily_tasks, :top_priorities).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Daily plan not found" }, status: :not_found
      end

      def daily_plan_params
        params.require(:daily_plan).permit(
          :intention,
          :shutdown_shipped,
          :shutdown_blocked,
          daily_tasks_attributes: %i[id title completed position _destroy],
          top_priorities_attributes: %i[id title priority_order completed _destroy],
          habit_completions_attributes: %i[id habit_id completed]
        )
      end

      def daily_plan_response(plan)
        plan_attributes(plan).merge(plan_associations(plan))
      end

      def plan_summary(plan)
        {
          id: plan.id, date: plan.date, intention: plan.intention,
          user_id: plan.user_id, family_id: plan.family_id,
          completion_stats: plan.completion_stats,
          created_at: plan.created_at, updated_at: plan.updated_at
        }
      end

      def plan_attributes(plan)
        {
          id: plan.id, date: plan.date, intention: plan.intention,
          shutdown_shipped: plan.shutdown_shipped, shutdown_blocked: plan.shutdown_blocked,
          user_id: plan.user_id, family_id: plan.family_id,
          completion_stats: plan.completion_stats,
          created_at: plan.created_at, updated_at: plan.updated_at
        }
      end

      def plan_associations(plan)
        {
          daily_tasks: plan.daily_tasks.map { |task| task_response(task) },
          top_priorities: plan.top_priorities.map { |priority| priority_response(priority) },
          yesterday_incomplete_tasks: plan.yesterday_incomplete_tasks.map { |task| task_response(task) },
          habit_completions: plan.habit_completions.includes(:habit).map { |hc| habit_completion_response(hc) }
        }
      end

      def task_response(task)
        {
          id: task.id,
          title: task.title,
          completed: task.completed,
          position: task.position
        }
      end

      def priority_response(priority)
        {
          id: priority.id,
          title: priority.title,
          priority_order: priority.priority_order,
          completed: priority.completed
        }
      end

      def habit_completion_response(habit_completion)
        {
          id: habit_completion.id,
          habit_id: habit_completion.habit_id,
          daily_plan_id: habit_completion.daily_plan_id,
          completed: habit_completion.completed,
          habit: {
            id: habit_completion.habit.id,
            name: habit_completion.habit.name,
            position: habit_completion.habit.position,
            is_active: habit_completion.habit.is_active
          }
        }
      end

      def plan_has_content?
        @daily_plan.daily_tasks.any? || @daily_plan.top_priorities.any? || @daily_plan.intention.present?
      end

      def tasks_completion_state
        @daily_plan.daily_tasks.reload.to_h { |t| [t.id, t.completed] }
      end

      def award_task_completion_points(tasks_before)
        # Points system removed - no-op
      end

      def handle_plan_content_update?
        return false unless plan_has_content?

        track_daily_plan_activity
        current_user.record_first_action?(:daily_plan_completed)
      end

      def render_updated_plan(is_first_action)
        render json: {
          message: "Daily plan updated successfully.",
          daily_plan: daily_plan_response(@daily_plan),
          is_first_action: is_first_action
        }
      end
    end
  end
end
