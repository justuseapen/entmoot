class AllowNullDailyPlanOnReflections < ActiveRecord::Migration[7.2]
  def change
    change_column_null :reflections, :daily_plan_id, true
  end
end
