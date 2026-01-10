# frozen_string_literal: true

# Ensure policies are autoloaded in development
# This fixes Zeitwerk autoloading issues with nested Scope classes
Rails.application.config.to_prepare do
  Rails.root.glob("app/policies/**/*.rb").each { |f| require f }
end
