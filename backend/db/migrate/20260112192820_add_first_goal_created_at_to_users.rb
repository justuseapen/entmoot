class AddFirstGoalCreatedAtToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :first_goal_created_at, :datetime
    add_column :users, :first_goal_prompt_dismissed_at, :datetime
  end
end
