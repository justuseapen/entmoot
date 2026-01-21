# Controller Response Builders

Use private `*_response` methods to build complex JSON responses.

## Pattern

```ruby
class GoalsController < BaseController
  def show
    render json: { goal: goal_response(@goal) }
  end

  private

  def goal_response(goal, include_smart: false)
    base_goal_response(goal).merge(include_smart ? smart_fields(goal) : {})
  end

  def base_goal_response(goal)
    goal_attributes(goal).merge(goal_relations(goal))
  end

  def user_response(user)
    { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url }
  end
end
```

## When to Use
- **Builder methods** — Nested objects, related records, conditional fields
- **Inline JSON** — Simple responses like `{ message: "Deleted successfully." }`

## Naming
- `*_response` for the full serialized object
- `*_attributes` for model fields only
- `*_relations` for associated records
