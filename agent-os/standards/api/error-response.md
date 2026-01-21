# API Error Response Format

All API errors use this structured format:

```json
{ "error": "Main message", "errors": ["Detail 1", "Detail 2"], "suggestion": "Helpful hint" }
```

## Rules
- `error` — Always present, user-friendly main message
- `errors` — Array of detailed messages (validation errors use full_messages)
- `suggestion` — Optional helpful hint for resolution

## Usage in Controllers

```ruby
# Single error
render_error("Something went wrong", status: :unprocessable_content, suggestion: "Try again")

# Validation errors
render_validation_errors(@goal)

# Not found
render_not_found("Goal")
```

Use `ErrorResponse` concern methods — don't manually construct error hashes.
