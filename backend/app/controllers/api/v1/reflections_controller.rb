# frozen_string_literal: true

module Api
  module V1
    class ReflectionsController < BaseController
      before_action :set_family
      before_action :set_reflection, only: %i[show update destroy]

      def index
        authorize @family, policy_class: ReflectionPolicy

        @reflections = policy_scope(Reflection)
                       .joins(:daily_plan)
                       .where(daily_plans: { family_id: @family.id })
                       .includes(:reflection_responses, daily_plan: :user)
                       .order("daily_plans.date DESC")

        @reflections = filter_reflections(@reflections)

        render json: { reflections: @reflections.map { |r| reflection_response(r) } }
      end

      def show
        authorize @reflection

        render json: reflection_response(@reflection)
      end

      def create
        authorize @family, policy_class: ReflectionPolicy

        @daily_plan = find_or_create_daily_plan
        @reflection = @daily_plan.reflections.build(reflection_params)

        if @reflection.save
          is_first_action = handle_completed_reflection if reflection_completed?
          render_created_reflection(is_first_action || false)
        else
          render_errors(@reflection.errors.full_messages)
        end
      end

      def update
        authorize @reflection
        was_completed_before = @reflection.completed?

        if @reflection.update(reflection_params)
          is_first_action = handle_completed_reflection unless was_completed_before
          render_updated_reflection(is_first_action || false)
        else
          render_errors(@reflection.errors.full_messages)
        end
      end

      def destroy
        authorize @reflection

        @reflection.destroy
        render json: { message: "Reflection deleted successfully." }
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def set_reflection
        @reflection = @family.daily_plans
                             .joins(:reflections)
                             .find_by!(reflections: { id: params[:id] })
                             .reflections
                             .includes(:reflection_responses)
                             .find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Reflection not found" }, status: :not_found
      end

      def find_or_create_daily_plan
        if params[:daily_plan_id].present?
          @family.daily_plans.find(params[:daily_plan_id])
        else
          DailyPlan.find_or_create_for_today(user: current_user, family: @family)
        end
      end

      def reflection_params
        params.require(:reflection).permit(
          :reflection_type,
          :mood,
          :energy_level,
          gratitude_items: [],
          reflection_responses_attributes: %i[id prompt response _destroy]
        )
      end

      def filter_reflections(reflections)
        reflections = reflections.where(reflection_type: params[:type]) if params[:type].present?
        reflections = reflections.where(daily_plans: { user_id: params[:user_id] }) if params[:user_id].present?
        date_range_filter(reflections)
      end

      def date_range_filter(reflections)
        reflections = reflections.where(daily_plans: { date: (params[:from]).. }) if params[:from].present?
        reflections = reflections.where(daily_plans: { date: ..(params[:to]) }) if params[:to].present?
        reflections
      end

      def reflection_response(reflection)
        reflection_attributes(reflection).merge(reflection_associations(reflection))
      end

      def reflection_attributes(reflection)
        {
          id: reflection.id, daily_plan_id: reflection.daily_plan_id,
          reflection_type: reflection.reflection_type, mood: reflection.mood,
          energy_level: reflection.energy_level, gratitude_items: reflection.gratitude_items,
          completed: reflection.completed?, date: reflection.daily_plan.date,
          created_at: reflection.created_at, updated_at: reflection.updated_at
        }
      end

      def reflection_associations(reflection)
        {
          user: user_summary(reflection.daily_plan.user),
          reflection_responses: reflection.reflection_responses.map { |rr| response_summary(rr) }
        }
      end

      def user_summary(user)
        { id: user.id, name: user.name, email: user.email }
      end

      def response_summary(response)
        { id: response.id, prompt: response.prompt, response: response.response }
      end

      def record_evening_reflection_streak
        StreakService.record_evening_reflection(user: current_user, date: @reflection.daily_plan.date)
      end

      def reflection_completed?
        @reflection.evening? && @reflection.completed?
      end

      def handle_completed_reflection
        return unless reflection_completed?

        record_evening_reflection_streak
        PointsService.award_reflection_completion(user: current_user, reflection: @reflection)
        current_user.record_first_action?(:reflection_completed)
      end

      def render_created_reflection(is_first_action)
        render json: {
          message: "Reflection created successfully.",
          reflection: reflection_response(@reflection),
          is_first_action: is_first_action
        }, status: :created
      end

      def render_updated_reflection(is_first_action)
        render json: {
          message: "Reflection updated successfully.",
          reflection: reflection_response(@reflection),
          is_first_action: is_first_action
        }
      end
    end
  end
end
