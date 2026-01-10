# frozen_string_literal: true

class CreateFamilyMemberships < ActiveRecord::Migration[7.2]
  def change
    create_table :family_memberships do |t|
      t.references :family, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :role, null: false, default: 0

      t.timestamps
    end

    add_index :family_memberships, %i[family_id user_id], unique: true
  end
end
