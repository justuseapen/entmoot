# frozen_string_literal: true

module Api
  module V1
    class HabitsController < BaseController
      before_action :set_family

      def index
        authorize @family, policy_class: HabitPolicy

        habits = current_user.habits.where(family: @family).active.ordered

        render json: { habits: habits.map { |habit| habit_response(habit) } }
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def habit_response(habit)
        {
          id: habit.id,
          name: habit.name,
          position: habit.position,
          is_active: habit.is_active
        }
      end
    end
  end
end
