# frozen_string_literal: true

class RemoveGoalAndAssigneeFromDailyTasks < ActiveRecord::Migration[7.2]
  def change
    remove_foreign_key :daily_tasks, :goals, if_exists: true
    remove_foreign_key :daily_tasks, :users, column: :assignee_id, if_exists: true
    remove_index :daily_tasks, :goal_id, if_exists: true
    remove_index :daily_tasks, :assignee_id, if_exists: true
    remove_column :daily_tasks, :goal_id, :bigint
    remove_column :daily_tasks, :assignee_id, :bigint
  end
end
