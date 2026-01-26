# Issue #13: Daily Cards for Each Family Member

## Current State Analysis

### Data Model
- **Already supports per-user daily plans** via `DailyPlan` model
- Unique constraint: `date + user_id + family_id`
- Each family member can have their own daily plan for a given date
- Controller currently scopes queries to `current_user` only

### Roles & Permissions
- `admin` and `adult` roles have elevated privileges
- Child, teen, observer have restricted access
- No explicit "view other members' plans" permission exists yet

## Problem Statement

1. Each family member needs their own daily planning card
2. Parents (admin/adult roles) want visibility into family members' daily cards
3. Current UI only shows the current user's plan

## Proposed Solution

### Backend Changes

#### 1. DailyPlanPolicy Updates
Add authorization rules in `app/policies/daily_plan_policy.rb`:
```ruby
def show?
  # Can view own plans
  return true if record.user_id == user.id

  # Admins and adults can view family members' plans
  membership = user.family_memberships.find_by(family_id: record.family_id)
  membership&.admin? || membership&.adult?
end

def update?
  # Can only update own plans
  record.user_id == user.id
end
```

#### 2. Controller Updates
`app/controllers/api/v1/daily_plans_controller.rb`:
- Add optional `user_id` query parameter to `index` action
- Add optional `user_id` query parameter to `today` action
- Respect authorization policy in both actions

Example:
```ruby
def today
  authorize @family, policy_class: DailyPlanPolicy

  target_user = determine_target_user
  @daily_plan = DailyPlan.find_or_create_for_today(user: target_user, family: @family)
  authorize @daily_plan  # Check if current_user can view this plan

  render json: daily_plan_response(@daily_plan)
end

private

def determine_target_user
  if params[:user_id].present? && can_view_other_members?
    @family.users.find(params[:user_id])
  else
    current_user
  end
end

def can_view_other_members?
  membership = current_user.family_memberships.find_by(family_id: @family.id)
  membership&.admin? || membership&.adult?
end
```

### Frontend Changes

#### 3. New Hook: `useFamilyMembers`
Create `hooks/useFamilyMembers.ts` to fetch family members list:
```typescript
export function useFamilyMembers(familyId: number) {
  return useQuery({
    queryKey: ["families", familyId, "members"],
    queryFn: () => apiFetch(`/families/${familyId}/members`),
    enabled: !!familyId,
  });
}
```

#### 4. Update DailyPlanner Component
Add family member selector for admin/adult users:

```tsx
// If user is admin/adult, show member selector dropdown
{canViewOtherMembers && (
  <div className="mb-6">
    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
      <SelectTrigger>
        <SelectValue placeholder="Select family member" />
      </SelectTrigger>
      <SelectContent>
        {familyMembers.map(member => (
          <SelectItem key={member.id} value={member.id}>
            {member.name} {member.id === currentUserId ? "(You)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
```

#### 5. Update API Calls
Modify `getTodaysPlan` to accept optional `userId`:
```typescript
export async function getTodaysPlan(
  familyId: number,
  userId?: number
): Promise<DailyPlan> {
  const params = userId ? `?user_id=${userId}` : "";
  return apiFetch<DailyPlan>(
    `/families/${familyId}/daily_plans/today${params}`
  );
}
```

#### 6. Read-Only Mode for Other Members' Plans
When viewing another family member's plan:
- Display banner: "Viewing [Name]'s Daily Plan"
- Make all fields read-only (similar to historical view)
- Hide save controls

### Testing Requirements

#### Backend Tests
- Request spec: Admin can view child's daily plan
- Request spec: Adult can view teen's daily plan
- Request spec: Child cannot view parent's daily plan
- Request spec: User cannot update another member's plan

#### Frontend Tests (Manual)
1. Login as admin/adult
2. See family member dropdown
3. Select another member
4. View their plan (read-only)
5. Verify cannot edit
6. Login as child/teen
7. Verify no dropdown shown
8. Verify can only see own plan

## Implementation Phases

### Phase 1: Backend Authorization (Estimated: 2-3 hours)
- [ ] Update `DailyPlanPolicy` with new rules
- [ ] Add `user_id` parameter support to controller
- [ ] Write request specs for authorization
- [ ] Test with different role combinations

### Phase 2: API Enhancement (Estimated: 1-2 hours)
- [ ] Update `getTodaysPlan` to accept `userId`
- [ ] Update `getDailyPlans` to accept `userId` filter
- [ ] Update `useTodaysPlan` hook signature
- [ ] Update TypeScript types

### Phase 3: UI Implementation (Estimated: 3-4 hours)
- [ ] Create `useFamilyMembers` hook
- [ ] Add member selector to DailyPlanner
- [ ] Implement read-only mode for other members' plans
- [ ] Add "Viewing [Name]'s Plan" banner
- [ ] Show "Switch to your plan" button
- [ ] Handle edge cases (no family members, etc.)

### Phase 4: Polish & Testing (Estimated: 2-3 hours)
- [ ] Manual QA with different roles
- [ ] Accessibility review (keyboard navigation, screen readers)
- [ ] Mobile responsiveness check
- [ ] Error handling (member not found, etc.)

## Total Estimated Effort: 8-12 hours

## Alternative: Dashboard View
Instead of a dropdown, could create a dedicated "Family Dashboard" page showing cards for all family members side-by-side. This would be more visual but higher effort (~16-20 hours).

## Security Considerations
- Ensure Pundit policy is always checked before returning plans
- Log access to other members' plans for audit trail
- Consider adding a "view_history" table to track who viewed whose plans

## Future Enhancements
- Email digest: "Your family's daily plans for today"
- Notification when family member completes their plan
- Shared family goals visible across all member plans
- Weekly comparison: "How did our family do this week?"
