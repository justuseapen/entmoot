class AddFirstReflectionFieldsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :first_reflection_created_at, :datetime
    add_column :users, :first_reflection_prompt_dismissed_at, :datetime
  end
end
