# frozen_string_literal: true

class AddIsDraftToGoals < ActiveRecord::Migration[7.2]
  def change
    add_column :goals, :is_draft, :boolean, default: false, null: false
    add_index :goals, %i[family_id is_draft]
  end
end
