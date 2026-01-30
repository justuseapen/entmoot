# frozen_string_literal: true

class ProactiveFeedbackService
  # NPS survey configuration
  NPS_ACTIVE_DAYS_REQUIRED = 30
  NPS_QUARTERLY_DAYS = 90

  # NPS score classification
  PROMOTER_RANGE = (9..10)
  PASSIVE_RANGE = (7..8)
  DETRACTOR_RANGE = (0..6)

  # Features that can receive feedback
  RATABLE_FEATURES = %w[
    goal_refinement
    daily_planning
    weekly_review
    family_leaderboard
    goal_hierarchy
  ].freeze

  class << self
    # Check if user should be prompted for NPS survey
    # Requirements:
    # - 30 days of "active use" (has some activity)
    # - Not prompted in the last 90 days (quarterly)
    def should_show_nps?(user)
      return false unless active_for_required_period?(user)
      return false if recently_prompted_for_nps?(user)

      true
    end

    # Check if user should see feature feedback for a specific feature
    # Triggers on first-time feature use
    def should_show_feature_feedback?(user, feature_name)
      return false if user.blank?

      used_features = user.first_actions || {}
      !used_features.key?("feature_feedback_#{feature_name}")
    end

    # Check if user should see session feedback after completing a flow
    # Occasional prompt - not every time
    def should_show_session_feedback?(user, flow_type)
      return false if user.blank?

      # Show session feedback approximately 1 in 5 times
      # Based on a deterministic hash to avoid showing on every completion
      completion_count = session_completion_count(user, flow_type)
      (completion_count % 5).zero? && completion_count.positive?
    end

    # Record that NPS was shown to user
    def record_nps_prompted(user)
      user.update(last_nps_prompt_date: Time.current)
    end

    # Record that feature feedback was shown for a specific feature
    def record_feature_feedback_shown(user, feature_name)
      user.update(
        first_actions: (user.first_actions || {}).merge("feature_feedback_#{feature_name}" => Time.current.iso8601)
      )
    end

    # Get NPS follow-up question based on score
    def nps_follow_up_question(score)
      case score
      when PROMOTER_RANGE
        "What do you love most about Entmoot?"
      when PASSIVE_RANGE
        "What could we improve to make Entmoot even better?"
      when DETRACTOR_RANGE
        "We're sorry to hear that. What's the biggest issue you're facing?"
      else
        "Tell us more about your experience"
      end
    end

    # Classify NPS score
    def nps_category(score)
      case score
      when PROMOTER_RANGE then :promoter
      when PASSIVE_RANGE then :passive
      when DETRACTOR_RANGE then :detractor
      else :unknown
      end
    end

    # Get user's feedback eligibility status
    def feedback_status(user)
      {
        nps_eligible: should_show_nps?(user),
        days_until_nps_eligible: days_until_nps_eligible(user),
        last_nps_date: user.last_nps_prompt_date,
        features_not_rated: features_awaiting_feedback(user)
      }
    end

    private

    def active_for_required_period?(user)
      return false if user.created_at.blank?

      # User account is at least 30 days old
      days_since_signup = (Time.current - user.created_at).to_i / 1.day

      return false if days_since_signup < NPS_ACTIVE_DAYS_REQUIRED

      # Check for meaningful activity (has at least some engagement)
      meaningful_activity?(user)
    end

    def meaningful_activity?(user)
      # User has completed at least one of these activities
      user.daily_plans.exists?
    end

    def recently_prompted_for_nps?(user)
      return false if user.last_nps_prompt_date.blank?

      (Time.current - user.last_nps_prompt_date).to_i / 1.day < NPS_QUARTERLY_DAYS
    end

    def days_until_nps_eligible(user)
      return 0 if should_show_nps?(user)

      calculate_days_until_eligible(user)
    end

    def calculate_days_until_eligible(user)
      days_for_signup = days_until_signup_requirement(user)
      return days_for_signup if days_for_signup.positive?

      days_until_next_quarterly_prompt(user)
    end

    def days_until_signup_requirement(user)
      days_since = (Time.current - user.created_at).to_i / 1.day
      [NPS_ACTIVE_DAYS_REQUIRED - days_since, 0].max
    end

    def days_until_next_quarterly_prompt(user)
      return 0 if user.last_nps_prompt_date.blank?

      days_since = (Time.current - user.last_nps_prompt_date).to_i / 1.day
      [NPS_QUARTERLY_DAYS - days_since, 0].max
    end

    def features_awaiting_feedback(user)
      used_features = user.first_actions || {}

      # Check which features have been used but not rated
      RATABLE_FEATURES.reject do |feature|
        used_features.key?("feature_feedback_#{feature}")
      end
    end

    def session_completion_count(user, flow_type)
      case flow_type.to_s
      when "weekly_review"
        user.weekly_reviews.where(completed: true).count
      when "goal_completed"
        user.created_goals.where(status: "completed").count
      when "reflection"
        user.reflections.count
      else
        0
      end
    end
  end
end
