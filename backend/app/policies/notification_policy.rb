# frozen_string_literal: true

class NotificationPolicy < ApplicationPolicy
  def index?
    true
  end

  def mark_as_read?
    record.user_id == user.id
  end

  def mark_all_as_read?
    true
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(user: user)
    end
  end
end
