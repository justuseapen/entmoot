# frozen_string_literal: true

class CreatePets < ActiveRecord::Migration[7.2]
  def change
    create_table :pets do |t|
      t.string :name, null: false
      t.string :pet_type
      t.string :avatar_url
      t.date :birthday
      t.text :notes
      t.references :family, null: false, foreign_key: true

      t.timestamps
    end

    add_index :pets, %i[family_id name], unique: true
  end
end
