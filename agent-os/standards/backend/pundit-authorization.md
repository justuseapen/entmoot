# Pundit Family-Based Authorization

All resources are scoped to families. Users access resources through family membership.

## Policy Structure

```ruby
class GoalPolicy < ApplicationPolicy
  def show?
    member? && record.visible_to?(user)
  end

  def create?
    can_manage_goals?
  end

  private

  def family
    record.is_a?(Goal) ? record.family : record
  end

  def member?
    user.member_of?(family)
  end

  def membership
    @membership ||= user.membership_for(family)
  end

  def can_manage_goals?
    membership&.can_manage_goals?
  end
end
```

## Key Patterns

1. **Always check membership first** — `member?` before any other checks
2. **Scope queries in index** — Use `policy_scope(Model)` not raw queries
3. **Role-based permissions** — Check `membership.can_*?` methods for role abilities
4. **Cache membership lookup** — Use `@membership ||=` to avoid repeated queries

## Scope Pattern

```ruby
class Scope < ApplicationPolicy::Scope
  def resolve
    scope.joins(:family_memberships)
         .where(family_memberships: { user_id: user.id })
  end
end
```
