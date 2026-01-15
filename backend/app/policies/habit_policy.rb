# frozen_string_literal: true

class HabitPolicy < ApplicationPolicy
  def index?
    user.member_of?(record)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.where(user: user)
    end
  end
end
