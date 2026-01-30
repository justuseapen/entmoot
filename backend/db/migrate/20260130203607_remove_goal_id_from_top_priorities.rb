# frozen_string_literal: true

class RemoveGoalIdFromTopPriorities < ActiveRecord::Migration[7.2]
  def change
    remove_foreign_key :top_priorities, :goals, if_exists: true
    remove_index :top_priorities, :goal_id, if_exists: true
    remove_column :top_priorities, :goal_id, :bigint
  end
end
