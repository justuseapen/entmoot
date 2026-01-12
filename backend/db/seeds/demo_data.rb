# frozen_string_literal: true

# Demo seed data for Entmoot
# Creates a demo family with realistic data for testing and demos
# This file is idempotent - can be run multiple times safely

# rubocop:disable Metrics/MethodLength, Metrics/AbcSize, Rails/Output
# rubocop:disable Metrics/ModuleLength, Metrics/ClassLength, Metrics/ParameterLists
# rubocop:disable Layout/LineLength, Lint/UselessAssignment

module DemoSeed
  DEMO_EMAIL_DOMAIN = "@demo.entmoot.family"
  DEMO_FAMILY_NAME = "The Demo Family"

  class << self
    def run
      puts "\n=== Creating Demo Data ==="

      create_demo_users
      create_demo_family
      create_family_memberships
      create_pets
      create_goals
      create_daily_plans_and_reflections
      create_weekly_reviews
      create_streaks
      award_badges
      create_points_history

      puts "\n=== Demo Data Complete ==="
      print_summary
    end

    private

    # Demo users with different personas
    def demo_users_data
      [
        { email: "alex#{DEMO_EMAIL_DOMAIN}", name: "Alex Johnson", role: :admin },
        { email: "sam#{DEMO_EMAIL_DOMAIN}", name: "Sam Johnson", role: :adult },
        { email: "taylor#{DEMO_EMAIL_DOMAIN}", name: "Taylor Johnson", role: :teen },
        { email: "jordan#{DEMO_EMAIL_DOMAIN}", name: "Jordan Johnson", role: :child },
        { email: "pat#{DEMO_EMAIL_DOMAIN}", name: "Pat Smith", role: :observer }
      ]
    end

    def create_demo_users
      print "Creating demo users..."
      demo_users_data.each do |user_data|
        user = User.find_or_initialize_by(email: user_data[:email])
        user.assign_attributes(
          name: user_data[:name],
          password: "DemoPassword123!",
          password_confirmation: "DemoPassword123!"
        )
        user.save!
        print "."
      end
      puts " Done! (#{demo_users_data.count} users)"
    end

    def create_demo_family
      print "Creating demo family..."
      @family = Family.find_or_initialize_by(name: DEMO_FAMILY_NAME)
      @family.assign_attributes(
        timezone: "America/New_York",
        settings: {
          "week_start_day" => 1, # Monday
          "theme" => "light",
          "language" => "en"
        }
      )
      @family.save!
      puts " Done!"
    end

    def create_family_memberships
      print "Creating family memberships..."
      demo_users_data.each do |user_data|
        user = User.find_by!(email: user_data[:email])
        membership = FamilyMembership.find_or_initialize_by(user: user, family: @family)
        membership.assign_attributes(role: user_data[:role])
        membership.save!
        print "."
      end
      puts " Done!"
    end

    def create_pets
      print "Creating pets..."
      pets_data = [
        { name: "Buddy", pet_type: "dog", birthday: 3.years.ago.to_date, notes: "Golden retriever, loves fetch" },
        { name: "Whiskers", pet_type: "cat", birthday: 2.years.ago.to_date, notes: "Tabby cat, enjoys sunny spots" },
        { name: "Goldie", pet_type: "fish", birthday: 6.months.ago.to_date, notes: "Goldfish in living room tank" }
      ]

      pets_data.each do |pet_data|
        pet = Pet.find_or_initialize_by(family: @family, name: pet_data[:name])
        pet.assign_attributes(pet_data)
        pet.save!
        print "."
      end
      puts " Done!"
    end

    def create_goals
      print "Creating goals..."
      alex = User.find_by!(email: "alex#{DEMO_EMAIL_DOMAIN}")
      sam = User.find_by!(email: "sam#{DEMO_EMAIL_DOMAIN}")
      taylor = User.find_by!(email: "taylor#{DEMO_EMAIL_DOMAIN}")

      # Annual goal
      annual_goal = create_goal(
        creator: alex,
        title: "Improve Family Health and Wellness",
        description: "Focus on healthy eating, regular exercise, and mental wellness as a family",
        time_scale: :annual,
        status: :in_progress,
        visibility: :family,
        progress: 25,
        due_date: Date.current.end_of_year,
        specific: "Establish consistent healthy habits for all family members",
        measurable: "Each member exercises 3x/week, family meals 5x/week",
        achievable: "Start small with weekly goals and build up",
        relevant: "Health impacts everything - energy, mood, productivity",
        time_bound: "By end of year, all habits established"
      )

      # Quarterly goals linked to annual
      q1_goal = create_goal(
        creator: alex,
        title: "Q1: Establish Exercise Routines",
        description: "Get everyone moving regularly",
        time_scale: :quarterly,
        status: :in_progress,
        visibility: :family,
        progress: 60,
        due_date: Date.current.end_of_quarter,
        parent: annual_goal,
        specific: "Each family member finds an exercise they enjoy",
        measurable: "3 exercise sessions per week per person",
        achievable: "Start with 2x/week and increase",
        relevant: "Foundation for long-term health",
        time_bound: "End of Q1"
      )

      # Monthly goals
      create_goal(
        creator: sam,
        title: "Learn 5 New Healthy Recipes",
        description: "Expand our healthy meal options",
        time_scale: :monthly,
        status: :in_progress,
        visibility: :family,
        progress: 40,
        due_date: Date.current.end_of_month,
        parent: q1_goal,
        specific: "Find and cook 5 new nutritious recipes the whole family enjoys",
        measurable: "5 successful new recipes",
        achievable: "Try one new recipe per week",
        relevant: "Healthy eating supports our wellness goal",
        time_bound: "This month"
      )

      # Weekly goals
      weekly_goal = create_goal(
        creator: taylor,
        title: "Complete Homework by Friday",
        description: "Stay on top of schoolwork",
        time_scale: :weekly,
        status: :in_progress,
        visibility: :personal,
        progress: 70,
        due_date: Date.current.end_of_week,
        specific: "Finish all assigned homework before the weekend",
        measurable: "All assignments submitted",
        achievable: "Work 1 hour per day after school",
        relevant: "Good grades support future opportunities",
        time_bound: "By Friday 5pm"
      )

      # Daily goals
      create_goal(
        creator: alex,
        title: "Morning Workout",
        description: "30-minute exercise before work",
        time_scale: :daily,
        status: :completed,
        visibility: :personal,
        progress: 100,
        due_date: Date.current,
        parent: q1_goal
      )

      create_goal(
        creator: sam,
        title: "Walk Buddy",
        description: "Evening dog walk in the neighborhood",
        time_scale: :daily,
        status: :in_progress,
        visibility: :shared,
        progress: 0,
        due_date: Date.current,
        assignees: [sam, taylor]
      )

      # Some completed goals
      create_goal(
        creator: alex,
        title: "Set Up Home Gym",
        description: "Create a space for home workouts",
        time_scale: :monthly,
        status: :completed,
        visibility: :family,
        progress: 100,
        due_date: 1.month.ago.to_date,
        parent: q1_goal
      )

      # At risk goal
      create_goal(
        creator: taylor,
        title: "Science Project",
        description: "Complete volcano project for science fair",
        time_scale: :weekly,
        status: :at_risk,
        visibility: :personal,
        progress: 30,
        due_date: 2.days.from_now.to_date,
        specific: "Build a working baking soda volcano with written explanation",
        measurable: "Completed project with display board",
        achievable: "Have all materials, just need time",
        relevant: "Required for science class grade",
        time_bound: "Due in 2 days"
      )

      puts " Done! (#{Goal.where(family: @family).count} goals)"
    end

    def create_goal(creator:, title:, time_scale:, status:, visibility:, progress:, due_date:,
                    description: nil, parent: nil, specific: nil, measurable: nil,
                    achievable: nil, relevant: nil, time_bound: nil, assignees: [])
      goal = Goal.find_or_initialize_by(family: @family, creator: creator, title: title)
      goal.assign_attributes(
        description: description,
        time_scale: time_scale,
        status: status,
        visibility: visibility,
        progress: progress,
        due_date: due_date,
        parent: parent,
        specific: specific,
        measurable: measurable,
        achievable: achievable,
        relevant: relevant,
        time_bound: time_bound
      )
      goal.save!

      # Assign users if specified
      assignees.each do |user|
        goal.assign_user(user)
      end

      goal
    end

    def create_daily_plans_and_reflections
      print "Creating daily plans and reflections..."
      alex = User.find_by!(email: "alex#{DEMO_EMAIL_DOMAIN}")
      sam = User.find_by!(email: "sam#{DEMO_EMAIL_DOMAIN}")

      # Create plans for the past week
      (7.days.ago.to_date..Date.current).each do |date|
        create_daily_plan_for(alex, date, completed: date < Date.current)
        create_daily_plan_for(sam, date, completed: date < Date.current) if date.wday != 0 # Sam skips Sundays
        print "."
      end

      puts " Done!"
    end

    def create_daily_plan_for(user, date, completed: false)
      plan = DailyPlan.find_or_initialize_by(user: user, family: @family, date: date)
      plan.intention = daily_intentions.sample
      plan.save!

      # Create tasks
      create_tasks_for_plan(plan, completed)

      # Create top priorities
      create_priorities_for_plan(plan)

      # Create evening reflection for completed days
      create_reflection_for_plan(plan) if completed

      plan
    end

    def create_tasks_for_plan(plan, completed)
      task_templates = [
        "Check and respond to emails",
        "Team standup meeting",
        "Review weekly goals",
        "Work on main project",
        "Exercise for 30 minutes",
        "Read for 20 minutes",
        "Prepare healthy lunch",
        "Call family member",
        "Review budget/finances",
        "Plan tomorrow"
      ]

      selected_tasks = task_templates.sample(rand(4..7))
      selected_tasks.each_with_index do |title, index|
        task = plan.daily_tasks.find_or_initialize_by(title: title)
        task.assign_attributes(
          position: index + 1,
          completed: completed ? rand < 0.8 : false # 80% completion rate for past days
        )
        task.save!
      end
    end

    def create_priorities_for_plan(plan)
      priorities = [
        "Complete project milestone",
        "Family dinner together",
        "30-minute workout",
        "Important client call",
        "Submit report",
        "Quality time with kids"
      ]

      selected = priorities.sample(3)
      selected.each_with_index do |title, index|
        priority = plan.top_priorities.find_or_initialize_by(priority_order: index + 1)
        priority.title = title
        priority.save!
      end
    end

    def create_reflection_for_plan(plan)
      reflection = plan.reflections.find_or_initialize_by(reflection_type: :evening)
      reflection.assign_attributes(
        mood: %i[great good okay].sample,
        energy_level: rand(3..5),
        gratitude_items: [
          gratitude_items.sample,
          gratitude_items.sample,
          gratitude_items.sample
        ]
      )
      reflection.save!

      # Add reflection responses
      prompts_and_responses.each do |prompt, responses|
        response = reflection.reflection_responses.find_or_initialize_by(prompt: prompt)
        response.response = responses.sample
        response.save!
      end
    end

    def daily_intentions
      [
        "Today I will focus on being present and productive",
        "I will approach challenges with patience and creativity",
        "My goal is to make meaningful progress on my priorities",
        "I will take care of my health while accomplishing my tasks",
        "Today is an opportunity to learn and grow",
        "I will be kind to myself and others today"
      ]
    end

    def gratitude_items
      [
        "My supportive family",
        "Good health",
        "A comfortable home",
        "Meaningful work",
        "Good friends",
        "Beautiful weather today",
        "A good night's sleep",
        "Delicious coffee",
        "A productive morning",
        "Quality time with loved ones"
      ]
    end

    def prompts_and_responses
      {
        "What went well today?" => [
          "Completed my main project milestone ahead of schedule",
          "Had a great workout and felt energized all day",
          "Quality family dinner with good conversation"
        ],
        "What was challenging?" => [
          "Struggled to focus in the afternoon",
          "Unexpected meeting disrupted my planned work",
          "Felt tired from staying up late last night"
        ],
        "What will you do differently tomorrow?" => [
          "Take breaks every 90 minutes to maintain focus",
          "Start with the hardest task when my energy is highest",
          "Go to bed 30 minutes earlier"
        ]
      }
    end

    def create_weekly_reviews
      print "Creating weekly reviews..."
      alex = User.find_by!(email: "alex#{DEMO_EMAIL_DOMAIN}")

      # Create review for last week
      last_week_start = Date.current.beginning_of_week - 1.week
      review = WeeklyReview.find_or_initialize_by(
        user: alex,
        family: @family,
        week_start_date: last_week_start
      )
      review.assign_attributes(
        wins: [
          "Completed project milestone on time",
          "Exercised 4 out of 5 planned days",
          "Had family game night Friday"
        ],
        challenges: [
          "Email overload made it hard to focus",
          "Didn't get enough sleep mid-week"
        ],
        next_week_priorities: [
          "Finish quarterly report",
          "Schedule annual checkup",
          "Plan family outing"
        ],
        lessons_learned: "Blocking time for deep work made a huge difference. Need to protect that time more consistently."
      )
      review.save!

      puts " Done!"
    end

    def create_streaks
      print "Creating streaks..."
      alex = User.find_by!(email: "alex#{DEMO_EMAIL_DOMAIN}")
      sam = User.find_by!(email: "sam#{DEMO_EMAIL_DOMAIN}")

      # Alex has strong streaks
      create_streak(alex, :daily_planning, current: 12, longest: 15, last_activity: Date.current)
      create_streak(alex, :evening_reflection, current: 8, longest: 10, last_activity: Date.current - 1.day)
      create_streak(alex, :weekly_review, current: 3, longest: 3, last_activity: Date.current.beginning_of_week - 1.day)

      # Sam has moderate streaks
      create_streak(sam, :daily_planning, current: 5, longest: 8, last_activity: Date.current - 1.day)
      create_streak(sam, :evening_reflection, current: 2, longest: 5, last_activity: Date.current - 2.days)

      puts " Done!"
    end

    def create_streak(user, streak_type, current:, longest:, last_activity:)
      streak = Streak.find_or_initialize_by(user: user, streak_type: streak_type)
      streak.assign_attributes(
        current_count: current,
        longest_count: longest,
        last_activity_date: last_activity
      )
      streak.save!
    end

    def award_badges
      print "Awarding badges..."
      alex = User.find_by!(email: "alex#{DEMO_EMAIL_DOMAIN}")
      sam = User.find_by!(email: "sam#{DEMO_EMAIL_DOMAIN}")

      # Award badges to Alex
      award_badge_to(alex, "first_goal", 30.days.ago)
      award_badge_to(alex, "goal_setter", 14.days.ago)
      award_badge_to(alex, "first_reflection", 25.days.ago)
      award_badge_to(alex, "first_plan", 28.days.ago)
      award_badge_to(alex, "week_warrior", 7.days.ago)

      # Award badges to Sam
      award_badge_to(sam, "first_goal", 20.days.ago)
      award_badge_to(sam, "first_reflection", 18.days.ago)
      award_badge_to(sam, "first_plan", 19.days.ago)

      puts " Done!"
    end

    def award_badge_to(user, badge_name, earned_at)
      badge = Badge.find_by(name: badge_name)
      return unless badge

      user_badge = UserBadge.find_or_initialize_by(user: user, badge: badge)
      user_badge.earned_at = earned_at
      user_badge.save!
    end

    def create_points_history
      print "Creating points history..."
      alex = User.find_by!(email: "alex#{DEMO_EMAIL_DOMAIN}")
      sam = User.find_by!(email: "sam#{DEMO_EMAIL_DOMAIN}")

      # Skip if demo points already exist for this user (idempotency)
      if PointsLedgerEntry.where(user: alex).where("metadata->>'demo' = 'true'").exists?
        puts " Skipped (already exists)"
        return
      end

      # Create varied points history for Alex
      create_points_entries(alex, [
                              { type: "complete_task", count: 25, days_ago_range: 0..7 },
                              { type: "complete_daily_plan", count: 6, days_ago_range: 1..7 },
                              { type: "complete_reflection", count: 5, days_ago_range: 1..7 },
                              { type: "complete_weekly_review", count: 1, days_ago_range: 7..7 },
                              { type: "create_goal", count: 4, days_ago_range: 1..14 },
                              { type: "complete_goal", count: 1, days_ago_range: 1..7 },
                              { type: "earn_badge", count: 5, days_ago_range: 7..30 },
                              { type: "streak_milestone", count: 1, days_ago_range: 5..5 }
                            ])

      # Create points history for Sam
      create_points_entries(sam, [
                              { type: "complete_task", count: 15, days_ago_range: 0..7 },
                              { type: "complete_daily_plan", count: 4, days_ago_range: 1..7 },
                              { type: "complete_reflection", count: 3, days_ago_range: 1..7 },
                              { type: "create_goal", count: 2, days_ago_range: 3..10 },
                              { type: "earn_badge", count: 3, days_ago_range: 14..20 }
                            ])

      puts " Done!"
    end

    def create_points_entries(user, entries_config)
      entries_config.each do |config|
        config[:count].times do
          days_ago = rand(config[:days_ago_range])
          created_time = days_ago.days.ago + rand(0..23).hours

          PointsLedgerEntry.create!(
            user: user,
            activity_type: config[:type],
            points: PointsLedgerEntry.points_for(config[:type]),
            metadata: { demo: true },
            created_at: created_time,
            updated_at: created_time
          )
        end
        print "."
      end
    end

    def print_summary
      puts "\n--- Demo Data Summary ---"
      puts "Family: #{DEMO_FAMILY_NAME}"
      puts "Users: #{demo_users_data.count}"
      demo_users_data.each do |user_data|
        user = User.find_by(email: user_data[:email])
        if user
          puts "  - #{user.name} (#{user_data[:role]}) - #{user.email}"
          puts "    Password: DemoPassword123!"
        end
      end
      puts "\nData created:"
      puts "  - Pets: #{Pet.where(family: @family).count}"
      puts "  - Goals: #{Goal.where(family: @family).count}"
      puts "  - Daily Plans: #{DailyPlan.where(family: @family).count}"
      puts "  - Reflections: #{Reflection.joins(:daily_plan).where(daily_plans: { family_id: @family.id }).count}"
      puts "  - Weekly Reviews: #{WeeklyReview.where(family: @family).count}"
      puts "  - Streaks: #{Streak.joins(:user).where(users: { id: @family.members.pluck(:id) }).count}"
      puts "  - User Badges: #{UserBadge.joins(:user).where(users: { id: @family.members.pluck(:id) }).count}"
      puts "  - Points Entries: #{PointsLedgerEntry.joins(:user).where(users: { id: @family.members.pluck(:id) }).count}"
      puts "\nLogin with any demo user to explore!"
      puts "-------------------------"
    end
  end
end

# Run the demo seed
DemoSeed.run

# rubocop:enable Metrics/MethodLength, Metrics/AbcSize, Rails/Output
# rubocop:enable Metrics/ModuleLength, Metrics/ClassLength, Metrics/ParameterLists
# rubocop:enable Layout/LineLength, Lint/UselessAssignment
