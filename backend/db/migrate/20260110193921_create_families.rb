# frozen_string_literal: true

class CreateFamilies < ActiveRecord::Migration[7.2]
  def change
    create_table :families do |t|
      t.string :name, null: false
      t.string :timezone, null: false, default: "UTC"
      t.jsonb :settings, null: false, default: {}

      t.timestamps
    end
  end
end
