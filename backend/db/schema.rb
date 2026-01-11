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

ActiveRecord::Schema[7.2].define(version: 2026_01_11_005508) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

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
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "daily_plans", "families"
  add_foreign_key "daily_plans", "users"
  add_foreign_key "daily_tasks", "daily_plans"
  add_foreign_key "daily_tasks", "goals"
  add_foreign_key "family_memberships", "families"
  add_foreign_key "family_memberships", "users"
  add_foreign_key "goal_assignments", "goals"
  add_foreign_key "goal_assignments", "users"
  add_foreign_key "goals", "families"
  add_foreign_key "goals", "goals", column: "parent_id"
  add_foreign_key "goals", "users", column: "creator_id"
  add_foreign_key "invitations", "families"
  add_foreign_key "invitations", "users", column: "inviter_id"
  add_foreign_key "pets", "families"
  add_foreign_key "refresh_tokens", "users"
  add_foreign_key "top_priorities", "daily_plans"
  add_foreign_key "top_priorities", "goals"
end
