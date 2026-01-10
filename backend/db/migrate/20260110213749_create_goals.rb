# frozen_string_literal: true

class CreateGoals < ActiveRecord::Migration[7.2]
  def change
    create_table :goals do |t|
      # Basic fields
      t.string :title, null: false
      t.text :description

      # SMART fields (all text for flexibility)
      t.text :specific
      t.text :measurable
      t.text :achievable
      t.text :relevant
      t.text :time_bound

      # Enums
      t.integer :time_scale, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.integer :visibility, null: false, default: 0

      # Progress and due date
      t.integer :progress, null: false, default: 0
      t.date :due_date

      # Parent goal for hierarchy (optional loose linking)
      t.references :parent, foreign_key: { to_table: :goals }, index: true

      # Associations
      t.references :family, null: false, foreign_key: true, index: true
      t.references :creator, null: false, foreign_key: { to_table: :users }, index: true

      t.timestamps
    end

    # Index for filtering by time_scale and status
    add_index :goals, %i[family_id time_scale status]
    add_index :goals, %i[family_id visibility]
    add_index :goals, %i[creator_id visibility]
  end
end
