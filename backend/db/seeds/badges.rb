# frozen_string_literal: true

# Seed data for badges
# Run with: rails db:seed or Rails.application.load_seed

BADGES = [
  # Goals category
  {
    name: "first_goal",
    description: "Created your first goal. Every journey begins with a single step!",
    icon: "🎯",
    category: "goals",
    criteria: { type: "goal_count", count: 1 }
  },
  {
    name: "goal_setter",
    description: "Created 5 goals. You're building a roadmap for success!",
    icon: "📋",
    category: "goals",
    criteria: { type: "goal_count", count: 5 }
  },
  {
    name: "goal_master",
    description: "Created 25 goals. You're a goal-setting champion!",
    icon: "🏆",
    category: "goals",
    criteria: { type: "goal_count", count: 25 }
  },

  # Reflection category
  {
    name: "first_reflection",
    description: "Completed your first evening reflection. Self-awareness is the foundation of growth!",
    icon: "🌙",
    category: "reflection",
    criteria: { type: "reflection_count", count: 1 }
  },
  {
    name: "reflection_pro",
    description: "Completed 10 evening reflections. You're mastering the art of self-reflection!",
    icon: "🔮",
    category: "reflection",
    criteria: { type: "reflection_count", count: 10 }
  },

  # Planning category
  {
    name: "first_plan",
    description: "Created your first daily plan. Planning is bringing the future into the present!",
    icon: "📝",
    category: "planning",
    criteria: { type: "daily_plan_count", count: 1 }
  },
  {
    name: "planning_pro",
    description: "Created 10 daily plans. You're a planning powerhouse!",
    icon: "📅",
    category: "planning",
    criteria: { type: "daily_plan_count", count: 10 }
  },

  # Streaks category
  {
    name: "week_warrior",
    description: "Maintained a 7-day streak. A week of consistency is a powerful start!",
    icon: "🔥",
    category: "streaks",
    criteria: { type: "streak_days", days: 7 }
  },
  {
    name: "month_champion",
    description: "Maintained a 30-day streak. A month of dedication pays off!",
    icon: "💪",
    category: "streaks",
    criteria: { type: "streak_days", days: 30 }
  },
  {
    name: "consistency_king",
    description: "Maintained a 90-day streak. You're unstoppable!",
    icon: "👑",
    category: "streaks",
    criteria: { type: "streak_days", days: 90 }
  }
].freeze

# rubocop:disable Rails/Output
print "Seeding badges..."

BADGES.each do |badge_attrs|
  badge = Badge.find_or_initialize_by(name: badge_attrs[:name])
  badge.assign_attributes(badge_attrs)
  if badge.save
    print "."
  else
    print "F"
    Rails.logger.warn "Failed to save #{badge_attrs[:name]}: #{badge.errors.full_messages.join(", ")}"
  end
end

puts " Done! Total: #{Badge.count}"
# rubocop:enable Rails/Output
