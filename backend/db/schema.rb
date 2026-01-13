# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_01_13_001413) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "badges", force: :cascade do |t|
    t.string "name", null: false
    t.string "description", null: false
    t.string "icon", null: false
    t.string "category", null: false
    t.jsonb "criteria", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_badges_on_category"
    t.index ["name"], name: "index_badges_on_name", unique: true
  end

  create_table "daily_plans", force: :cascade do |t|
    t.date "date", null: false
    t.bigint "user_id", null: false
    t.bigint "family_id", null: false
    t.text "intention"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["family_id"], name: "index_daily_plans_on_family_id"
    t.index ["user_id", "family_id", "date"], name: "index_daily_plans_on_user_id_and_family_id_and_date", unique: true
    t.index ["user_id"], name: "index_daily_plans_on_user_id"
  end

  create_table "daily_tasks", force: :cascade do |t|
    t.string "title", null: false
    t.boolean "completed", default: false, null: false
    t.integer "position", default: 0, null: false
    t.bigint "daily_plan_id", null: false
    t.bigint "goal_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["daily_plan_id", "position"], name: "index_daily_tasks_on_daily_plan_id_and_position"
    t.index ["daily_plan_id"], name: "index_daily_tasks_on_daily_plan_id"
    t.index ["goal_id"], name: "index_daily_tasks_on_goal_id"
  end

  create_table "device_tokens", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "token", null: false
    t.string "platform", null: false
    t.string "device_name"
    t.datetime "last_used_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["token"], name: "index_device_tokens_on_token", unique: true
    t.index ["user_id", "token"], name: "index_device_tokens_on_user_id_and_token", unique: true
    t.index ["user_id"], name: "index_device_tokens_on_user_id"
  end

  create_table "families", force: :cascade do |t|
    t.string "name", null: false
    t.string "timezone", default: "UTC", null: false
    t.jsonb "settings", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "family_memberships", force: :cascade do |t|
    t.bigint "family_id", null: false
    t.bigint "user_id", null: false
    t.integer "role", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["family_id", "user_id"], name: "index_family_memberships_on_family_id_and_user_id", unique: true
    t.index ["family_id"], name: "index_family_memberships_on_family_id"
    t.index ["user_id"], name: "index_family_memberships_on_user_id"
  end

  create_table "feedback_reports", force: :cascade do |t|
    t.bigint "user_id"
    t.string "report_type", default: "bug", null: false
    t.string "title", null: false
    t.text "description"
    t.string "severity"
    t.string "status", default: "new", null: false
    t.jsonb "context_data", default: {}, null: false
    t.boolean "allow_contact", default: false, null: false
    t.string "contact_email"
    t.datetime "resolved_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "assigned_to_id"
    t.text "internal_notes"
    t.bigint "duplicate_of_id"
    t.index ["assigned_to_id"], name: "index_feedback_reports_on_assigned_to_id"
    t.index ["created_at"], name: "index_feedback_reports_on_created_at"
    t.index ["duplicate_of_id"], name: "index_feedback_reports_on_duplicate_of_id"
    t.index ["report_type"], name: "index_feedback_reports_on_report_type"
    t.index ["status"], name: "index_feedback_reports_on_status"
    t.index ["user_id"], name: "index_feedback_reports_on_user_id"
  end

  create_table "goal_assignments", force: :cascade do |t|
    t.bigint "goal_id", null: false
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["goal_id", "user_id"], name: "index_goal_assignments_on_goal_id_and_user_id", unique: true
    t.index ["goal_id"], name: "index_goal_assignments_on_goal_id"
    t.index ["user_id"], name: "index_goal_assignments_on_user_id"
  end

  create_table "goals", force: :cascade do |t|
    t.string "title", null: false
    t.text "description"
    t.text "specific"
    t.text "measurable"
    t.text "achievable"
    t.text "relevant"
    t.text "time_bound"
    t.integer "time_scale", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.integer "visibility", default: 0, null: false
    t.integer "progress", default: 0, null: false
    t.date "due_date"
    t.bigint "parent_id"
    t.bigint "family_id", null: false
    t.bigint "creator_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["creator_id", "visibility"], name: "index_goals_on_creator_id_and_visibility"
    t.index ["creator_id"], name: "index_goals_on_creator_id"
    t.index ["family_id", "time_scale", "status"], name: "index_goals_on_family_id_and_time_scale_and_status"
    t.index ["family_id", "visibility"], name: "index_goals_on_family_id_and_visibility"
    t.index ["family_id"], name: "index_goals_on_family_id"
    t.index ["parent_id"], name: "index_goals_on_parent_id"
  end

  create_table "invitations", force: :cascade do |t|
    t.bigint "family_id", null: false
    t.bigint "inviter_id", null: false
    t.string "token", null: false
    t.string "email", null: false
    t.integer "role", null: false
    t.datetime "expires_at", null: false
    t.datetime "accepted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["family_id", "email"], name: "index_invitations_on_family_id_and_email", unique: true, where: "(accepted_at IS NULL)"
    t.index ["family_id"], name: "index_invitations_on_family_id"
    t.index ["inviter_id"], name: "index_invitations_on_inviter_id"
    t.index ["token"], name: "index_invitations_on_token", unique: true
  end

  create_table "jwt_denylist", force: :cascade do |t|
    t.string "jti", null: false
    t.datetime "exp", null: false
    t.index ["jti"], name: "index_jwt_denylist_on_jti", unique: true
  end

  create_table "notification_preferences", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.boolean "in_app", default: true, null: false
    t.boolean "email", default: true, null: false
    t.boolean "push", default: false, null: false
    t.boolean "morning_planning", default: true, null: false
    t.boolean "evening_reflection", default: true, null: false
    t.boolean "weekly_review", default: true, null: false
    t.string "morning_planning_time", default: "07:00", null: false
    t.string "evening_reflection_time", default: "20:00", null: false
    t.string "weekly_review_time", default: "18:00", null: false
    t.integer "weekly_review_day", default: 0, null: false
    t.string "quiet_hours_start", default: "22:00", null: false
    t.string "quiet_hours_end", default: "07:00", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "tips_enabled", default: true, null: false
    t.jsonb "shown_tips", default: [], null: false
    t.index ["user_id"], name: "index_notification_preferences_on_user_id", unique: true
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "title", null: false
    t.text "body"
    t.boolean "read", default: false, null: false
    t.string "link"
    t.string "notification_type", default: "general", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "created_at"], name: "index_notifications_on_user_id_and_created_at"
    t.index ["user_id", "read"], name: "index_notifications_on_user_id_and_read"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "pets", force: :cascade do |t|
    t.string "name", null: false
    t.string "pet_type"
    t.string "avatar_url"
    t.date "birthday"
    t.text "notes"
    t.bigint "family_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["family_id", "name"], name: "index_pets_on_family_id_and_name", unique: true
    t.index ["family_id"], name: "index_pets_on_family_id"
  end

  create_table "points_ledger_entries", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "points", null: false
    t.string "activity_type", null: false
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["activity_type"], name: "index_points_ledger_entries_on_activity_type"
    t.index ["created_at"], name: "index_points_ledger_entries_on_created_at"
    t.index ["user_id", "activity_type", "created_at"], name: "idx_points_user_activity_date"
    t.index ["user_id"], name: "index_points_ledger_entries_on_user_id"
  end

  create_table "reflection_responses", force: :cascade do |t|
    t.bigint "reflection_id", null: false
    t.string "prompt", null: false
    t.text "response"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["reflection_id", "prompt"], name: "index_reflection_responses_on_reflection_id_and_prompt", unique: true
    t.index ["reflection_id"], name: "index_reflection_responses_on_reflection_id"
  end

  create_table "reflections", force: :cascade do |t|
    t.bigint "daily_plan_id"
    t.integer "reflection_type", default: 0, null: false
    t.integer "mood"
    t.integer "energy_level"
    t.jsonb "gratitude_items", default: []
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.bigint "family_id"
    t.index ["daily_plan_id", "reflection_type"], name: "index_reflections_on_daily_plan_id_and_reflection_type", unique: true
    t.index ["daily_plan_id"], name: "index_reflections_on_daily_plan_id"
    t.index ["family_id"], name: "index_reflections_on_family_id"
    t.index ["user_id"], name: "index_reflections_on_user_id"
  end

  create_table "refresh_tokens", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "token", null: false
    t.datetime "expires_at", null: false
    t.datetime "revoked_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["token"], name: "index_refresh_tokens_on_token", unique: true
    t.index ["user_id"], name: "index_refresh_tokens_on_user_id"
  end

  create_table "streaks", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "streak_type", null: false
    t.integer "current_count", default: 0, null: false
    t.integer "longest_count", default: 0, null: false
    t.date "last_activity_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "streak_type"], name: "index_streaks_unique_user_type", unique: true
    t.index ["user_id"], name: "index_streaks_on_user_id"
  end

  create_table "top_priorities", force: :cascade do |t|
    t.string "title", null: false
    t.integer "priority_order", null: false
    t.bigint "daily_plan_id", null: false
    t.bigint "goal_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["daily_plan_id", "priority_order"], name: "index_top_priorities_on_daily_plan_id_and_priority_order", unique: true
    t.index ["daily_plan_id"], name: "index_top_priorities_on_daily_plan_id"
    t.index ["goal_id"], name: "index_top_priorities_on_goal_id"
  end

  create_table "user_badges", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "badge_id", null: false
    t.datetime "earned_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["badge_id"], name: "index_user_badges_on_badge_id"
    t.index ["user_id", "badge_id"], name: "index_user_badges_unique_user_badge", unique: true
    t.index ["user_id"], name: "index_user_badges_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.string "name", null: false
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "tour_completed_at"
    t.datetime "tour_dismissed_at"
    t.datetime "first_goal_created_at"
    t.datetime "first_goal_prompt_dismissed_at"
    t.datetime "first_reflection_created_at"
    t.datetime "first_reflection_prompt_dismissed_at"
    t.jsonb "first_actions", default: {}
    t.jsonb "onboarding_emails_sent", default: {}
    t.boolean "onboarding_unsubscribed", default: false
    t.datetime "onboarding_wizard_completed_at"
    t.integer "onboarding_wizard_last_step"
    t.datetime "first_family_invite_sent_at"
    t.datetime "last_nps_prompt_date"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "weekly_reviews", force: :cascade do |t|
    t.date "week_start_date", null: false
    t.bigint "user_id", null: false
    t.bigint "family_id", null: false
    t.jsonb "wins", default: []
    t.jsonb "challenges", default: []
    t.jsonb "next_week_priorities", default: []
    t.text "lessons_learned"
    t.boolean "completed", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["family_id"], name: "index_weekly_reviews_on_family_id"
    t.index ["user_id", "family_id", "week_start_date"], name: "index_weekly_reviews_unique_week", unique: true
    t.index ["user_id"], name: "index_weekly_reviews_on_user_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "daily_plans", "families"
  add_foreign_key "daily_plans", "users"
  add_foreign_key "daily_tasks", "daily_plans"
  add_foreign_key "daily_tasks", "goals"
  add_foreign_key "device_tokens", "users"
  add_foreign_key "family_memberships", "families"
  add_foreign_key "family_memberships", "users"
  add_foreign_key "feedback_reports", "feedback_reports", column: "duplicate_of_id"
  add_foreign_key "feedback_reports", "users"
  add_foreign_key "feedback_reports", "users", column: "assigned_to_id"
  add_foreign_key "goal_assignments", "goals"
  add_foreign_key "goal_assignments", "users"
  add_foreign_key "goals", "families"
  add_foreign_key "goals", "goals", column: "parent_id"
  add_foreign_key "goals", "users", column: "creator_id"
  add_foreign_key "invitations", "families"
  add_foreign_key "invitations", "users", column: "inviter_id"
  add_foreign_key "notification_preferences", "users"
  add_foreign_key "notifications", "users"
  add_foreign_key "pets", "families"
  add_foreign_key "points_ledger_entries", "users"
  add_foreign_key "reflection_responses", "reflections"
  add_foreign_key "reflections", "daily_plans"
  add_foreign_key "reflections", "families"
  add_foreign_key "reflections", "users"
  add_foreign_key "refresh_tokens", "users"
  add_foreign_key "streaks", "users"
  add_foreign_key "top_priorities", "daily_plans"
  add_foreign_key "top_priorities", "goals"
  add_foreign_key "user_badges", "badges"
  add_foreign_key "user_badges", "users"
  add_foreign_key "weekly_reviews", "families"
  add_foreign_key "weekly_reviews", "users"
end
