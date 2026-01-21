# frozen_string_literal: true

module Api
  module V1
    class MentionsController < BaseController
      before_action :set_family
      before_action :authorize_family

      STATIC_TITLES = {
        "Goal" => ->(m) { m.title },
        "TopPriority" => ->(m) { m.title }
      }.freeze

      def recent
        mentions = recent_mentions_for_user
        render json: {
          mentions: mentions.map { |m| mention_json(m) },
          count: mentions.size
        }
      end

      private

      def set_family
        @family = Family.find(params[:family_id])
      end

      def authorize_family
        authorize @family, :show?
      end

      def recent_mentions_for_user
        Mention.where(mentioned_user_id: current_user.id)
               .where(created_at: 7.days.ago..)
               .includes(:user, :mentionable)
               .order(created_at: :desc)
               .limit(20)
      end

      def mention_json(mention)
        {
          id: mention.id,
          mentioner: { id: mention.user.id, name: mention.user.name },
          mentionable_type: mention.mentionable_type,
          mentionable_id: mention.mentionable_id,
          mentionable_title: mentionable_title(mention),
          mentionable_link: mentionable_link(mention),
          text_field: mention.text_field,
          created_at: mention.created_at
        }
      end

      def mentionable_title(mention)
        return nil unless mention.mentionable

        if STATIC_TITLES.key?(mention.mentionable_type)
          STATIC_TITLES[mention.mentionable_type].call(mention.mentionable)
        else
          dynamic_mentionable_title(mention)
        end
      end

      def dynamic_mentionable_title(mention)
        mentionable = mention.mentionable
        case mention.mentionable_type
        when "DailyPlan"
          "Daily Plan - #{mentionable.date.strftime("%B %d, %Y")}"
        when "WeeklyReview"
          "Weekly Review - Week of #{mentionable.week_start_date.strftime("%B %d, %Y")}"
        when "MonthlyReview"
          "Monthly Review - #{mentionable.month.strftime("%B %Y")}"
        when "QuarterlyReview"
          quarterly_title(mentionable)
        when "AnnualReview"
          "Annual Review - #{mentionable.year}"
        end
      end

      def quarterly_title(review)
        quarter_num = ((review.quarter_start_date.month - 1) / 3) + 1
        "Quarterly Review - Q#{quarter_num} #{review.quarter_start_date.year}"
      end

      def mentionable_link(mention)
        return nil unless mention.mentionable

        family_path = "/families/#{@family.id}"
        build_mentionable_link(mention, family_path)
      end

      def build_mentionable_link(mention, family_path)
        mentionable = mention.mentionable
        case mention.mentionable_type
        when "Goal"
          "#{family_path}/goals?goal_id=#{mentionable.id}"
        when "DailyPlan"
          "#{family_path}/planner?date=#{mentionable.date}"
        when "TopPriority"
          build_top_priority_link(mentionable, family_path)
        else
          build_review_link(mention, family_path)
        end
      end

      def build_top_priority_link(mentionable, family_path)
        return nil unless mentionable.daily_plan

        "#{family_path}/planner?date=#{mentionable.daily_plan.date}"
      end

      def build_review_link(mention, family_path)
        mentionable = mention.mentionable
        case mention.mentionable_type
        when "WeeklyReview"
          "#{family_path}/weekly-review?week=#{mentionable.week_start_date}"
        when "MonthlyReview"
          "#{family_path}/monthly-review?month=#{mentionable.month.strftime("%Y-%m")}"
        when "QuarterlyReview"
          "#{family_path}/quarterly-review?quarter=#{mentionable.quarter_start_date}"
        when "AnnualReview"
          "#{family_path}/annual-review?year=#{mentionable.year}"
        end
      end
    end
  end
end
