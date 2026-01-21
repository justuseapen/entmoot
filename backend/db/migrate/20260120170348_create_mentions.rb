# frozen_string_literal: true

class CreateMentions < ActiveRecord::Migration[7.2]
  def change
    create_table :mentions do |t|
      t.string :mentionable_type, null: false
      t.bigint :mentionable_id, null: false
      t.references :user, null: false, foreign_key: true
      t.references :mentioned_user, null: false, foreign_key: { to_table: :users }
      t.string :text_field, null: false

      t.timestamps
    end

    add_index :mentions, %i[mentionable_type mentionable_id]
    add_index :mentions, %i[mentionable_type mentionable_id user_id mentioned_user_id text_field],
              unique: true, name: "index_mentions_uniqueness"
  end
end
