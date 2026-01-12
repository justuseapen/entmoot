# frozen_string_literal: true

# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Load badge seeds (required for demo data)
load Rails.root.join("db/seeds/badges.rb")

# Load demo data (demo family with realistic sample data)
load Rails.root.join("db/seeds/demo_data.rb")
