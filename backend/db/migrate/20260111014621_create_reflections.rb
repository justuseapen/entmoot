# frozen_string_literal: true

class CreateReflections < ActiveRecord::Migration[7.2]
  def change
    create_table :reflections do |t|
      t.references :daily_plan, null: false, foreign_key: true
      t.integer :reflection_type, null: false, default: 0
      t.integer :mood
      t.integer :energy_level
      t.jsonb :gratitude_items, default: []

      t.timestamps
    end

    add_index :reflections, %i[daily_plan_id reflection_type], unique: true
  end
end
