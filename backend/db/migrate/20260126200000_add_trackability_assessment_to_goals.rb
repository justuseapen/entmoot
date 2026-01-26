# frozen_string_literal: true

class AddTrackabilityAssessmentToGoals < ActiveRecord::Migration[7.2]
  def change
    add_column :goals, :trackability_assessment, :jsonb, default: {}
    add_column :goals, :trackability_assessed_at, :datetime
  end
end
