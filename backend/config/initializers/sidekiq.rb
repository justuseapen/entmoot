# frozen_string_literal: true

require "sidekiq-scheduler"

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") }

  # Load scheduler configuration
  config.on(:startup) do
    schedule_config = YAML.load_file(Rails.root.join("config/sidekiq.yml"))
    if schedule_config[:scheduler]
      Sidekiq.schedule = schedule_config[:scheduler][:schedule]
      SidekiqScheduler::Scheduler.instance.reload_schedule!
    end
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") }
end
