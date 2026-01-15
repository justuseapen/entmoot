class CreateHabits < ActiveRecord::Migration[7.2]
  def change
    create_table :habits do |t|
      t.string :name, null: false
      t.integer :position, null: false
      t.boolean :is_active, null: false, default: true
      t.references :user, null: false, foreign_key: true
      t.references :family, null: false, foreign_key: true

      t.timestamps
    end

    add_index :habits, %i[user_id family_id position], unique: true
  end
end
