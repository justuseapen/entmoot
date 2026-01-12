# frozen_string_literal: true

class CreatePointsLedgerEntries < ActiveRecord::Migration[7.2]
  def change
    create_table :points_ledger_entries do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :points, null: false
      t.string :activity_type, null: false
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :points_ledger_entries, :activity_type
    add_index :points_ledger_entries, :created_at
    add_index :points_ledger_entries, %i[user_id activity_type created_at], name: "idx_points_user_activity_date"
  end
end
