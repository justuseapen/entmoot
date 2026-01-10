# frozen_string_literal: true

class CreateGoalAssignments < ActiveRecord::Migration[7.2]
  def change
    create_table :goal_assignments do |t|
      t.references :goal, null: false, foreign_key: true, index: true
      t.references :user, null: false, foreign_key: true, index: true

      t.timestamps
    end

    # Prevent duplicate assignments
    add_index :goal_assignments, %i[goal_id user_id], unique: true
  end
end
