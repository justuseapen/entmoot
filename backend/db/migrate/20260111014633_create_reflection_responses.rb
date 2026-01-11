# frozen_string_literal: true

class CreateReflectionResponses < ActiveRecord::Migration[7.2]
  def change
    create_table :reflection_responses do |t|
      t.references :reflection, null: false, foreign_key: true
      t.string :prompt, null: false
      t.text :response

      t.timestamps
    end

    add_index :reflection_responses, %i[reflection_id prompt], unique: true
  end
end
