# Service Classes

Business logic lives in `app/services/`. Controllers stay thin.

## Two Styles

**Class methods** — Stateless operations, no initialization needed:

```ruby
class NotificationService
  def self.create_and_broadcast(user:, title:, body: nil)
    # ...
  end
end

# Usage
NotificationService.create_and_broadcast(user: user, title: "Hello")
```

**Instance methods** — When initialized with context/state:

```ruby
class GoalRefinementService
  def initialize(goal)
    @goal = goal
    @client = AnthropicClient.new
  end

  def refine
    # Uses @goal and @client
  end
end

# Usage
GoalRefinementService.new(@goal).refine
```

## When to Use Each
- **Class methods** — Simple operations, no shared state between calls
- **Instance methods** — Complex operations with initialization, external clients, or stateful processing

## Error Handling

Define domain-specific errors inside the service:

```ruby
class GoalRefinementService
  class RefinementError < StandardError; end

  def refine
    # ...
  rescue AnthropicClient::ApiError => e
    raise RefinementError, e.message
  end
end
```
