# frozen_string_literal: true

class AddCompletedToTopPriorities < ActiveRecord::Migration[7.2]
  def change
    add_column :top_priorities, :completed, :boolean, default: false, null: false
  end
end
