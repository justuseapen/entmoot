class AddTrackableToGoals < ActiveRecord::Migration[7.2]
  def change
    add_column :goals, :trackable, :boolean, default: false, null: false
  end
end
