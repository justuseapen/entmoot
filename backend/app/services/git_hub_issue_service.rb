# frozen_string_literal: true

class GitHubIssueService
  class GitHubError < StandardError; end

  REPO = ENV.fetch("TRACKABLE_GOALS_GITHUB_REPO", nil)

  def initialize(goal)
    @goal = goal
    @client = build_client
  end

  def create_trackable_goal_issue
    return unless configured?

    @client.create_issue(
      REPO,
      issue_title,
      issue_body,
      labels: %w[trackable-goal triage]
    )
  rescue Octokit::Error => e
    Rails.logger.error("GitHub issue creation failed for goal #{@goal.id}: #{e.message}")
    raise GitHubError, e.message
  end

  def configured?
    REPO.present? && ENV["GITHUB_ACCESS_TOKEN"].present?
  end

  private

  def build_client
    Octokit::Client.new(access_token: ENV.fetch("GITHUB_ACCESS_TOKEN", nil))
  end

  def issue_title
    "[Trackable Goal] #{@goal.title}"
  end

  def issue_body
    <<~BODY
      ## Trackable Goal Identified

      A user has marked a goal as trackable, indicating it could benefit from automatic progress tracking via an external integration.

      ### Goal Details

      - **Goal ID:** #{@goal.id}
      - **Title:** #{@goal.title}
      - **Description:** #{@goal.description || "Not provided"}
      - **Time Scale:** #{@goal.time_scale}
      - **Due Date:** #{@goal.due_date || "Not set"}
      - **Family ID:** #{@goal.family_id}
      - **Creator ID:** #{@goal.creator_id}

      ### SMART Details

      - **Measurable:** #{@goal.measurable || "Not defined"}

      ### Next Steps

      1. Analyze the goal to determine what type of integration would be appropriate
      2. Identify potential data sources (Plaid, Chess.com, Lichess, fitness APIs, etc.)
      3. Prioritize based on user demand and implementation complexity
      4. Add appropriate labels for the integration type once identified

      ---
      *This issue was automatically created by Entmoot when a goal was marked as trackable.*
    BODY
  end
end
