# frozen_string_literal: true

class CreateDailyTasks < ActiveRecord::Migration[7.2]
  def change
    create_table :daily_tasks do |t|
      t.string :title, null: false
      t.boolean :completed, null: false, default: false
      t.integer :position, null: false, default: 0
      t.references :daily_plan, null: false, foreign_key: true
      t.references :goal, null: true, foreign_key: true

      t.timestamps
    end

    add_index :daily_tasks, %i[daily_plan_id position]
  end
end
