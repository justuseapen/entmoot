# frozen_string_literal: true

module Api
  module V1
    class LeaderboardsController < BaseController
      before_action :set_family

      def show
        authorize @family, :show?

        scope = params[:scope]&.to_sym || :all_time
        scope = :all_time unless %i[all_time weekly].include?(scope)

        entries = LeaderboardService.get_leaderboard(@family, scope: scope)

        render json: {
          leaderboard: {
            scope: scope,
            entries: entries,
            top_performer: build_top_performer(entries),
            encouragement_messages: build_encouragement_messages(entries)
          }
        }
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Family not found" }, status: :not_found
      end

      def build_top_performer(entries)
        return nil if entries.empty?

        top = entries.first
        {
          user_id: top[:user_id],
          name: top[:name],
          avatar_url: top[:avatar_url],
          points: top[:points]
        }
      end

      def build_encouragement_messages(entries)
        entries.map do |entry|
          {
            user_id: entry[:user_id],
            message: encouragement_for_rank(entry[:rank], entries.size)
          }
        end
      end

      def encouragement_for_rank(rank, total)
        case rank
        when 1
          "Leading the family! Keep up the great work!"
        when 2
          "So close to the top! You're doing amazing!"
        when 3
          "Great progress! Keep building those habits!"
        else
          if total > 3
            "Every step counts! You're making progress!"
          else
            "Keep going! Consistency is key!"
          end
        end
      end
    end
  end
end
