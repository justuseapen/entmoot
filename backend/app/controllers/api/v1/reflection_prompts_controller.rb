# frozen_string_literal: true

module Api
  module V1
    class ReflectionPromptsController < BaseController
      skip_before_action :authenticate_user!, only: [:index]

      def index
        prompts = YAML.load_file(Rails.root.join("config/reflection_prompts.yml"))

        if params[:type].present?
          render json: { prompts: prompts[params[:type]] || [] }
        else
          render json: { prompts: prompts }
        end
      end
    end
  end
end
