# frozen_string_literal: true

class CreateFeedbackReports < ActiveRecord::Migration[7.2]
  def change
    create_table :feedback_reports do |t|
      # Core fields
      t.references :user, null: true, foreign_key: true # nullable for anonymous reports
      t.string :report_type, null: false, default: "bug"
      t.string :title, null: false
      t.text :description
      t.string :severity # for bugs: blocker, major, minor, cosmetic
      t.string :status, null: false, default: "new"

      # Context data captured automatically
      t.jsonb :context_data, null: false, default: {}
      # context_data includes: url, browser, os, screen_resolution, app_version, timestamp

      # Screenshot attachment handled by ActiveStorage

      # Contact preference
      t.boolean :allow_contact, null: false, default: false
      t.string :contact_email

      # Resolution tracking
      t.datetime :resolved_at

      t.timestamps
    end

    add_index :feedback_reports, :report_type
    add_index :feedback_reports, :status
    add_index :feedback_reports, :created_at
  end
end
