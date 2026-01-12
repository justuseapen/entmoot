class AddLastNpsPromptDateToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :last_nps_prompt_date, :datetime
  end
end
