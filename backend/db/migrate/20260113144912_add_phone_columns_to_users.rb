class AddPhoneColumnsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :phone_number, :string
    add_column :users, :phone_verified, :boolean, default: false, null: false
    add_index :users, :phone_number, unique: true, where: "phone_number IS NOT NULL"
  end
end
