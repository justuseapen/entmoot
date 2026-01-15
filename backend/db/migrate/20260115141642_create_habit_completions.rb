class CreateHabitCompletions < ActiveRecord::Migration[7.2]
  def change
    create_table :habit_completions do |t|
      t.boolean :completed, null: false, default: false
      t.references :habit, null: false, foreign_key: true
      t.references :daily_plan, null: false, foreign_key: true

      t.timestamps
    end

    add_index :habit_completions, %i[habit_id daily_plan_id], unique: true
  end
end
