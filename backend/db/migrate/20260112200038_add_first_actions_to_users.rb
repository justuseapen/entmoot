# frozen_string_literal: true

class AddFirstActionsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :first_actions, :jsonb, default: {}
  end
end
