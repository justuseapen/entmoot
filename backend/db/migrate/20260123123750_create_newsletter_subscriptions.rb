# frozen_string_literal: true

class CreateNewsletterSubscriptions < ActiveRecord::Migration[7.2]
  def change
    create_table :newsletter_subscriptions do |t|
      t.string :email, null: false
      t.integer :status, null: false, default: 0
      t.datetime :subscribed_at
      t.datetime :unsubscribed_at

      t.timestamps
    end

    add_index :newsletter_subscriptions, :email, unique: true
    add_index :newsletter_subscriptions, :status
  end
end
