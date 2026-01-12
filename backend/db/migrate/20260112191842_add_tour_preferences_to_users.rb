# frozen_string_literal: true

class AddTourPreferencesToUsers < ActiveRecord::Migration[7.2]
  def change
    change_table :users, bulk: true do |t|
      t.datetime :tour_completed_at
      t.datetime :tour_dismissed_at
    end
  end
end
