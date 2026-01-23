# PRD: Entmoot React Native Mobile App

## Introduction

Build a native iOS mobile application for Entmoot using React Native (Expo managed workflow) that provides a mobile-first experience for family planning. The app focuses on mobile-exclusive features like push notifications, offline sync, and biometric authentication while delivering core functionality: daily planning, habit tracking, goal management, reflections, and gamification.

The existing Rails backend API is fully ready with 100+ endpoints covering all required functionality. This PRD focuses on the mobile client implementation.

## Goals

- Deliver a polished iOS app optimized for mobile-first daily planning workflows
- Enable offline usage with automatic background sync when connectivity returns
- Leverage mobile capabilities: push notifications, biometric auth, haptic feedback
- Integrate with device calendar and Google Calendar
- Provide gamification feedback (streaks, points, badges) to drive engagement
- Support the existing backend API without modifications

## Technical Stack

- **Framework**: React Native with Expo SDK 52+ (managed workflow)
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand (client), TanStack Query (server)
- **Navigation**: Expo Router (file-based routing)
- **UI Components**: React Native Paper or Tamagui (cross-platform design system)
- **Offline Storage**: WatermelonDB or MMKV + custom sync
- **Auth Storage**: expo-secure-store
- **Push Notifications**: expo-notifications + APNs
- **Calendar**: expo-calendar
- **Biometrics**: expo-local-authentication

## User Stories

---

### Phase 1: Project Foundation

---

### US-001: Initialize Expo Project
**Description:** As a developer, I need a properly configured Expo project so that I can build the mobile app.

**Acceptance Criteria:**
- [ ] Create new Expo project with `npx create-expo-app@latest mobile --template tabs`
- [ ] Configure TypeScript strict mode in tsconfig.json
- [ ] Set up path aliases (`@/` for `src/`)
- [ ] Configure app.json with bundle identifier `com.entmoot.mobile`
- [ ] Set minimum iOS deployment target to 14.0
- [ ] Add .gitignore for React Native/Expo
- [ ] Project builds successfully with `npx expo start`
- [ ] Typecheck passes with `npx tsc --noEmit`

---

### US-002: Configure Development Environment
**Description:** As a developer, I need linting, formatting, and testing configured so that code quality is maintained.

**Acceptance Criteria:**
- [ ] Install and configure ESLint with React Native rules
- [ ] Install and configure Prettier
- [ ] Install Jest and React Native Testing Library
- [ ] Add npm scripts: `lint`, `format`, `test`, `typecheck`
- [ ] Create `.env.example` with `API_URL=http://localhost:3000`
- [ ] Install `react-native-dotenv` for environment variables
- [ ] All scripts run without errors
- [ ] Typecheck passes

---

### US-003: Set Up Navigation Structure
**Description:** As a developer, I need the navigation structure defined so that users can move between screens.

**Acceptance Criteria:**
- [ ] Configure Expo Router with file-based routing
- [ ] Create auth group `(auth)` with: login, register, forgot-password screens
- [ ] Create main group `(tabs)` with: today, goals, me tabs
- [ ] Create stack screens: onboarding, family-setup, settings, goal-detail, reflection
- [ ] Implement auth guard that redirects unauthenticated users to login
- [ ] Tab bar shows icons and labels for Today, Goals, Me
- [ ] Navigation works between all placeholder screens
- [ ] Typecheck passes

---

### US-004: Create Design System Foundation
**Description:** As a developer, I need reusable UI components so that the app has consistent styling.

**Acceptance Criteria:**
- [ ] Install React Native Paper or Tamagui
- [ ] Create theme with Entmoot brand colors (primary, secondary, success, warning, error)
- [ ] Create Typography components: H1, H2, H3, Body, Caption
- [ ] Create Button component with variants: primary, secondary, outline, ghost
- [ ] Create Card component with shadow and rounded corners
- [ ] Create Input component with label, error state, and helper text
- [ ] Create LoadingSpinner component
- [ ] All components are typed with TypeScript
- [ ] Typecheck passes

---

### Phase 2: Authentication

---

### US-005: Implement Secure Storage Service
**Description:** As a developer, I need secure storage for auth tokens so that user sessions are protected.

**Acceptance Criteria:**
- [ ] Create `src/services/secureStorage.ts` using expo-secure-store
- [ ] Implement `setItem(key, value)`, `getItem(key)`, `removeItem(key)` functions
- [ ] Store session cookie/token securely
- [ ] Handle storage errors gracefully
- [ ] Add storage keys constants: `SESSION_TOKEN`, `USER_DATA`, `FAMILY_ID`
- [ ] Typecheck passes

---

### US-006: Create API Client
**Description:** As a developer, I need an API client configured for the Rails backend so that I can make authenticated requests.

**Acceptance Criteria:**
- [ ] Create `src/lib/api.ts` with fetch wrapper
- [ ] Configure base URL from environment variable
- [ ] Implement request interceptor to attach session cookie/token
- [ ] Implement response interceptor to handle 401 (logout user)
- [ ] Create typed API methods: `get<T>`, `post<T>`, `patch<T>`, `delete<T>`
- [ ] Handle network errors with user-friendly messages
- [ ] Export QueryClient configured for TanStack Query
- [ ] Typecheck passes

---

### US-007: Implement Auth Store
**Description:** As a developer, I need an auth store so that authentication state is managed globally.

**Acceptance Criteria:**
- [ ] Create `src/stores/authStore.ts` using Zustand
- [ ] Store: `user`, `isAuthenticated`, `isLoading`, `currentFamilyId`
- [ ] Actions: `login`, `logout`, `register`, `setCurrentFamily`, `refreshUser`
- [ ] Persist user data to secure storage on login
- [ ] Hydrate from secure storage on app launch
- [ ] Clear storage on logout
- [ ] Typecheck passes

---

### US-008: Build Login Screen
**Description:** As a user, I want to log in with email and password so that I can access my account.

**Acceptance Criteria:**
- [ ] Create `app/(auth)/login.tsx`
- [ ] Email input with keyboard type `email-address`
- [ ] Password input with secure text entry and show/hide toggle
- [ ] "Log In" button calls `POST /api/v1/auth/login`
- [ ] Show loading state during API call
- [ ] Display error messages for invalid credentials
- [ ] Link to "Forgot Password?" screen
- [ ] Link to "Create Account" screen
- [ ] On success, store session and navigate to main app
- [ ] Typecheck passes

---

### US-009: Build Registration Screen
**Description:** As a new user, I want to create an account so that I can start using Entmoot.

**Acceptance Criteria:**
- [ ] Create `app/(auth)/register.tsx`
- [ ] Name input (required)
- [ ] Email input with validation (required)
- [ ] Password input with requirements shown (min 8 chars)
- [ ] Password confirmation input
- [ ] "Create Account" button calls `POST /api/v1/auth/register`
- [ ] Show loading state during API call
- [ ] Display validation errors from API
- [ ] Link back to login screen
- [ ] On success, store session and navigate to onboarding
- [ ] Typecheck passes

---

### US-010: Build Forgot Password Screen
**Description:** As a user, I want to reset my password so that I can regain access to my account.

**Acceptance Criteria:**
- [ ] Create `app/(auth)/forgot-password.tsx`
- [ ] Email input
- [ ] "Send Reset Link" button calls `POST /api/v1/auth/password`
- [ ] Show success message: "Check your email for reset instructions"
- [ ] Show error for unregistered email
- [ ] Link back to login screen
- [ ] Typecheck passes

---

### US-011: Implement Biometric Authentication
**Description:** As a user, I want to use Face ID to log in so that access is faster and more secure.

**Acceptance Criteria:**
- [ ] Install expo-local-authentication
- [ ] Create `src/services/biometrics.ts`
- [ ] Check if biometrics available on device
- [ ] Prompt for biometric auth on app foreground (if enabled)
- [ ] Store biometric preference in secure storage
- [ ] Add toggle in settings to enable/disable biometric login
- [ ] Fall back to password if biometric fails
- [ ] Typecheck passes

---

### Phase 3: Onboarding & Family Setup

---

### US-012: Build Onboarding Flow - Welcome
**Description:** As a new user, I want to see a welcome screen so that I understand what Entmoot offers.

**Acceptance Criteria:**
- [ ] Create `app/onboarding/index.tsx` with swipeable pages
- [ ] Page 1: Welcome message with app logo
- [ ] Page 2: "Plan Your Day" - daily planning benefit
- [ ] Page 3: "Track Habits" - habit tracking benefit
- [ ] Page 4: "Achieve Goals" - goal setting benefit
- [ ] Page indicators showing current position
- [ ] "Get Started" button on final page
- [ ] Skip button to bypass onboarding
- [ ] Smooth animations between pages
- [ ] Typecheck passes

---

### US-013: Build Family Setup Screen
**Description:** As a new user, I want to create or join a family so that I can start planning.

**Acceptance Criteria:**
- [ ] Create `app/onboarding/family-setup.tsx`
- [ ] Option A: "Create a Family" - shows name input
- [ ] Option B: "Join a Family" - shows invitation code input
- [ ] Create family calls `POST /api/v1/families`
- [ ] Join family calls `POST /api/v1/invitations/:token/accept`
- [ ] Auto-detect timezone from device
- [ ] Show loading states during API calls
- [ ] Navigate to main app on success
- [ ] Typecheck passes

---

### US-014: Build First Goal Prompt
**Description:** As a new user, I want guidance to create my first goal so that I understand how goal-setting works.

**Acceptance Criteria:**
- [ ] Check `GET /api/v1/users/me/first_goal_prompt` for eligibility
- [ ] Show modal with AI-generated goal suggestions
- [ ] Allow user to select a suggestion or write custom goal
- [ ] Create goal via `POST /api/v1/families/:id/goals`
- [ ] Allow dismissing the prompt
- [ ] Track first_actions.goal_created in user model
- [ ] Typecheck passes

---

### Phase 4: Daily Planning (Core Feature)

---

### US-015: Create Daily Plan Data Layer
**Description:** As a developer, I need data fetching hooks for daily plans so that screens can display planning data.

**Acceptance Criteria:**
- [ ] Create `src/hooks/useDailyPlan.ts` with TanStack Query
- [ ] `useTodayPlan()` - fetches `GET /api/v1/families/:id/daily_plans/today`
- [ ] `useUpdateDailyPlan()` - mutation for `PATCH /api/v1/families/:id/daily_plans/:id`
- [ ] Include nested: daily_tasks, top_priorities, habit_completions
- [ ] Optimistic updates for task completion
- [ ] Invalidate queries on mutation success
- [ ] Typecheck passes

---

### US-016: Build Today Screen - Header
**Description:** As a user, I want to see today's date and my planning progress so that I know my status.

**Acceptance Criteria:**
- [ ] Create `app/(tabs)/today.tsx`
- [ ] Display current date formatted as "Wednesday, January 22"
- [ ] Show greeting based on time of day (Good morning/afternoon/evening)
- [ ] Display completion percentage badge (e.g., "3/5 completed")
- [ ] Pull-to-refresh to reload daily plan
- [ ] Typecheck passes

---

### US-017: Build Today Screen - Intention Section
**Description:** As a user, I want to set my daily intention so that I stay focused on what matters.

**Acceptance Criteria:**
- [ ] Show "Today's Intention" section at top
- [ ] Display current intention if set
- [ ] Tap to edit intention inline
- [ ] Save intention via daily plan update API
- [ ] Placeholder text: "What's your focus for today?"
- [ ] Typecheck passes

---

### US-018: Build Today Screen - Top Priorities
**Description:** As a user, I want to see and manage my top 3 priorities so that I focus on important tasks.

**Acceptance Criteria:**
- [ ] Display "Top Priorities" section with up to 3 items
- [ ] Each priority shows checkbox, title, optional linked goal
- [ ] Tap checkbox to toggle completion with haptic feedback
- [ ] Swipe left to delete priority
- [ ] "Add Priority" button (disabled if 3 exist)
- [ ] Drag to reorder priorities
- [ ] Save changes via daily plan update API
- [ ] Typecheck passes

---

### US-019: Build Today Screen - Habits Section
**Description:** As a user, I want to track my daily habits so that I maintain consistency.

**Acceptance Criteria:**
- [ ] Display "Habits" section (labeled "Non-Negotiables")
- [ ] List all active habits from `GET /api/v1/families/:id/habits`
- [ ] Each habit shows checkbox and name
- [ ] Tap checkbox to toggle completion with haptic feedback
- [ ] Completion updates habit_completions in daily plan
- [ ] Show streak count badge next to each habit if > 0
- [ ] Visual distinction for completed vs incomplete habits
- [ ] Typecheck passes

---

### US-020: Build Today Screen - Tasks Section
**Description:** As a user, I want to manage additional tasks so that I track everything I need to do.

**Acceptance Criteria:**
- [ ] Display "Tasks" section below habits
- [ ] List all daily_tasks from the daily plan
- [ ] Each task shows checkbox, title, optional assignee avatar
- [ ] Tap checkbox to toggle completion
- [ ] Swipe left to delete task
- [ ] "Add Task" inline input at bottom
- [ ] Quick-add: press enter to add and clear input
- [ ] Show yesterday's incomplete tasks with "Carry over?" prompt
- [ ] Typecheck passes

---

### US-021: Build Add Priority Modal
**Description:** As a user, I want to add a new priority so that I can plan my focus areas.

**Acceptance Criteria:**
- [ ] Create bottom sheet modal for adding priority
- [ ] Title input (required)
- [ ] Optional goal picker (dropdown of user's goals)
- [ ] "Add" button saves via daily plan update API
- [ ] Close modal on success
- [ ] Keyboard-aware: modal adjusts when keyboard shows
- [ ] Typecheck passes

---

### US-022: Build End-of-Day Reflection Prompt
**Description:** As a user, I want to be prompted for evening reflection so that I close out my day mindfully.

**Acceptance Criteria:**
- [ ] Show reflection prompt after 6 PM if not completed
- [ ] Prompt appears as dismissible banner at top of Today screen
- [ ] Tap opens reflection modal
- [ ] Modal has: "What shipped?" and "What blocked you?" text inputs
- [ ] Save updates `shutdown_shipped` and `shutdown_blocked` fields
- [ ] Show mood selector (5 emoji options)
- [ ] Track evening reflection streak
- [ ] Typecheck passes

---

### Phase 5: Habits Management

---

### US-023: Create Habits Data Layer
**Description:** As a developer, I need data fetching hooks for habits so that screens can display and manage habits.

**Acceptance Criteria:**
- [ ] Create `src/hooks/useHabits.ts` with TanStack Query
- [ ] `useHabits()` - fetches `GET /api/v1/families/:id/habits`
- [ ] `useCreateHabit()` - mutation for `POST /api/v1/families/:id/habits`
- [ ] `useUpdateHabit()` - mutation for `PATCH /api/v1/families/:id/habits/:id`
- [ ] `useDeleteHabit()` - mutation for `DELETE /api/v1/families/:id/habits/:id`
- [ ] `useReorderHabits()` - mutation for `POST /api/v1/families/:id/habits/update_positions`
- [ ] Typecheck passes

---

### US-024: Build Habits Management Screen
**Description:** As a user, I want to manage my habits so that I can customize my daily tracking.

**Acceptance Criteria:**
- [ ] Create `app/settings/habits.tsx`
- [ ] List all habits with drag handles for reordering
- [ ] Swipe left to delete with confirmation
- [ ] Tap habit to edit name inline
- [ ] "Add Habit" button at bottom
- [ ] Save order changes via reorder API
- [ ] Maximum 10 habits enforced
- [ ] Typecheck passes

---

### Phase 6: Goals Management

---

### US-025: Create Goals Data Layer
**Description:** As a developer, I need data fetching hooks for goals so that screens can display and manage goals.

**Acceptance Criteria:**
- [ ] Create `src/hooks/useGoals.ts` with TanStack Query
- [ ] `useGoals(filters)` - fetches `GET /api/v1/families/:id/goals` with query params
- [ ] `useGoal(id)` - fetches single goal
- [ ] `useCreateGoal()` - mutation for creating goals
- [ ] `useUpdateGoal()` - mutation for updating goals
- [ ] `useDeleteGoal()` - mutation for deleting goals
- [ ] `useRefineGoal()` - mutation for AI refinement
- [ ] Support filtering by: time_scale, status, visibility, assignee_id
- [ ] Typecheck passes

---

### US-026: Build Goals List Screen
**Description:** As a user, I want to see all my goals so that I can track my progress.

**Acceptance Criteria:**
- [ ] Create `app/(tabs)/goals.tsx`
- [ ] Filter tabs: Daily, Weekly, Monthly, Quarterly, Annual
- [ ] Each goal card shows: title, progress bar, due date, status badge
- [ ] Color-code status: green (completed), yellow (in progress), red (at risk)
- [ ] Tap goal to navigate to detail screen
- [ ] Floating "+" button to create new goal
- [ ] Pull-to-refresh to reload goals
- [ ] Empty state with illustration when no goals
- [ ] Typecheck passes

---

### US-027: Build Goal Detail Screen
**Description:** As a user, I want to view and edit a goal so that I can track and update my progress.

**Acceptance Criteria:**
- [ ] Create `app/goal/[id].tsx`
- [ ] Display: title, description, progress, due date, status
- [ ] Show SMART breakdown if populated (specific, measurable, achievable, relevant, time_bound)
- [ ] Progress slider to update completion percentage
- [ ] Status picker dropdown
- [ ] Edit button to modify goal details
- [ ] Delete button with confirmation
- [ ] Show child goals if any (hierarchical)
- [ ] Show assigned family members
- [ ] Typecheck passes

---

### US-028: Build Create Goal Screen
**Description:** As a user, I want to create a new goal so that I can track what I want to achieve.

**Acceptance Criteria:**
- [ ] Create `app/goal/create.tsx`
- [ ] Title input (required)
- [ ] Description textarea (optional)
- [ ] Time scale picker: Daily, Weekly, Monthly, Quarterly, Annual
- [ ] Due date picker
- [ ] Visibility picker: Personal, Shared, Family
- [ ] Assignee multi-select (family members)
- [ ] "Create" button saves and navigates to goal detail
- [ ] "Refine with AI" button for SMART suggestions
- [ ] Typecheck passes

---

### US-029: Build AI Goal Refinement
**Description:** As a user, I want AI to help refine my goal so that it follows SMART criteria.

**Acceptance Criteria:**
- [ ] Call `POST /api/v1/families/:id/goals/:id/refine` with goal data
- [ ] Show loading state while AI processes
- [ ] Display AI suggestions for each SMART component
- [ ] User can accept/reject each suggestion individually
- [ ] "Apply All" button accepts all suggestions
- [ ] Suggestions update goal fields when applied
- [ ] Typecheck passes

---

### Phase 7: Reflections

---

### US-030: Create Reflections Data Layer
**Description:** As a developer, I need data fetching hooks for reflections so that screens can manage reflections.

**Acceptance Criteria:**
- [ ] Create `src/hooks/useReflections.ts` with TanStack Query
- [ ] `useReflections(filters)` - list reflections with type/date filters
- [ ] `useCreateReflection()` - mutation for creating reflections
- [ ] `useUpdateReflection()` - mutation for updating reflections
- [ ] Support reflection types: evening, weekly, monthly, quarterly, annual, quick
- [ ] Typecheck passes

---

### US-031: Build Quick Reflection Screen
**Description:** As a user, I want to capture a quick reflection so that I can note thoughts anytime.

**Acceptance Criteria:**
- [ ] Create `app/reflection/quick.tsx`
- [ ] Mood selector (5 options with emoji + label)
- [ ] Energy level slider (1-5)
- [ ] "What's on your mind?" textarea
- [ ] Gratitude items input (add multiple)
- [ ] "Save" button creates reflection via API
- [ ] Navigate back on success
- [ ] Typecheck passes

---

### US-032: Build Weekly Review Screen
**Description:** As a user, I want to complete my weekly review so that I reflect on my progress.

**Acceptance Criteria:**
- [ ] Create `app/reflection/weekly.tsx`
- [ ] Fetch current week's review via `GET /api/v1/families/:id/weekly_reviews/current`
- [ ] Sections: Wins, Losses/Friction, Metrics Notes, System to Adjust
- [ ] Each section is a rich text input
- [ ] Auto-save on blur with debounce
- [ ] Show computed metrics from API (habit tally, task completion, goal progress)
- [ ] Mark review as complete when all sections filled
- [ ] Typecheck passes

---

### Phase 8: Profile & Settings

---

### US-033: Build Me Tab Screen
**Description:** As a user, I want to see my profile and stats so that I understand my progress.

**Acceptance Criteria:**
- [ ] Create `app/(tabs)/me.tsx`
- [ ] Display user avatar, name, email
- [ ] Show current streak badges (daily planning, reflection, weekly review)
- [ ] Display total points
- [ ] Show recent badges earned
- [ ] Quick links: Settings, Habits, Notifications, Family
- [ ] Logout button
- [ ] Typecheck passes

---

### US-034: Build Settings Screen
**Description:** As a user, I want to access settings so that I can customize the app.

**Acceptance Criteria:**
- [ ] Create `app/settings/index.tsx`
- [ ] Sections: Account, Notifications, Security, About
- [ ] Account: Edit Profile, Change Password
- [ ] Security: Biometric Login toggle
- [ ] About: Version number, Terms, Privacy Policy links
- [ ] Delete Account option with confirmation flow
- [ ] Typecheck passes

---

### US-035: Build Edit Profile Screen
**Description:** As a user, I want to edit my profile so that I can update my information.

**Acceptance Criteria:**
- [ ] Create `app/settings/profile.tsx`
- [ ] Avatar picker (camera or photo library via expo-image-picker)
- [ ] Name input
- [ ] Save button calls `PATCH /api/v1/users/me/profile`
- [ ] Show loading state during save
- [ ] Navigate back on success
- [ ] Typecheck passes

---

### US-036: Build Family Management Screen
**Description:** As a user, I want to manage my family so that I can invite members and switch families.

**Acceptance Criteria:**
- [ ] Create `app/settings/family.tsx`
- [ ] List all families user belongs to
- [ ] Show current family with checkmark
- [ ] Tap to switch active family
- [ ] Show family members with roles
- [ ] "Invite Member" button (admin/adult only)
- [ ] Invite flow: enter email, select role, send invitation
- [ ] Typecheck passes

---

### Phase 9: Push Notifications

---

### US-037: Set Up Push Notification Infrastructure
**Description:** As a developer, I need push notification infrastructure so that users receive reminders.

**Acceptance Criteria:**
- [ ] Install expo-notifications
- [ ] Configure app.json with notification settings
- [ ] Create `src/services/notifications.ts`
- [ ] Request notification permissions on first launch
- [ ] Register device token via `POST /api/v1/device_tokens`
- [ ] Handle token refresh
- [ ] Unregister token on logout
- [ ] Typecheck passes

---

### US-038: Handle Incoming Notifications
**Description:** As a user, I want notifications to navigate me to relevant screens so that I can take action.

**Acceptance Criteria:**
- [ ] Set up notification listeners in app root
- [ ] Parse notification payload for type and target
- [ ] Deep link to appropriate screen based on type:
  - `reminder` → Today screen
  - `goal_update` → Goal detail
  - `family_invite` → Family settings
  - `badge_earned` → Me tab
- [ ] Show in-app notification banner when app is foregrounded
- [ ] Typecheck passes

---

### US-039: Build Notification Preferences Screen
**Description:** As a user, I want to manage notification settings so that I control what alerts I receive.

**Acceptance Criteria:**
- [ ] Create `app/settings/notifications.tsx`
- [ ] Fetch preferences via `GET /api/v1/users/me/notification_preferences`
- [ ] Toggle for each notification type: Morning Planning, Evening Reflection, Weekly Review, Tips
- [ ] Time pickers for reminder times
- [ ] Quiet hours start/end time pickers
- [ ] Save via `PATCH /api/v1/users/me/notification_preferences`
- [ ] Typecheck passes

---

### US-040: Implement Local Notification Scheduling
**Description:** As a user, I want local reminders even when offline so that I stay on track.

**Acceptance Criteria:**
- [ ] Schedule local notifications based on user preferences
- [ ] Morning planning reminder at configured time
- [ ] Evening reflection reminder at configured time
- [ ] Weekly review reminder (configurable day/time)
- [ ] Respect quiet hours
- [ ] Reschedule when preferences change
- [ ] Cancel all on logout
- [ ] Typecheck passes

---

### Phase 10: Offline Support

---

### US-041: Set Up Offline Storage
**Description:** As a developer, I need offline storage so that data persists when offline.

**Acceptance Criteria:**
- [ ] Install MMKV for fast key-value storage
- [ ] Create `src/services/offlineStorage.ts`
- [ ] Store serialized data: daily plan, habits, goals, user profile
- [ ] Implement `getCached<T>(key)` and `setCache<T>(key, data)` functions
- [ ] Configure TanStack Query to use cached data as initial data
- [ ] Set up network status listener using `@react-native-community/netinfo`
- [ ] Typecheck passes

---

### US-042: Implement Offline Sync Queue
**Description:** As a developer, I need a sync queue so that offline actions are processed when online.

**Acceptance Criteria:**
- [ ] Create `src/services/syncQueue.ts`
- [ ] Queue structure: `{ id, action, endpoint, payload, timestamp }`
- [ ] Persist queue to MMKV storage
- [ ] Add to queue when mutation fails due to network
- [ ] Process queue sequentially when online
- [ ] Handle conflicts (server data newer than local)
- [ ] Remove from queue after successful sync
- [ ] Retry failed items with exponential backoff (max 3 retries)
- [ ] Typecheck passes

---

### US-043: Add Offline Indicator UI
**Description:** As a user, I want to know when I'm offline so that I understand data may not be synced.

**Acceptance Criteria:**
- [ ] Create `OfflineBanner` component
- [ ] Show banner at top of screen when offline
- [ ] Banner text: "You're offline. Changes will sync when connected."
- [ ] Show "Syncing..." with spinner when processing queue
- [ ] Show "Synced" briefly with checkmark when queue processed
- [ ] Animate banner appearance/disappearance
- [ ] Typecheck passes

---

### US-044: Enable Offline Daily Planning
**Description:** As a user, I want to use daily planning offline so that I can plan without internet.

**Acceptance Criteria:**
- [ ] Cache today's daily plan on fetch
- [ ] Allow toggling task/habit/priority completion offline
- [ ] Queue updates for sync
- [ ] Show optimistic UI updates immediately
- [ ] Mark items as "pending sync" with subtle indicator
- [ ] Resolve conflicts by preferring latest timestamp
- [ ] Typecheck passes

---

### Phase 11: Calendar Integration

---

### US-045: Implement Calendar Permission Flow
**Description:** As a user, I want to grant calendar access so that I can see events in my planning.

**Acceptance Criteria:**
- [ ] Install expo-calendar
- [ ] Request calendar permissions with explanation
- [ ] Show permission denied state with "Open Settings" button
- [ ] Store permission status
- [ ] Typecheck passes

---

### US-046: Display Calendar Events in Today View
**Description:** As a user, I want to see today's calendar events so that I plan around my schedule.

**Acceptance Criteria:**
- [ ] Fetch events from device calendar for today
- [ ] Display "Schedule" section in Today screen
- [ ] Show events with time, title, and calendar color
- [ ] Tap event to open in native calendar app
- [ ] Handle all-day events separately
- [ ] Refresh events on pull-to-refresh
- [ ] Typecheck passes

---

### US-047: Build Google Calendar Connection
**Description:** As a user, I want to connect Google Calendar so that my goals sync with my calendar.

**Acceptance Criteria:**
- [ ] Create `app/settings/calendar.tsx`
- [ ] Show Google Calendar connection status
- [ ] "Connect Google Calendar" button opens OAuth flow
- [ ] Use `GET /api/v1/users/me/google_calendar/auth_url` for OAuth URL
- [ ] Handle OAuth callback via deep link
- [ ] Show connected calendars list
- [ ] Toggle which calendars to sync
- [ ] Disconnect button calls `DELETE /api/v1/users/me/google_calendar`
- [ ] Typecheck passes

---

### Phase 12: Gamification

---

### US-048: Build Streaks Display
**Description:** As a user, I want to see my streaks so that I stay motivated to maintain consistency.

**Acceptance Criteria:**
- [ ] Fetch streaks via `GET /api/v1/users/me/streaks`
- [ ] Display streak cards for: Daily Planning, Evening Reflection, Weekly Review
- [ ] Each card shows current count with fire emoji
- [ ] Show "longest streak" as secondary stat
- [ ] Animate milestone achievements (7, 14, 30, 60, 90, 180, 365 days)
- [ ] Show streak-at-risk indicator if close to breaking
- [ ] Typecheck passes

---

### US-049: Build Points Display
**Description:** As a user, I want to see my points so that I feel rewarded for my activities.

**Acceptance Criteria:**
- [ ] Fetch points via `GET /api/v1/users/me/points`
- [ ] Display total points prominently
- [ ] Show recent activity ledger (last 10 entries)
- [ ] Each entry shows: activity type, points earned, timestamp
- [ ] Animate points increase when earning new points
- [ ] Typecheck passes

---

### US-050: Build Badges Display
**Description:** As a user, I want to see my badges so that I celebrate my achievements.

**Acceptance Criteria:**
- [ ] Fetch badges via `GET /api/v1/users/me/badges`
- [ ] Display earned badges in grid
- [ ] Each badge shows icon, name, earned date
- [ ] Show locked badges (all badges minus earned) with greyed out style
- [ ] Tap badge to see description and criteria
- [ ] Animate newly earned badges
- [ ] Typecheck passes

---

### US-051: Show Achievement Celebration Modal
**Description:** As a user, I want to be celebrated when I earn achievements so that I feel rewarded.

**Acceptance Criteria:**
- [ ] Create `AchievementModal` component
- [ ] Show confetti animation on achievement
- [ ] Display badge/streak milestone with congratulatory message
- [ ] Points earned shown prominently
- [ ] "Awesome!" dismiss button
- [ ] Trigger on: badge earned, streak milestone, goal completed
- [ ] Use haptic feedback on achievement
- [ ] Typecheck passes

---

### Phase 13: Polish & App Store Prep

---

### US-052: Implement Haptic Feedback
**Description:** As a user, I want haptic feedback so that interactions feel responsive.

**Acceptance Criteria:**
- [ ] Install expo-haptics
- [ ] Create `src/utils/haptics.ts` with feedback functions
- [ ] Add light haptic on button press
- [ ] Add success haptic on task completion
- [ ] Add warning haptic on destructive action confirmation
- [ ] Add notification haptic on achievement
- [ ] Respect system haptic settings
- [ ] Typecheck passes

---

### US-053: Add Loading States and Skeletons
**Description:** As a user, I want loading states so that I know content is being fetched.

**Acceptance Criteria:**
- [ ] Create `Skeleton` component for loading placeholders
- [ ] Add skeleton to Today screen while loading
- [ ] Add skeleton to Goals list while loading
- [ ] Add skeleton to Me tab while loading
- [ ] Smooth transition from skeleton to content
- [ ] Typecheck passes

---

### US-054: Implement Error Handling UI
**Description:** As a user, I want clear error messages so that I understand when something goes wrong.

**Acceptance Criteria:**
- [ ] Create `ErrorBoundary` component for crash recovery
- [ ] Create `ErrorMessage` component for API errors
- [ ] Show retry button for failed network requests
- [ ] Display friendly messages (not raw error codes)
- [ ] Log errors to console in dev, to error service in prod
- [ ] Typecheck passes

---

### US-055: Add App Icons and Splash Screen
**Description:** As a user, I want professional app icons so that the app looks polished.

**Acceptance Criteria:**
- [ ] Create app icon in required sizes (1024x1024 base)
- [ ] Configure app icon in app.json
- [ ] Create splash screen with logo and brand colors
- [ ] Configure splash screen in app.json
- [ ] Test icon appears correctly on home screen
- [ ] Test splash screen shows during app load
- [ ] Typecheck passes

---

### US-056: Configure App Store Metadata
**Description:** As a developer, I need App Store metadata configured so that the app can be submitted.

**Acceptance Criteria:**
- [ ] Set app name, description, keywords in app.json
- [ ] Configure version number (1.0.0)
- [ ] Set build number
- [ ] Configure privacy policy URL
- [ ] Configure support URL
- [ ] Prepare App Store screenshots (iPhone 14 Pro, iPhone 8 Plus)
- [ ] Write App Store description
- [ ] Typecheck passes

---

### US-057: Build EAS Configuration
**Description:** As a developer, I need EAS configured so that I can build and submit to App Store.

**Acceptance Criteria:**
- [ ] Install eas-cli globally
- [ ] Run `eas build:configure`
- [ ] Create `eas.json` with development, preview, production profiles
- [ ] Configure iOS provisioning profile and certificates
- [ ] Test development build locally
- [ ] Test preview build installs on device
- [ ] Typecheck passes

---

## Functional Requirements

- FR-1: App must work on iOS 14.0 and above
- FR-2: All API calls must use the existing Rails backend without modification
- FR-3: Authentication uses session-based auth stored in expo-secure-store
- FR-4: Offline mode must queue mutations and sync when online
- FR-5: Push notifications must be delivered via APNs
- FR-6: Local notifications must respect user's quiet hours
- FR-7: Biometric auth must fall back to password
- FR-8: All forms must validate input before submission
- FR-9: All lists must support pull-to-refresh
- FR-10: All destructive actions require confirmation
- FR-11: Haptic feedback on interactive elements
- FR-12: Support Dynamic Type for accessibility
- FR-13: Support Dark Mode (system preference)

## Non-Goals

- Android support (future phase)
- Tablet-optimized layouts
- Apple Watch companion app
- Widget extensions
- SharePlay/family sharing via Apple
- Siri shortcuts
- Backend API modifications
- Web app feature parity (mobile is subset)
- Social features beyond family
- Photo/file attachments on goals or reflections

## Technical Considerations

- **Monorepo Structure**: Create `/mobile` directory alongside `/backend` and `/frontend`
- **Shared Types**: Consider extracting API types to shared package
- **API Versioning**: All endpoints are under `/api/v1/`
- **Rate Limiting**: Backend has Rack::Attack configured; handle 429 responses
- **Image Uploads**: Use presigned URLs if adding avatar uploads
- **Deep Linking**: Configure `entmoot://` URL scheme for notifications and OAuth
- **Keychain Sharing**: Consider for future multi-app scenarios

## Design Considerations

- Follow iOS Human Interface Guidelines
- Use SF Symbols for icons where appropriate
- Match Entmoot brand colors from web app
- Bottom sheet modals for forms (consistent with iOS patterns)
- Tab bar for main navigation (Today, Goals, Me)
- Stack navigation for detail screens
- Swipe gestures for common actions (delete, complete)

## Success Metrics

- App Store rating of 4.5+ stars
- Daily active usage rate > 60% of registered users
- Daily planning completion rate > 70%
- Push notification opt-in rate > 80%
- Crash-free session rate > 99.5%
- App launch to usable < 2 seconds
- Offline sync success rate > 99%

## Open Questions

1. Should we use a design system library (React Native Paper, Tamagui) or build custom?
2. What analytics platform should we integrate (Mixpanel, Amplitude, PostHog)?
3. Should we implement App Clips for quick family invitations?
4. Do we need App Store subscription for premium features?
5. Should we support Sign in with Apple in addition to email/password?

## Dependencies

- Existing Rails backend API (no changes required)
- Apple Developer account for App Store submission
- APNs certificates for push notifications
- Expo account for EAS builds
