# frozen_string_literal: true

class CreateTopPriorities < ActiveRecord::Migration[7.2]
  def change
    create_table :top_priorities do |t|
      t.string :title, null: false
      t.integer :priority_order, null: false
      t.references :daily_plan, null: false, foreign_key: true
      t.references :goal, null: true, foreign_key: true

      t.timestamps
    end

    add_index :top_priorities, %i[daily_plan_id priority_order], unique: true
  end
end
