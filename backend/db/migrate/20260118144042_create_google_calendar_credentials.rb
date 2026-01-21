class CreateGoogleCalendarCredentials < ActiveRecord::Migration[7.2]
  def change
    create_table :google_calendar_credentials do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.text :access_token, null: false
      t.text :refresh_token, null: false
      t.datetime :token_expires_at, null: false
      t.string :calendar_id, null: false
      t.string :calendar_name
      t.string :google_email
      t.datetime :last_sync_at
      t.string :sync_status, default: "active", null: false
      t.string :last_error
      t.timestamps
    end
  end
end
