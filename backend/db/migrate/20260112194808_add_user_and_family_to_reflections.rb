class AddUserAndFamilyToReflections < ActiveRecord::Migration[7.2]
  def change
    add_reference :reflections, :user, null: true, foreign_key: true
    add_reference :reflections, :family, null: true, foreign_key: true
  end
end
