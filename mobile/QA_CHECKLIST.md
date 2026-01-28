# Entmoot Mobile App - QA Checklist

Pre-TestFlight QA checklist covering all 57 completed user stories.

---

## 1. Authentication Flows

### Login
- [ ] Email field accepts valid email format
- [ ] Password field masks input
- [ ] Show/hide password toggle works
- [ ] Login button disabled when fields empty
- [ ] Loading indicator shows during API call
- [ ] Invalid credentials shows error alert
- [ ] Successful login navigates to Today tab
- [ ] Session persists after app restart

### Registration
- [ ] Name field required
- [ ] Email field validates format
- [ ] Password field shows requirements (min 8 chars)
- [ ] Confirm password must match
- [ ] API validation errors display correctly
- [ ] Successful registration navigates to onboarding

### Forgot Password
- [ ] Email field validates format
- [ ] Success alert shows after submission
- [ ] Error for unregistered email
- [ ] Back navigation works

### Biometric Login
- [ ] Face ID prompt appears when enabled
- [ ] Touch ID works on supported devices
- [ ] Falls back to login screen if biometric fails
- [ ] Biometric preference persists

### Logout
- [ ] Logout confirmation alert appears
- [ ] Clears session and navigates to login
- [ ] Clears cached data

---

## 2. Onboarding

### Welcome Swipe Flow
- [ ] 4 pages swipeable
- [ ] Page indicators update on swipe
- [ ] Skip button navigates to family setup
- [ ] Get Started button on final page works

### Family Creation
- [ ] Create Family card selectable
- [ ] Name input required
- [ ] Auto-detects timezone
- [ ] Creates family and sets as current

### Family Join
- [ ] Join Family card selectable
- [ ] Invite code input works
- [ ] Invalid code shows error
- [ ] Successful join navigates to Today

### First Goal Prompt
- [ ] Modal appears for eligible users
- [ ] 3 suggested goals displayed
- [ ] Custom goal input works
- [ ] Create button saves goal
- [ ] Dismiss button hides modal

---

## 3. Daily Planning - Today Tab

### Header
- [ ] Correct date format (e.g., "Sunday, January 26")
- [ ] Greeting changes by time of day
- [ ] Completion badge shows X/Y completed
- [ ] Pull-to-refresh works

### Intention Section
- [ ] Displays current intention
- [ ] Placeholder shows when empty
- [ ] Tap enables editing
- [ ] Saves on blur
- [ ] Saving indicator shows

### Top 3 Priorities
- [ ] Displays up to 3 priorities
- [ ] Checkbox toggles completion
- [ ] Haptic feedback on toggle
- [ ] Swipe left reveals delete
- [ ] Delete removes priority
- [ ] Add button opens modal
- [ ] Add disabled when 3 exist
- [ ] Goal badge displays when linked

### Add Priority Modal
- [ ] Bottom sheet opens smoothly
- [ ] Title input required
- [ ] Goal picker shows user's goals
- [ ] Add button saves and closes
- [ ] Keyboard avoidance works

### Habits/Non-Negotiables
- [ ] Lists all user habits
- [ ] Checkbox toggles completion
- [ ] Haptic feedback on toggle
- [ ] Shows completion count
- [ ] Empty state guides to settings

### Tasks Section
- [ ] Lists daily tasks
- [ ] Checkbox toggles completion
- [ ] Swipe left reveals delete
- [ ] Assignee avatar shows
- [ ] Inline add task input
- [ ] Enter/return adds task

### Evening Reflection Banner
- [ ] Shows after 6 PM
- [ ] Hidden if shutdown_shipped has content
- [ ] Dismiss hides for session
- [ ] Tap opens reflection modal
- [ ] Modal has mood selector (5 options)
- [ ] "What shipped?" textarea
- [ ] "What blocked?" textarea
- [ ] Save updates daily plan

### Schedule/Calendar Section
- [ ] Shows permission prompt if not granted
- [ ] Lists today's calendar events
- [ ] All-day events at top
- [ ] Events sorted by time
- [ ] Calendar color dot displays
- [ ] Tap opens native calendar

---

## 4. Goals Tab

### Filter Tabs
- [ ] Daily, Weekly, Monthly, Quarterly, Annual tabs
- [ ] Tabs scroll horizontally
- [ ] Filter updates goal list
- [ ] Selected tab highlighted

### Goal Cards
- [ ] Title displays
- [ ] Progress bar shows percentage
- [ ] Status badge with correct color
- [ ] Due date displays
- [ ] Tap navigates to detail

### Create Goal
- [ ] FAB navigates to create screen
- [ ] Title input required
- [ ] Description multiline
- [ ] Time scale segmented control
- [ ] Date picker works
- [ ] Visibility radio options
- [ ] Assignee multi-select
- [ ] Create button saves

### AI Refinement
- [ ] "Refine with AI" button works
- [ ] Loading modal shows "AI is thinking..."
- [ ] SMART suggestions display
- [ ] Accept/Reject per section
- [ ] Apply All button works

### Goal Detail
- [ ] Title and description display
- [ ] Progress slider (0-100)
- [ ] Status picker dropdown
- [ ] SMART breakdown section
- [ ] Child goals display
- [ ] Assignees with avatars
- [ ] Edit button works
- [ ] Delete with confirmation

### Empty State
- [ ] Shows illustration
- [ ] "Create your first goal" message
- [ ] Action button works

---

## 5. Me Tab

### Profile Header
- [ ] Avatar or initials display
- [ ] Name displays
- [ ] Email displays

### Streaks Section
- [ ] Daily planning streak
- [ ] Evening reflection streak
- [ ] Weekly review streak
- [ ] Fire emoji with count
- [ ] At-risk indicator shows
- [ ] Milestone highlighting

### Points Section
- [ ] Total points display
- [ ] This week points
- [ ] Animated counter on increase

### Badges Section
- [ ] Recent 3 badges display
- [ ] Badge icon/emoji
- [ ] Badge name
- [ ] Tap shows detail modal

### Quick Links
- [ ] Settings link
- [ ] Manage Habits link
- [ ] Notifications link
- [ ] Family link
- [ ] All navigate correctly

### Logout
- [ ] Logout button at bottom
- [ ] Confirmation alert
- [ ] Clears session

---

## 6. Settings

### Account Section
- [ ] Edit Profile row navigates
- [ ] Change Password row (if implemented)

### Profile Editing
- [ ] Avatar selection (camera/library)
- [ ] Name input editable
- [ ] Save updates profile
- [ ] Avatar persists

### Notifications Section
- [ ] Navigates to notification settings
- [ ] Morning planning toggle
- [ ] Evening reflection toggle
- [ ] Weekly review toggle
- [ ] Time pickers work
- [ ] Quiet hours section
- [ ] Day picker for weekly review

### Security Section
- [ ] Biometric login toggle
- [ ] Shows Face ID or Touch ID label
- [ ] Toggle enables/disables

### Family Management
- [ ] Lists all user families
- [ ] Current family has checkmark
- [ ] Tap switches family
- [ ] Members list with role badges
- [ ] Invite button (admin/adult only)
- [ ] Invite modal with email/role

### Google Calendar
- [ ] Connection status displays
- [ ] Connect button opens OAuth
- [ ] Deep link callback works
- [ ] Synced calendars list
- [ ] Disconnect button works

### About Section
- [ ] Version number displays
- [ ] Terms link opens
- [ ] Privacy link opens

### Delete Account
- [ ] Red text styling
- [ ] First confirmation alert
- [ ] Second confirmation alert
- [ ] Deletes and logs out

---

## 7. Habits Management

- [ ] Lists all habits
- [ ] Drag handle visible
- [ ] Long press enables drag
- [ ] Drag reorders list
- [ ] New order persists
- [ ] Swipe left reveals delete
- [ ] Delete confirmation
- [ ] Tap enables inline edit
- [ ] Edit saves on blur
- [ ] Add habit button
- [ ] 10 habit limit enforced

---

## 8. Weekly Review

- [ ] Metrics card displays
- [ ] Task completion %
- [ ] Goal progress
- [ ] Habit tally
- [ ] Wins Shipped section
- [ ] Losses/Friction section
- [ ] Metrics Notes section
- [ ] System to Adjust section
- [ ] Auto-save on blur
- [ ] Debounced save (500ms)
- [ ] Saving indicator per field

---

## 9. Quick Reflection

- [ ] Mood selector (5 emojis)
- [ ] Mood label displays
- [ ] Energy slider (1-5)
- [ ] Energy labels display
- [ ] Thoughts textarea
- [ ] Gratitude items list
- [ ] Add gratitude button
- [ ] Save creates reflection
- [ ] Success alert
- [ ] Navigates back

---

## 10. Offline & Sync

### Offline Indicator
- [ ] Banner shows when offline
- [ ] "You're offline" message
- [ ] Animated slide in/out

### Sync Queue
- [ ] Changes queued when offline
- [ ] "Syncing..." shows when processing
- [ ] "Synced ✓" shows briefly on success
- [ ] Pending sync dot on items

### Conflict Resolution
- [ ] Detects server newer data
- [ ] Shows conflict alert
- [ ] Refetches on reconnect

---

## 11. Push Notifications

### Permission
- [ ] Permission request on first launch
- [ ] Explanation text displays
- [ ] Handles denied state

### Local Scheduling
- [ ] Morning planning reminder
- [ ] Evening reflection reminder
- [ ] Weekly review reminder
- [ ] Respects quiet hours
- [ ] Reschedules on preference change

### Tap Navigation
- [ ] Reminder → Today tab
- [ ] Goal update → Goal detail
- [ ] Family invite → Family settings
- [ ] Badge earned → Me tab

### In-App Banner
- [ ] Shows for foreground notifications
- [ ] Animated entrance/exit
- [ ] Tap navigates correctly
- [ ] Auto-dismisses

---

## 12. Gamification

### Achievement Modal
- [ ] Confetti animation plays
- [ ] Achievement icon displays
- [ ] Points earned shows
- [ ] "Awesome!" button dismisses
- [ ] Haptic feedback

### Badge Animations
- [ ] Newly earned badge has shine
- [ ] Locked badges grayscale
- [ ] Detail modal spring animation

### Streak Milestones
- [ ] 7, 14, 30, 60, 90, 180, 365 highlighted
- [ ] Special styling for milestones

---

## 13. Error Handling

- [ ] Network error shows message
- [ ] Retry button on errors
- [ ] Loading states display
- [ ] Empty states display
- [ ] Form validation errors
- [ ] API error messages
- [ ] Error boundary catches crashes
- [ ] Recovery UI shows

---

## 14. Navigation & UX

- [ ] Tab bar navigation works
- [ ] Stack navigation with back
- [ ] Swipe back gesture (iOS)
- [ ] Deep links work
- [ ] Safe area insets correct
- [ ] Keyboard avoidance
- [ ] Pull-to-refresh
- [ ] Haptic feedback throughout

---

## 15. App Store Readiness

### Icons & Splash
- [ ] App icon displays on home screen
- [ ] Splash screen shows on launch
- [ ] Correct branding colors

### Metadata
- [ ] Bundle ID: com.entmoot.mobile
- [ ] Version: 1.0.0
- [ ] Build number set

### Permissions
- [ ] Calendar permission prompt
- [ ] Camera permission prompt
- [ ] Photo library permission
- [ ] Notification permission

---

## 16. Performance

- [ ] App launches in < 3 seconds
- [ ] Tab switches feel instant
- [ ] Scroll performance smooth
- [ ] No memory warnings
- [ ] Background properly handled

---

## 17. Device Compatibility

- [ ] iPhone SE (small screen)
- [ ] iPhone 14/15 (standard)
- [ ] iPhone 14/15 Pro Max (large)
- [ ] iOS 14.0 minimum
- [ ] iOS 17+ features work
- [ ] Face ID devices
- [ ] Touch ID devices

---

## 18. Accessibility (Bonus)

- [ ] VoiceOver navigation
- [ ] Dynamic Type support
- [ ] Sufficient color contrast
- [ ] Touch targets 44x44 minimum

---

## Critical Bugs Found

| Bug | Severity | Screen | Notes |
|-----|----------|--------|-------|
| | | | |

---

## Screenshots Captured

- [ ] Login screen
- [ ] Today tab (populated)
- [ ] Goals list
- [ ] Goal detail with AI
- [ ] Me tab with streaks
- [ ] Settings
- [ ] Onboarding welcome

---

## Sign-off

- [ ] QA Complete
- [ ] Critical bugs fixed
- [ ] Screenshots captured
- [ ] Ready for TestFlight

**QA Date:** ___________
**Tester:** ___________
