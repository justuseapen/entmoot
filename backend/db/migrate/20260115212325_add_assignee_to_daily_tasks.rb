class AddAssigneeToDailyTasks < ActiveRecord::Migration[7.2]
  def change
    add_reference :daily_tasks, :assignee, null: true, foreign_key: { to_table: :users }
  end
end
