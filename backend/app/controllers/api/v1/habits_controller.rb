# frozen_string_literal: true

module Api
  module V1
    class HabitsController < BaseController
      before_action :set_family
      before_action :set_habit, only: %i[update destroy]

      def index
        authorize @family, policy_class: HabitPolicy

        habits = current_user.habits.where(family: @family).active.ordered

        render json: { habits: habits.map { |habit| habit_response(habit) } }
      end

      def create
        @habit = current_user.habits.build(habit_params.merge(family: @family))
        @habit.position = next_position
        authorize @habit

        if @habit.save
          render json: {
            message: "Habit created successfully.",
            habit: habit_response(@habit)
          }, status: :created
        else
          render_errors(@habit.errors.full_messages)
        end
      end

      def update
        authorize @habit

        if @habit.update(habit_params)
          render json: {
            message: "Habit updated successfully.",
            habit: habit_response(@habit)
          }
        else
          render_errors(@habit.errors.full_messages)
        end
      end

      def destroy
        authorize @habit

        @habit.destroy
        render json: { message: "Habit deleted successfully." }
      end

      def update_positions
        authorize @family, :update_positions?, policy_class: HabitPolicy

        ActiveRecord::Base.transaction do
          # First, assign temporary negative positions to avoid uniqueness conflicts
          positions_params.each_with_index do |position_data, index|
            habit = current_user.habits.where(family: @family).find(position_data[:id])
            habit.update_column(:position, -(index + 1))
          end

          # Then, assign the final positions
          positions_params.each do |position_data|
            habit = current_user.habits.where(family: @family).find(position_data[:id])
            habit.update_column(:position, position_data[:position])
          end
        end

        habits = current_user.habits.where(family: @family).active.ordered
        render json: {
          message: "Positions updated successfully.",
          habits: habits.map { |habit| habit_response(habit) }
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Habit not found" }, status: :not_found
      rescue ActiveRecord::RecordInvalid => e
        render_errors(e.record.errors.full_messages)
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def set_habit
        @habit = current_user.habits.where(family: @family).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Habit not found" }, status: :not_found
      end

      def habit_params
        params.require(:habit).permit(:name, :is_active)
      end

      def positions_params
        params.require(:positions).map do |p|
          p.permit(:id, :position)
        end
      end

      def next_position
        max_position = current_user.habits.where(family: @family).maximum(:position) || 0
        max_position + 1
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
