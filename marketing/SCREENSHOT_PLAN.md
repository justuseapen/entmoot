# App Store Screenshot Plan
# Entmoot v1.0 - Founding Families Beta

**Prepared:** 2026-01-28
**Status:** Ready for implementation
**Target:** Apple App Store submission

---

## Table of Contents

1. [Strategic Overview](#strategic-overview)
2. [Screenshot Sequence](#screenshot-sequence)
3. [Demo Account Specifications](#demo-account-specifications)
4. [Technical Requirements](#technical-requirements)
5. [Capture Process](#capture-process)
6. [Quality Checklist](#quality-checklist)

---

## Strategic Overview

### Core Message
Entmoot is the **only** family planning app built on Cal Newport's multi-scale planning methodology. We need to visually communicate:

1. Multi-scale planning (daily → weekly → quarterly → annual)
2. AI coaching for SMART goals
3. Structure that supports deep work principles
4. Clean, intentional design that respects users' time
5. Gamification that matters (habits, streaks, progress)

### Target Audience
- Productivity-focused parents (30-45 years old)
- Cal Newport / GTD / time-blocking enthusiasts
- Use professional tools at work (Notion, Things) but home is chaos
- Value intentionality over busyness

### Visual Identity
- **Clean, minimal aesthetics**: No clutter
- **Cream background** (#FFF8E7) + **Indigo primary** (#4F46E5) = warm but professional
- **Typography-forward**: Let content breathe
- **Purposeful design**: Every element serves the system
- **NOT**: Childish gamification, overwhelming dashboards, notification-heavy

### Screenshot Strategy
1. Lead with multi-scale planning visual (the differentiator)
2. Show AI coaching (unique feature)
3. Demonstrate daily time-blocking (Cal Newport connection)
4. Highlight habits and consistency (systematic improvement)
5. Show weekly review (connects to Cal Newport's methodology)
6. Celebrate progress (motivational close)

---

## Screenshot Sequence

### Screenshot 1: Daily Planner - "Time-Block Your Day"
**File naming:** `01-daily-planner`

**Screen:** Today screen (today.tsx)

**Purpose:** Lead screenshot. Immediately communicate time-blocking and daily planning value.

**Caption Overlay:**
```
"Time-block your day with
purpose and clarity"
```

**Demo Content:**

**Header Section:**
- Greeting: "Good morning, Alex"
- Date: "Tuesday, January 28"
- Status bar: 9:41 AM, full signal, full battery

**Daily Intention (optional, if implemented):**
- "Complete project proposal and advance quarterly planning"

**Priority Items (4 tasks with time blocks):**
1. "9:00 AM - Review quarterly goals" ✓ (checked, completed style)
2. "10:30 AM - Deep work: Project proposal" (unchecked, in progress)
3. "2:00 PM - Weekly team sync" (unchecked)
4. "4:00 PM - Daily shutdown ritual" (unchecked)

**Habits Section:**
- Section header: "Habits" with count badge (3/7 completed)
- Display 5 habits:
  1. "Morning planning ritual" - 🔥 42 day streak ✓
  2. "Deep work block (2 hours)" - 🔥 28 day streak ✓
  3. "Daily shutdown ritual" - 🔥 35 day streak (unchecked, end-of-day)
  4. "Exercise 30 minutes" - 🔥 15 day streak ✓
  5. "Read for 20 minutes" - 🔥 21 day streak (unchecked)

**Calendar Widget (if visible):**
- Current week view: Jan 22-28
- Activity dots on Mon (3), Tue (4, today), Wed (2), Thu (3), Fri (2)
- Clean, minimal month view

**Quick Actions (if visible at top):**
- Goals, Weekly Review, Add Priority icons

**Visual Focus:**
- Clean time-blocking format
- Progress indicators (checkmarks, unchecked boxes)
- Streak badges prominent but not overwhelming
- Professional color scheme throughout

---

### Screenshot 2: Multi-Scale Planning - "See the Big Picture"
**File naming:** `02-multi-scale-planning`

**Screen:** Goals list with filter tabs (goals.tsx)

**Purpose:** Showcase the Cal Newport differentiator - planning across timeframes.

**Caption Overlay:**
```
"Connect daily tasks to
quarterly goals to annual vision"
```

**Demo Content:**

**Header:**
- Title: "Goals"
- Subtitle or description: "Track progress across all timeframes"

**Filter Tabs (horizontal scroll):**
- All (selected, highlighted)
- Daily
- Weekly
- Monthly
- Quarterly
- Annual

**Goals List (5-6 cards showing timeframe diversity):**

1. **"Launch new product feature"** (Quarterly)
   - Progress bar: 65% (visual bar in indigo)
   - Status badge: "On Track" (success green)
   - Due date: "Mar 31, 2026"
   - Type badge: "Professional"
   - Small icon: briefcase or rocket

2. **"Read 12 books this year"** (Annual)
   - Progress bar: 25% (3/12 books shown)
   - Status badge: "In Progress" (info blue)
   - Due date: "Dec 31, 2026"
   - Type badge: "Personal"
   - Small icon: book

3. **"Exercise 16 times this month"** (Monthly)
   - Progress bar: 75% (12/16 sessions)
   - Status badge: "On Track" (success green)
   - Due date: "Jan 31, 2026"
   - Type badge: "Health"
   - Small icon: heart or fitness

4. **"Complete weekly team report"** (Weekly)
   - Progress bar: 50% (mid-week)
   - Status badge: "In Progress" (info blue)
   - Due date: "Jan 31, 2026"
   - Type badge: "Work"
   - Small icon: document

5. **"Finish project proposal"** (Daily)
   - Progress bar: 90% (almost done)
   - Status badge: "On Track" (success green)
   - Due date: "Today"
   - Type badge: "Work"
   - Small icon: checkmark or target

**FAB (Floating Action Button):**
- Bottom right, indigo color
- "+" icon, prominent but not distracting

**Visual Focus:**
- Variety of timeframes immediately visible
- Progress bars show measurable goals (SMART)
- Clean card design with consistent spacing
- Professional badges and colors
- Sense of comprehensive system

---

### Screenshot 3: AI Goal Coaching - "Get Smarter About Goals"
**File naming:** `03-ai-goal-coaching`

**Screen:** Goal detail with AI refinement modal (goal/[id].tsx with AIRefinementModal)

**Purpose:** Showcase unique AI coaching feature and SMART framework.

**Caption Overlay:**
```
"AI coaching helps you set
goals that actually stick"
```

**Demo Content:**

**Goal Header (partially visible behind modal):**
- Title: "Launch new product feature"
- Time scale badge: "Quarterly"
- Progress: 45%

**AI Refinement Modal (main focus):**

**Modal Title:** "AI Goal Refinement"
**Subtitle:** "Let's make this goal SMART and achievable"

**Original Goal Section:**
- Header: "Current Goal"
- Text box with light background showing:
  ```
  Build and ship the new dashboard by end of month
  so customers can track their analytics better.
  ```

**AI Suggestions Panel:**
- Header: "SMART Refinement Suggestions"

**Specific:**
- Label: "Specific" with info icon
- Suggestion text:
  ```
  Build and ship the analytics dashboard with:
  • User segmentation
  • CSV export functionality
  • Real-time data updates
  ```

**Measurable:**
- Label: "Measurable"
- Suggestion text:
  ```
  Complete all 3 core features with 95% test
  coverage and zero critical bugs in staging
  ```

**Achievable:**
- Label: "Achievable"
- Suggestion text:
  ```
  Team has 120 hours allocated over 3 weeks;
  feature breakdown shows 95 hours needed with
  25 hour buffer for testing
  ```

**Relevant (partially visible):**
- Label: "Relevant"
- Suggestion text (first line visible):
  ```
  Addresses top customer request from 47% of
  enterprise accounts...
  ```

**Action Buttons (at bottom of modal):**
- Primary: "Apply Suggestions" (indigo, prominent)
- Secondary: "Refine More" or "Cancel" (outline style)

**Visual Focus:**
- SMART framework clearly labeled
- Before/after comparison shows value
- AI as helpful coach, not overwhelming
- Clean, readable typography
- Professional modal design

---

### Screenshot 4: Weekly Review - "Stay Aligned as a Team"
**File naming:** `04-weekly-review`

**Screen:** Weekly reflection (reflection/weekly.tsx)

**Purpose:** Show structured retrospective process (Cal Newport's weekly review).

**Caption Overlay:**
```
"15-minute weekly reviews keep
your family aligned and growing"
```

**Demo Content:**

**Header:**
- Title: "Weekly Review"
- Subtitle: "Week of January 20 - 26"
- Status indicator: "In Progress" or completion percentage

**Metrics Card (top section):**
- Clean card with key stats:
  - **18 tasks completed** (checkmark icon)
  - **3 goals advanced** (target icon)
  - **85% habit consistency** (flame icon)
  - **2 deep work sessions** (brain icon)

**Habits Summary:**
- Section header: "This Week's Habits"
- Grid or list showing:
  - Morning planning: 7/7 ✓
  - Deep work: 5/7
  - Exercise: 4/7
  - Reading: 6/7

**Reflection Prompts (main content):**

1. **"What went well this week?"**
   - Text input with content:
   ```
   Completed the project proposal ahead of schedule.
   Maintained morning planning streak. Family dinner
   3x this week - felt really connected.
   ```

2. **"What was challenging?"**
   - Text input with content:
   ```
   Struggled with afternoon energy dips. Need to
   adjust lunch and add a short walk. Deep work
   sessions got interrupted twice.
   ```

3. **"What did you learn?"**
   - Text input (partially visible):
   ```
   Time-blocking morning meetings works better than
   afternoon. Kids respond better to...
   ```

**Auto-save Indicator:**
- Subtle "Saved" indicator with timestamp
- Clean, non-intrusive

**Navigation:**
- Back button to return to dashboard
- "Next Week" or "Complete Review" button

**Visual Focus:**
- Structured reflection framework
- Data-driven metrics (not just feelings)
- Clean text input areas
- Professional retrospective feel
- Encourages weekly practice

---

### Screenshot 5: Goal Progress Detail - "Track What Matters"
**File naming:** `05-goal-progress`

**Screen:** Goal detail view (goal/[id].tsx)

**Purpose:** Show detailed progress tracking and SMART goal structure.

**Caption Overlay:**
```
"Track progress with clarity
and celebrate every milestone"
```

**Demo Content:**

**Header:**
- Title: "Exercise 16 times this month"
- Back button, edit button (top right)

**Goal Metadata:**
- Time scale badge: "Monthly"
- Due date: "Due Jan 31, 2026" with calendar icon
- Type badge: "Health" with heart icon

**Progress Section (prominent):**
- Large circular or bar progress indicator: **75% complete**
- Subtext: "12 of 16 sessions completed"
- Visual progress bar (indigo color)
- Motivational message: "You're crushing it! Keep going!"

**SMART Framework Display:**
- Section header: "Goal Details"
- Clean layout showing SMART components:

  **Specific:**
  ```
  Complete 16 exercise sessions (mix of strength
  training, cardio, and yoga)
  ```

  **Measurable:**
  ```
  Track each 30-minute session in the app.
  4 sessions per week minimum.
  ```

  **Achievable:**
  ```
  30 minutes per session fits morning routine.
  Have equipment at home and gym membership.
  ```

  **Relevant:**
  ```
  Improves energy, focus, and overall health.
  Sets good example for kids.
  ```

  **Time-bound:**
  ```
  Complete by January 31, 2026.
  4 weeks to establish habit.
  ```

**Status Section:**
- Current status: "On Track" (green badge)
- Status picker showing other options (not expanded)

**Completion Log (if implemented):**
- Recent completions:
  - Jan 27: ✓ "Morning yoga - 30 min"
  - Jan 25: ✓ "Strength training - 45 min"
  - Jan 23: ✓ "Evening walk - 30 min"
  - (2-3 more entries)

**Action Buttons (bottom):**
- Primary: "Update Progress" (slider or +/- buttons)
- Secondary: "Log Completion" or "Add Note"
- Tertiary: "Delete Goal" (destructive, subtle)

**Visual Focus:**
- Progress prominently displayed
- SMART framework makes goal concrete
- Positive reinforcement messaging
- Clean, organized information hierarchy
- Professional tracking aesthetic

---

### Screenshot 6: Habit Streaks & Gamification - "Build Lasting Habits"
**File naming:** `06-habits-streaks`

**Screen:** Today screen with habits section expanded (today.tsx) OR Profile with achievements (me.tsx)

**Purpose:** Show gamification that matters - streaks and consistency.

**Caption Overlay:**
```
"Build lasting habits with
streaks and daily accountability"
```

**Option A - Habits List (Preferred):**

**Demo Content:**

**Header:**
- Section title: "Daily Habits"
- Subtitle: "5 of 7 completed today" with progress indicator

**Habits List (7 items with prominent streaks):**

1. **"Morning planning ritual"**
   - Checkbox: ✓ (checked, completed style)
   - Streak badge: 🔥 **42 days**
   - Badge color: Gold/special color for 30+ day milestone
   - Celebration indicator: "On Fire!" or sparkle animation

2. **"Deep work block (2 hours)"**
   - Checkbox: ✓ (checked)
   - Streak badge: 🔥 **28 days**
   - Time indicator: "Completed at 11:45 AM"

3. **"Daily shutdown ritual"**
   - Checkbox: ☐ (unchecked, shows it's end-of-day)
   - Streak badge: 🔥 **35 days**
   - Note: "Complete by 6:00 PM"

4. **"Exercise 30 minutes"**
   - Checkbox: ✓ (checked)
   - Streak badge: 🔥 **15 days**
   - Milestone indicator: "Halfway to 30!"

5. **"Read for 20 minutes"**
   - Checkbox: ✓ (checked)
   - Streak badge: 🔥 **21 days**
   - Milestone badge: "Habit Formed!" (21-day milestone)

6. **"No social media before noon"**
   - Checkbox: ☐ (unchecked, it's morning)
   - Streak badge: 🔥 **7 days**
   - Progress: "3 hours to go"

7. **"Weekly family review"**
   - Checkbox: ✓ (checked this week)
   - Streak badge: 🔥 **8 weeks**
   - Different style for weekly habit
   - Badge: "Consistent Reviewer"

**Streak Milestone Banner (optional):**
- Celebration banner for hitting 42 days:
  ```
  🎉 You hit 42 days on Morning Planning!
  That's 6 weeks of consistency!
  ```

**Option B - Profile/Achievements (Alternative):**

**Header:**
- Avatar: "AC" initials in indigo circle
- Name: "Alex Chen"
- Level badge: "Focused Achiever - Level 8"

**Stats Grid:**
- Total points: **1,247 pts**
- Goals completed: **23**
- Longest streak: **42 days** 🔥
- Weekly reviews: **8 weeks**

**Achievements Section:**
- Section header: "Achievements"

**Unlocked Badges (3-4 shown):**
1. **"30-Day Streak Master"** ✓
   - Icon: Flame with star
   - "Maintained a habit for 30+ days"

2. **"Goal Crusher"** ✓
   - Icon: Trophy
   - "Completed 20 goals"

3. **"Weekly Reviewer"** ✓
   - Icon: Calendar with checkmark
   - "8 consecutive weekly reviews"

4. **"Deep Work Advocate"** ✓
   - Icon: Brain or focus icon
   - "30 deep work sessions completed"

**Locked Badges (2-3 shown, aspirational):**
1. **"100-Day Legend"** 🔒
   - Icon: Grayed out flame
   - "Maintain a 100-day streak"
   - Progress: 42/100

2. **"Quarterly Champion"** 🔒
   - Icon: Grayed out medal
   - "Complete all quarterly goals"

**Visual Focus:**
- Streaks provide positive reinforcement
- Flame emoji is iconic and motivating
- Mix of completed/incomplete shows active use
- Milestones celebrate real achievement (21, 30, 42 days)
- Not childish - professional gamification
- Visual hierarchy: longest streaks most prominent

---

## Demo Account Specifications

### Account Details
```
Email: demo@entmoot.app
Password: DemoAccount2026!
Name: Alex Chen
Role: Adult
Family: Chen Family (optional, not critical for screenshots)
Account Age: Simulate 60 days of historical data
Time Zone: US Pacific (for realistic timestamps)
```

### Required Seed Data

#### 1. Goals (8 total)

**Quarterly (2 goals):**
```json
{
  "title": "Launch new product feature",
  "description": "Ship the analytics dashboard to production",
  "time_scale": "quarterly",
  "status": "in_progress",
  "progress": 65,
  "due_date": "2026-03-31",
  "goal_type": "professional",
  "smart": {
    "specific": "Build and ship the analytics dashboard with user segmentation, export functionality, and real-time updates",
    "measurable": "Complete all 3 core features with 95% test coverage and zero critical bugs in staging",
    "achievable": "Team has 120 hours allocated; feature breakdown shows 95 hours needed with 25 hour buffer",
    "relevant": "Addresses top customer request from 47% of enterprise accounts, directly impacts Q1 retention target",
    "time_bound": "Ship to production by March 28, 2026, allowing 3 days for monitoring before month end"
  }
}
```

```json
{
  "title": "Read 12 books this year",
  "time_scale": "annual",
  "status": "in_progress",
  "progress": 25,
  "current_value": 3,
  "target_value": 12,
  "due_date": "2026-12-31",
  "goal_type": "personal"
}
```

**Monthly (2 goals):**
```json
{
  "title": "Exercise 16 times this month",
  "time_scale": "monthly",
  "status": "in_progress",
  "progress": 75,
  "current_value": 12,
  "target_value": 16,
  "due_date": "2026-01-31",
  "goal_type": "health",
  "smart": {
    "specific": "Complete 16 exercise sessions (mix of strength training, cardio, and yoga)",
    "measurable": "Track each 30-minute session in the app. 4 sessions per week minimum.",
    "achievable": "30 minutes per session fits morning routine. Have equipment at home and gym membership.",
    "relevant": "Improves energy, focus, and overall health. Sets good example for kids.",
    "time_bound": "Complete by January 31, 2026. 4 weeks to establish habit."
  }
}
```

```json
{
  "title": "Complete online course",
  "time_scale": "monthly",
  "status": "at_risk",
  "progress": 40,
  "due_date": "2026-01-31",
  "goal_type": "learning"
}
```

**Weekly (2 goals):**
```json
{
  "title": "Complete weekly team report",
  "time_scale": "weekly",
  "status": "in_progress",
  "progress": 50,
  "due_date": "2026-01-31",
  "goal_type": "work"
}
```

```json
{
  "title": "Meal prep for the week",
  "time_scale": "weekly",
  "status": "completed",
  "progress": 100,
  "due_date": "2026-01-28",
  "goal_type": "personal"
}
```

**Daily (2 goals):**
```json
{
  "title": "Finish project proposal",
  "time_scale": "daily",
  "status": "in_progress",
  "progress": 90,
  "due_date": "2026-01-28",
  "goal_type": "work"
}
```

```json
{
  "title": "Review quarterly goals",
  "time_scale": "daily",
  "status": "completed",
  "progress": 100,
  "due_date": "2026-01-28",
  "goal_type": "planning"
}
```

#### 2. Habits (7 total)

```json
[
  {
    "name": "Morning planning ritual",
    "frequency": "daily",
    "current_streak": 42,
    "completed_today": true,
    "last_completed": "2026-01-28T09:15:00Z"
  },
  {
    "name": "Deep work block (2 hours)",
    "frequency": "daily",
    "current_streak": 28,
    "completed_today": true,
    "last_completed": "2026-01-28T11:45:00Z"
  },
  {
    "name": "Daily shutdown ritual",
    "frequency": "daily",
    "current_streak": 35,
    "completed_today": false,
    "scheduled_time": "18:00"
  },
  {
    "name": "Exercise 30 minutes",
    "frequency": "daily",
    "current_streak": 15,
    "completed_today": true,
    "last_completed": "2026-01-28T07:30:00Z"
  },
  {
    "name": "Read for 20 minutes",
    "frequency": "daily",
    "current_streak": 21,
    "completed_today": true,
    "milestone": "habit_formed",
    "last_completed": "2026-01-28T21:15:00Z"
  },
  {
    "name": "No social media before noon",
    "frequency": "daily",
    "current_streak": 7,
    "completed_today": false,
    "progress_note": "3 hours to go"
  },
  {
    "name": "Weekly family review",
    "frequency": "weekly",
    "current_streak": 8,
    "completed_this_week": true,
    "last_completed": "2026-01-26T14:00:00Z"
  }
]
```

#### 3. Daily Plan (for Today screen)

```json
{
  "date": "2026-01-28",
  "intention": "Complete project proposal and advance quarterly planning",
  "priorities": [
    {
      "title": "9:00 AM - Review quarterly goals",
      "completed": true,
      "time_block": "09:00",
      "duration": 60,
      "linked_goal_id": 7
    },
    {
      "title": "10:30 AM - Deep work: Project proposal",
      "completed": false,
      "time_block": "10:30",
      "duration": 120,
      "linked_goal_id": 7,
      "in_progress": true
    },
    {
      "title": "2:00 PM - Weekly team sync",
      "completed": false,
      "time_block": "14:00",
      "duration": 60
    },
    {
      "title": "4:00 PM - Daily shutdown ritual",
      "completed": false,
      "time_block": "16:00",
      "duration": 30
    }
  ]
}
```

#### 4. Weekly Review Data

```json
{
  "week_start": "2026-01-20",
  "week_end": "2026-01-26",
  "status": "completed",
  "metrics": {
    "tasks_completed": 18,
    "goals_advanced": 3,
    "habit_consistency": 0.85,
    "deep_work_sessions": 5
  },
  "habit_tally": {
    "morning_planning": 7,
    "deep_work": 5,
    "exercise": 4,
    "reading": 6
  },
  "reflections": {
    "went_well": "Completed the project proposal ahead of schedule. Maintained morning planning streak. Family dinner 3x this week - felt really connected.",
    "challenges": "Struggled with afternoon energy dips. Need to adjust lunch and add a short walk. Deep work sessions got interrupted twice.",
    "learnings": "Time-blocking morning meetings works better than afternoon. Kids respond better to clear expectations vs. last-minute asks."
  }
}
```

#### 5. Calendar Events (for calendar widget)

```json
[
  {
    "date": "2026-01-27",
    "event_count": 3
  },
  {
    "date": "2026-01-28",
    "event_count": 4,
    "is_today": true
  },
  {
    "date": "2026-01-29",
    "event_count": 2
  },
  {
    "date": "2026-01-30",
    "event_count": 3
  },
  {
    "date": "2026-01-31",
    "event_count": 2
  }
]
```

#### 6. Gamification Data (if used)

```json
{
  "total_points": 1247,
  "goals_completed": 23,
  "longest_streak": 42,
  "weekly_reviews_completed": 8,
  "level": "Focused Achiever",
  "achievements": [
    {
      "id": "30_day_streak",
      "name": "30-Day Streak Master",
      "description": "Maintained a habit for 30+ days",
      "unlocked": true,
      "unlocked_date": "2026-01-15"
    },
    {
      "id": "goal_crusher",
      "name": "Goal Crusher",
      "description": "Completed 20 goals",
      "unlocked": true,
      "unlocked_date": "2026-01-20"
    },
    {
      "id": "weekly_reviewer",
      "name": "Weekly Reviewer",
      "description": "8 consecutive weekly reviews",
      "unlocked": true,
      "unlocked_date": "2026-01-26"
    },
    {
      "id": "deep_work_advocate",
      "name": "Deep Work Advocate",
      "description": "30 deep work sessions completed",
      "unlocked": true,
      "unlocked_date": "2026-01-22"
    },
    {
      "id": "100_day_legend",
      "name": "100-Day Legend",
      "description": "Maintain a 100-day streak",
      "unlocked": false,
      "progress": 42,
      "target": 100
    },
    {
      "id": "quarterly_champion",
      "name": "Quarterly Champion",
      "description": "Complete all quarterly goals",
      "unlocked": false
    }
  ]
}
```

---

## Technical Requirements

### Device Sizes (Apple App Store)

You must capture screenshots for these 4 device sizes:

#### 1. iPhone 6.9" Display (iPhone 16 Pro Max)
- Resolution: **1320 x 2868 pixels**
- Scale: 3x
- Safe area insets: top 59, bottom 34

#### 2. iPhone 6.7" Display (iPhone 14 Pro Max)
- Resolution: **1290 x 2796 pixels**
- Scale: 3x
- Safe area insets: top 59, bottom 34

#### 3. iPhone 6.5" Display (iPhone 11 Pro Max)
- Resolution: **1242 x 2688 pixels**
- Scale: 3x
- Safe area insets: top 44, bottom 34

#### 4. iPhone 5.5" Display (iPhone 8 Plus)
- Resolution: **1242 x 2208 pixels**
- Scale: 3x
- Safe area insets: top 20, bottom 0 (no notch)

### Total Screenshots Required
- **6 screens** × **4 device sizes** = **24 total screenshot files**

### File Specifications
- **Format:** PNG (lossless compression)
- **Color space:** sRGB
- **Transparency:** None (no alpha channel)
- **Max file size:** 10 MB per file
- **Naming convention:** `{number}-{screen-name}-{device-size}.png`
  - Example: `01-daily-planner-6.9.png`

### Status Bar Requirements (Apple Standard)
- **Time:** 9:41 AM
- **Battery:** 100% (full, not charging icon)
- **Cellular:** Full signal (5G or LTE)
- **WiFi:** Full signal
- **No:** Low power mode, "Do Not Disturb", notifications, location services icon

### Color Accuracy
Ensure these brand colors render correctly:
- **Cream background:** #FFF8E7
- **Indigo primary:** #4F46E5
- **Forest green secondary:** #2D5A27
- **Status success:** #10B981
- **Status warning:** #F59E0B
- **Status error:** #EF4444
- **Status info:** #3B82F6

---

## Capture Process

### 1. Environment Setup

**Prerequisites:**
- [ ] Xcode installed with iOS Simulator
- [ ] React Native app builds successfully
- [ ] Demo account created: demo@entmoot.app
- [ ] Seed script prepared with all demo data

**Simulator Configuration:**
- [ ] Status bar shows 9:41 AM
- [ ] Battery at 100%
- [ ] Full cellular/WiFi signal
- [ ] No notification badges
- [ ] No debug overlays or developer menus
- [ ] Disable auto-lock

### 2. Seed Demo Data

Create a seed script (or manual process) to populate:
- [ ] 8 goals (as specified above)
- [ ] 7 habits with streak data
- [ ] 4 daily plan items
- [ ] Weekly review with reflections
- [ ] Calendar events for current week
- [ ] Gamification data (if implemented)
- [ ] AI refinement cached for "Launch new product feature"

**Reset Process:**
Before each capture session:
1. Clear demo account data
2. Run seed script
3. Verify all data loaded correctly
4. Log in as demo@entmoot.app

### 3. Capture Screenshots

**For each of 6 screens:**

1. Open simulator for first device size (6.9")
2. Navigate to the screen
3. Verify content matches specification
4. Take screenshot using:
   ```bash
   xcrun simctl io booted screenshot screenshot-name.png
   ```
5. Repeat for other 3 device sizes
6. Move to next screen

**Terminal Commands:**
```bash
# Set device (example)
xcrun simctl boot "iPhone 16 Pro Max"

# Take screenshot
xcrun simctl io booted screenshot ~/Desktop/entmoot-screenshots/01-daily-planner-6.9.png

# Change device
xcrun simctl shutdown all
xcrun simctl boot "iPhone 14 Pro Max"

# Repeat...
```

### 4. Quality Verification

For each screenshot file:
- [ ] Exact pixel dimensions match specs
- [ ] Status bar shows 9:41 AM, full battery, full signal
- [ ] Colors accurate (cream background visible)
- [ ] No personal/identifying data
- [ ] No lorem ipsum or placeholder text
- [ ] No debug overlays
- [ ] All text legible at thumbnail size
- [ ] File size under 10 MB
- [ ] File named correctly

### 5. Organization

**Folder Structure:**
```
/app-store-screenshots/
  01-daily-planner/
    01-daily-planner-6.9.png
    01-daily-planner-6.7.png
    01-daily-planner-6.5.png
    01-daily-planner-5.5.png
  02-multi-scale-planning/
    ...
  03-ai-goal-coaching/
    ...
  04-weekly-review/
    ...
  05-goal-progress/
    ...
  06-habits-streaks/
    ...
```

---

## Quality Checklist

### Pre-Capture
- [ ] Demo account exists and is accessible
- [ ] All seed data populated correctly
- [ ] App builds and runs without errors
- [ ] Simulators configured for each device size
- [ ] Status bar configured (9:41 AM, full battery, full signal)
- [ ] No notifications or badges visible
- [ ] Colors rendering correctly on simulator

### During Capture
- [ ] Screenshot 1: Daily Planner - all 4 sizes captured
- [ ] Screenshot 2: Multi-Scale Planning - all 4 sizes captured
- [ ] Screenshot 3: AI Goal Coaching - all 4 sizes captured
- [ ] Screenshot 4: Weekly Review - all 4 sizes captured
- [ ] Screenshot 5: Goal Progress - all 4 sizes captured
- [ ] Screenshot 6: Habits & Streaks - all 4 sizes captured
- [ ] All 24 files present

### Post-Capture
- [ ] All files have exact pixel dimensions
- [ ] All files under 10 MB
- [ ] PNG format, sRGB color space
- [ ] No alpha/transparency channels
- [ ] Filenames follow convention
- [ ] Colors accurate (cream #FFF8E7 background)
- [ ] All text legible at 50% zoom (thumbnail test)
- [ ] No debug text or console output visible
- [ ] Professional demo data (no "test user" or "lorem ipsum")
- [ ] Consistent branding across all screenshots

### Content Verification
- [ ] Daily Planner: 4 time-blocked tasks, 5+ habits with streaks
- [ ] Multi-Scale: 5+ goals across different timeframes
- [ ] AI Coaching: SMART framework clearly visible with suggestions
- [ ] Weekly Review: Metrics, reflections, habit tally visible
- [ ] Goal Progress: 75% completion, SMART details, motivational text
- [ ] Habits: 7 habits with varying streaks (7-42 days)

### Design Review
- [ ] Cal Newport aesthetic maintained (clean, minimal)
- [ ] Multi-scale planning clearly demonstrated
- [ ] AI coaching value obvious
- [ ] Gamification present but not overwhelming
- [ ] Professional quality throughout
- [ ] Screenshots tell a cohesive story in sequence

### Apple Guidelines
- [ ] No copyrighted material visible
- [ ] No competitive app names/logos
- [ ] No fake functionality shown
- [ ] No personal information visible
- [ ] No offensive content
- [ ] No misleading representations

---

## Caption Overlays (Optional Enhancement)

If adding text overlays to screenshots (recommended for higher conversion):

### Design Specifications
- **Font:** SF Pro Display (Apple system font) or clean sans-serif
- **Font weight:** Bold or Semibold
- **Font size:** 48-64px (scaled for device size)
- **Color:** White text with 40% black shadow/overlay for readability
- **Position:** Top third of screen (avoid covering key UI)
- **Background:** Semi-transparent dark overlay (optional)
- **Max lines:** 2-3 lines maximum
- **Text alignment:** Center

### Captions by Screenshot

1. **Daily Planner:** "Time-block your day with purpose and clarity"
2. **Multi-Scale Planning:** "Connect daily tasks to quarterly goals to annual vision"
3. **AI Goal Coaching:** "AI coaching helps you set goals that actually stick"
4. **Weekly Review:** "15-minute weekly reviews keep your family aligned and growing"
5. **Goal Progress:** "Track progress with clarity and celebrate every milestone"
6. **Habits & Streaks:** "Build lasting habits with streaks and daily accountability"

### Tools for Adding Overlays
- Figma (design tool - recommended)
- Sketch (Mac only)
- Photoshop
- Canva (simpler option)
- Apple Keynote (quick mockups)

---

## Implementation Timeline

**Estimated time: 3-4 hours**

### Hour 1: Setup
- Create seed script
- Set up simulators
- Verify demo account
- Test data population

### Hour 2: Capture
- Screenshot 1-3 (all device sizes)
- Quality checks

### Hour 3: Capture
- Screenshot 4-6 (all device sizes)
- Quality checks

### Hour 4: Review & Polish
- Verify all 24 files
- Run through complete checklist
- Optional: Add caption overlays
- Organize files for upload

---

## Success Criteria

Screenshots are ready for App Store Connect when:

- [ ] **Complete:** All 24 files captured (6 screens × 4 sizes)
- [ ] **Accurate:** All files meet exact pixel dimensions
- [ ] **Standard:** Status bars show 9:41 AM, full signal, full battery
- [ ] **Clean:** No personal or debug data visible
- [ ] **Consistent:** Content matches specifications in this doc
- [ ] **Branded:** Color accuracy verified (cream #FFF8E7 background)
- [ ] **Legible:** All text readable at thumbnail size
- [ ] **Organized:** Files named and organized consistently
- [ ] **Reproducible:** Demo account can recreate screenshots on demand
- [ ] **Approved:** Design and product team sign-off obtained

---

## Troubleshooting

### Common Issues

**Status bar shows wrong time:**
- Simulators default to system time
- Use `xcrun simctl status_bar` to override (iOS 14+)
- Or manually set device time to 9:41 AM

**Colors look washed out:**
- Verify color space is sRGB
- Check simulator color profile settings
- Compare to design system colors in code

**Text too small to read:**
- Verify font sizes in code match design system
- Consider increasing key text sizes for screenshots
- Test legibility at 50% zoom

**Screenshots different sizes than expected:**
- Verify simulator device model
- Check safe area insets are correct
- Ensure no zoom/scale settings applied

**Seed data not appearing:**
- Verify API connection in simulator
- Check network permissions
- Look for errors in React Native console
- Verify demo account authentication

---

## Next Steps After Completion

1. **Upload to App Store Connect**
   - Navigate to "App Store" tab
   - Under "App Screenshots", upload files for each device size
   - Arrange screenshots in order (1-6)
   - Preview on different devices

2. **Write Screenshot Descriptions** (optional, but recommended)
   - Each screenshot can have alt text for accessibility
   - Keep under 170 characters per description

3. **Get Feedback**
   - Share with team for review
   - Test on actual devices if possible
   - A/B test different screenshot orders (post-launch)

4. **Prepare App Preview Video** (optional, high impact)
   - 15-30 seconds
   - Similar theme to screenshots
   - See APP_STORE_FINAL.md for video concept

---

## Reference Documents

- **App Store Copy:** `/marketing/APP_STORE_FINAL.md`
- **Design State:** `/.claude/state/design.md`
- **Mobile App Screens:** `/mobile/app/`
- **Design System:** `/mobile/src/theme/colors.ts`

---

**Document Status:** Ready for implementation
**Owner:** Design Agent
**Last Updated:** 2026-01-28
**Questions:** Contact design team or reference source documents

---

**END OF SCREENSHOT PLAN**
