# frozen_string_literal: true

class LeaderboardService
  class << self
    # Get leaderboard for a family with optional time scope
    def get_leaderboard(family, scope: :all_time)
      members = family.family_memberships.includes(:user).map(&:user)
      entries = members.map { |user| build_leaderboard_entry(user, scope) }
      rank_entries(entries)
    end

    private

    def build_leaderboard_entry(user, scope)
      points = calculate_points(user, scope)
      {
        user_id: user.id,
        name: user.name,
        avatar_url: user.avatar_url,
        points: points,
        streaks: build_streaks_summary(user),
        badges_count: user.badges.count
      }
    end

    def calculate_points(user, scope)
      case scope.to_sym
      when :weekly
        PointsService.weekly_points(user)
      else
        PointsService.total_points(user)
      end
    end

    def build_streaks_summary(user)
      streaks = user.streaks.index_by(&:streak_type)
      {
        daily_planning: streak_count(streaks["daily_planning"]),
        evening_reflection: streak_count(streaks["evening_reflection"]),
        weekly_review: streak_count(streaks["weekly_review"]),
        total: total_streak_count(streaks)
      }
    end

    def streak_count(streak)
      streak&.current_count || 0
    end

    def total_streak_count(streaks)
      streaks.values.sum { |s| s&.current_count || 0 }
    end

    def rank_entries(entries)
      # Sort by points descending, then by name alphabetically for ties
      sorted = entries.sort_by { |e| [-e[:points], e[:name]] }

      # Add rank with proper handling of ties
      add_ranks(sorted)
    end

    def add_ranks(sorted_entries)
      previous_points = nil
      previous_rank = 0

      sorted_entries.each_with_index.map do |entry, index|
        if entry[:points] == previous_points
          rank = previous_rank
        else
          rank = index + 1
          previous_rank = rank
        end
        previous_points = entry[:points]

        entry.merge(rank: rank)
      end
    end
  end
end
