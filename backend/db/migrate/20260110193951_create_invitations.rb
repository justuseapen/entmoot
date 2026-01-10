# frozen_string_literal: true

class CreateInvitations < ActiveRecord::Migration[7.2]
  def change
    create_table :invitations do |t|
      t.references :family, null: false, foreign_key: true
      t.references :inviter, null: false, foreign_key: { to_table: :users }
      t.string :token, null: false
      t.string :email, null: false
      t.integer :role, null: false
      t.datetime :expires_at, null: false
      t.datetime :accepted_at

      t.timestamps
    end

    add_index :invitations, :token, unique: true
    add_index :invitations, %i[family_id email], unique: true, where: "accepted_at IS NULL"
  end
end
