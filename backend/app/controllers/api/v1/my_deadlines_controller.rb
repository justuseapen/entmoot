# frozen_string_literal: true

module Api
  module V1
    class MyDeadlinesController < BaseController
      before_action :set_family

      def index
        authorize @family, policy_class: GoalPolicy

        render json: {
          goals: assigned_goals.map { |g| goal_response(g) },
          tasks: assigned_tasks.map { |t| task_response(t) }
        }
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def assigned_goals
        Goal.joins(:goal_assignments)
            .where(goal_assignments: { user_id: current_user.id })
            .where(family: @family)
            .where.not(due_date: nil)
            .where(due_date: ..7.days.from_now)
            .where.not(status: %i[completed abandoned])
            .order(due_date: :asc)
            .includes(:creator, :assignees)
            .limit(10)
      end

      def assigned_tasks
        DailyTask.joins(:daily_plan)
                 .where(assignee_id: current_user.id)
                 .where(daily_plans: { family_id: @family.id, date: Date.current })
                 .where(completed: false)
                 .includes(daily_plan: :user)
                 .limit(10)
      end

      def goal_response(goal)
        {
          id: goal.id,
          title: goal.title,
          status: goal.status,
          progress: goal.progress,
          due_date: goal.due_date,
          time_scale: goal.time_scale
        }
      end

      def task_response(task)
        {
          id: task.id,
          title: task.title,
          completed: task.completed,
          daily_plan_date: task.daily_plan.date,
          owner_name: task.daily_plan.user.name
        }
      end
    end
  end
end
