# frozen_string_literal: true

class AddPositionToGoals < ActiveRecord::Migration[7.2]
  def change
    add_column :goals, :position, :integer
    add_index :goals, %i[family_id creator_id time_scale position]
  end
end
