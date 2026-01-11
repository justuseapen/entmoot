# frozen_string_literal: true

class CreateNotifications < ActiveRecord::Migration[7.2]
  def change
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.text :body
      t.boolean :read, null: false, default: false
      t.string :link
      t.string :notification_type, null: false, default: "general"

      t.timestamps
    end

    add_index :notifications, %i[user_id read]
    add_index :notifications, %i[user_id created_at]
  end
end
