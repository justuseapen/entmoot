# frozen_string_literal: true

class AddManagementFieldsToFeedbackReports < ActiveRecord::Migration[7.2]
  def change
    change_table :feedback_reports, bulk: true do |t|
      # Admin user assigned to handle this feedback
      t.references :assigned_to, null: true, foreign_key: { to_table: :users }
      # Internal notes for admin discussion
      t.text :internal_notes
      # Reference to original feedback if this is a duplicate
      t.references :duplicate_of, null: true, foreign_key: { to_table: :feedback_reports }
    end
  end
end
