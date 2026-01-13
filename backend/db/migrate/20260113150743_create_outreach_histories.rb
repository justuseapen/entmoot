# frozen_string_literal: true

class CreateOutreachHistories < ActiveRecord::Migration[7.2]
  def change
    create_table :outreach_histories do |t|
      t.references :user, null: false, foreign_key: true
      t.string :outreach_type, null: false
      t.string :channel, null: false
      t.datetime :sent_at, null: false

      t.timestamps
    end

    # Index for querying by user and outreach type for spam prevention
    add_index :outreach_histories, %i[user_id outreach_type sent_at]
    # Index for querying by user and channel for analytics
    add_index :outreach_histories, %i[user_id channel]
  end
end
