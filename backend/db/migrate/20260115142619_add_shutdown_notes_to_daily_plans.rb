class AddShutdownNotesToDailyPlans < ActiveRecord::Migration[7.2]
  def change
    add_column :daily_plans, :shutdown_shipped, :text
    add_column :daily_plans, :shutdown_blocked, :text
  end
end
