class CreateCalendarSyncMappings < ActiveRecord::Migration[7.2]
  def change
    create_table :calendar_sync_mappings do |t|
      t.references :user, null: false, foreign_key: true
      t.string :syncable_type, null: false
      t.bigint :syncable_id, null: false
      t.string :google_event_id, null: false
      t.string :google_calendar_id, null: false
      t.datetime :last_synced_at
      t.string :etag
      t.timestamps

      t.index %i[user_id syncable_type syncable_id], unique: true, name: "idx_sync_mapping_unique"
      t.index %i[user_id google_event_id], unique: true, name: "idx_sync_mapping_event"
    end
  end
end
