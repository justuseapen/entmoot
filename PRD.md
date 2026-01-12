# Entmoot - Family Multi-Scale Planning Platform

## Product Requirements Document (PRD)

**Version:** 1.1
**Last Updated:** January 2026
**Status:** Draft

---

## 1. Executive Summary

Entmoot is a SaaS web application that helps families coordinate their lives through multi-scale planning - from daily tasks to annual goals. Named after the deliberate council of Ents in Tolkien's Lord of the Rings, Entmoot embodies thoughtful, collaborative family decision-making.

The platform enables families to:
- Set and track SMART goals across multiple time horizons
- Conduct structured daily planning and nightly reflections
- Review progress at weekly, monthly, quarterly, and annual intervals
- Leverage AI coaching for goal refinement, personalized prompts, and progress analysis
- Share goals selectively between family members with flexible visibility controls

---

## 2. Problem Statement

Modern families struggle to:
1. **Coordinate across time scales** - Daily chaos disconnects from long-term aspirations
2. **Maintain consistency** - Planning happens sporadically without structured cadences
3. **Include all members** - From toddlers to grandparents, everyone has different needs
4. **Learn from experience** - Without reflection, the same mistakes repeat
5. **Stay aligned** - Individual goals drift from shared family priorities

Existing tools (Notion, Todoist, paper planners) lack:
- Multi-generational family-specific features
- Integrated reflection and review workflows
- AI-powered coaching and goal refinement
- Cascading goal relationships across time horizons

---

## 3. Target Users

### Primary Users
- **Family Administrators** (typically parents): Manage family settings, invite members, oversee shared goals
- **Adult Family Members**: Full access to personal and shared planning features
- **Teen/Tween Members** (10-17): Age-appropriate goal setting with optional parental visibility
- **Extended Family** (grandparents, etc.): View and assist with family goals, limited admin access

### Secondary Users
- **Young Children** (under 10): Represented by parents, goals managed on their behalf
- **Pets**: Tracked as family members for care tasks (vet visits, feeding schedules, etc.)

---

## 4. Landing Page & Marketing

### 4.1 Public Landing Page

The landing page is the first impression for potential users. It should clearly communicate value and drive sign-ups.

#### 4.1.1 Hero Section
- **Headline:** "Your Family's Goals, Finally In Sync"
- **Subheadline:** "From morning routines to yearly dreams—Entmoot helps your family plan together, reflect together, and grow together."
- **Primary CTA:** "Start Your Family's Journey" (leads to registration)
- **Secondary CTA:** "See How It Works" (scrolls to features)
- **Hero visual:** Warm illustration of a family gathered around a tree (the Entmoot), with goal bubbles floating upward

#### 4.1.2 Problem/Solution Section
- **Header:** "Sound Familiar?"
- Pain points presented as relatable scenarios:
  - "Monday's chaos erases Sunday's best intentions"
  - "Everyone's calendar is full, but nothing important gets done"
  - "Kids have goals too—but they're stuck in your head, not a system"
  - "You meant to do that annual review... six months ago"
- **Transition:** "Entmoot brings calm to the chaos"

#### 4.1.3 Features Overview
Present key features with icons and brief descriptions:

1. **Multi-Scale Planning**
   - "From today's to-dos to this year's dreams"
   - Daily, weekly, monthly, quarterly, and annual planning in one place

2. **Family-First Design**
   - "Everyone has a seat at the table"
   - Age-appropriate interfaces for kids, teens, and adults
   - Shared family goals alongside personal ones

3. **AI-Powered Coaching**
   - "Your family's personal goal coach"
   - Smart goal refinement, personalized reflection prompts
   - Pattern recognition to help you improve

4. **Morning & Evening Rituals**
   - "Start and end each day with intention"
   - Guided planning and reflection flows
   - Build habits that stick

5. **Celebrate Together**
   - "Make progress visible and fun"
   - Streaks, badges, points, and family leaderboards
   - Turn goal-setting into a family tradition

#### 4.1.4 Social Proof Section
- Testimonial placeholders (to be populated post-launch)
- "Trusted by X families" counter (once metrics available)
- Family-friendly trust badges (privacy-focused, COPPA-aware)

#### 4.1.5 How It Works
Three-step visual flow:
1. **Create Your Family** - "Set up your family in minutes. Invite everyone from grandparents to teens."
2. **Set Goals Together** - "Choose what matters—from daily habits to annual dreams. AI helps make them SMART."
3. **Reflect & Grow** - "Morning planning, evening reflection. Watch your family transform."

#### 4.1.6 Pricing Preview
- "Free to start" badge prominently displayed
- Simple tier overview (details TBD):
  - **Free:** Up to 4 family members, core features
  - **Family:** Unlimited members, AI coaching, integrations
  - **Extended:** Multi-family support, priority support

#### 4.1.7 Final CTA Section
- **Header:** "Ready to help your family thrive?"
- **Subtext:** "Join thousands of families turning chaos into calm"
- **CTA Button:** "Create Your Free Family Account"
- **Reassurance:** "No credit card required. Set up in 2 minutes."

#### 4.1.8 Footer
- Links: About, Blog, Help Center, Privacy, Terms
- Social media links
- Contact email
- *"Don't be hasty." - Treebeard* tagline

---

## 5. Onboarding Flow

### 5.1 Registration

#### 5.1.1 Sign-Up Form
- Email address
- Password (with strength indicator)
- First name
- "How did you hear about us?" (optional, for analytics)
- Terms of service and privacy policy checkbox
- "Create Account" button
- OAuth alternatives: "Continue with Google" / "Continue with Apple"

#### 5.1.2 Email Verification
- Send verification email immediately
- Show "Check your email" screen with:
  - Resend option (with cooldown)
  - "Wrong email?" edit option
  - What to expect next

### 5.2 Family Setup Wizard

After email verification, guide users through family creation with a friendly, step-by-step wizard.

#### 5.2.1 Welcome Screen
- Warm greeting: "Welcome to Entmoot, [First Name]!"
- Brief explanation: "Let's set up your family in just a few steps"
- Progress indicator showing 4-5 steps ahead
- "Let's Go" button

#### 5.2.2 Step 1: Name Your Family
- Input: Family name (e.g., "The Smiths", "Team Garcia", "Our Crew")
- Optional: Upload family photo/avatar
- Helpful suggestion: "This is how your family will appear in the app"
- Skip option for photo

#### 5.2.3 Step 2: Set Your Timezone
- Auto-detect timezone with confirmation
- Dropdown to change if incorrect
- Explanation: "We'll use this for your morning and evening planning reminders"

#### 5.2.4 Step 3: Your Role
- Confirm user's role (defaults to Admin)
- Brief explanation of what Admin can do
- Option to add birthday (for age-appropriate features)

#### 5.2.5 Step 4: Invite Family Members (Optional)
- "Who else is in your family?"
- Add members by email with role selection:
  - Adult, Teen (13-17), Child (under 13), Observer
- Bulk invite option: paste multiple emails
- "I'll do this later" skip option
- Note: Child accounts require parental management

#### 5.2.6 Step 5: Choose Your Starting Point
Present options based on current date/time:
- **"Start with today"** - Jump into daily planning
- **"Set a weekly goal"** - Begin with a 7-day focus
- **"Create your first big goal"** - Start with something meaningful
- **"Just explore"** - Free exploration mode

### 5.3 First-Run Experience

After the wizard, provide contextual guidance within the app.

#### 5.3.1 Guided Tour (Optional)
- Offer a quick product tour: "Want a quick tour?"
- Highlight key areas:
  1. Dashboard overview
  2. How to create a goal
  3. Daily planning flow
  4. Where to find family members
- Dismissable at any point
- "Show me later" option saves preference

#### 5.3.2 First Goal Prompt
If user hasn't created a goal within first session:
- Gentle prompt: "What's one thing you'd like to accomplish this week?"
- Pre-filled suggestions based on common family goals:
  - "Have dinner together 3 times"
  - "Exercise as a family once"
  - "Complete a home project"
  - "Start a new bedtime routine"
- AI refinement offered immediately

#### 5.3.3 First Reflection Prompt
Based on time of day at first login:
- **Morning:** "What's your top priority for today?"
- **Evening:** "What's one thing that went well today?"
- Lightweight, single-question to reduce friction

#### 5.3.4 Progress Celebration
After first meaningful action (goal created, reflection completed):
- Celebratory animation (confetti, gentle)
- Encouraging message: "You're off to a great start!"
- Suggest next step without being pushy

### 5.4 Ongoing Onboarding (Drip Education)

Spread learning over the first 2 weeks via contextual tips and emails.

#### 5.4.1 In-App Tips
- Contextual tooltips that appear once:
  - First time on Goals page: "Pro tip: Link daily goals to weekly goals to see how small wins add up"
  - First reflection: "Reflection is the secret sauce—even 2 minutes makes a difference"
  - First family member joins: "Now you can share goals! Try creating a family goal together"

#### 5.4.2 Onboarding Email Sequence
- **Day 1:** Welcome + getting started recap
- **Day 3:** "Have you tried morning planning?" (if not used)
- **Day 5:** "Meet your AI coach" - highlight goal refinement
- **Day 7:** "Time for your first weekly review!"
- **Day 14:** "How's it going?" - feedback request + feature highlights

#### 5.4.3 Empty State Guidance
When sections are empty, provide helpful prompts:
- **No goals:** "Your goals will appear here. Ready to set your first one?"
- **No reflections:** "Reflections help you learn from each day. Start your first one tonight?"
- **No family members:** "Entmoot is better together. Invite your family!"

### 5.5 Onboarding Metrics

Track to measure onboarding effectiveness:
- Wizard completion rate (per step)
- Time to first goal creation
- Time to first reflection
- Day 7 retention rate
- Family member invite rate
- Tour completion rate

---

## 6. Bug Reporting & Feedback System

### 6.1 In-App Bug Reporter

A persistent, accessible bug reporting mechanism available throughout the application.

#### 6.1.1 Access Points
- **Floating Feedback Button:** Small, unobtrusive button in bottom-right corner
  - Icon: Speech bubble or flag
  - Label: "Feedback" or "Help"
  - Collapsible/hideable via settings
- **Help Menu:** "Report a Bug" option in user dropdown/settings
- **Keyboard Shortcut:** Ctrl/Cmd + Shift + F for power users
- **Error Boundaries:** Automatic prompt when app crashes

#### 6.1.2 Bug Report Form
Quick, friction-free form:
- **Type selector:** Bug / Feature Request / General Feedback
- **Title:** Brief summary (required)
- **Description:** What happened? What did you expect? (required for bugs)
- **Screenshot attachment:**
  - Auto-capture current screen option
  - Upload from device option
  - Annotation tools (highlight, redact)
- **Severity:** (for bugs) Blocker / Major / Minor / Cosmetic
- **Contact preference:** "May we follow up?" checkbox + email (pre-filled)

#### 6.1.3 Automatic Context Capture
Automatically include (with user consent disclosure):
- Current page/URL
- Browser and OS info
- Screen resolution
- User ID (anonymized option available)
- Recent console errors (sanitized)
- Timestamp
- App version

#### 6.1.4 Submission Flow
1. User opens feedback widget
2. Selects type (Bug/Feature/Feedback)
3. Fills form (2-3 fields max for quick bugs)
4. Optional: annotate screenshot
5. Submit
6. Confirmation: "Thanks! We've received your feedback."
7. Optional: Email confirmation with ticket reference

### 6.2 Feedback Management (Internal)

#### 6.2.1 Feedback Dashboard
Admin interface to manage incoming feedback:
- List view with filters (type, severity, status, date)
- Status workflow: New → Acknowledged → In Progress → Resolved → Closed
- Assignment to team members
- Tagging/categorization system
- Duplicate detection

#### 6.2.2 User Communication
- Auto-response on submission
- Status update notifications (optional, user preference)
- Resolution notification: "Your reported issue has been fixed!"

### 6.3 Proactive Feedback Collection

#### 6.3.1 NPS Surveys
- Trigger after 30 days of active use
- Simple 0-10 scale: "How likely are you to recommend Entmoot?"
- Follow-up question based on score
- Maximum frequency: Once per quarter

#### 6.3.2 Feature-Specific Feedback
- After using new features for first time
- Thumbs up/down quick reaction
- Optional: "Tell us more" expansion

#### 6.3.3 Session Feedback
- Occasional prompt after completing key flows (weekly review, goal completion)
- "How was this experience?" with emoji scale
- Non-blocking, easily dismissable

### 6.4 Technical Implementation

#### 6.4.1 Data Model
```
FeedbackReport
├── type (bug, feature_request, feedback)
├── title
├── description
├── severity (for bugs)
├── status (new, acknowledged, in_progress, resolved, closed)
├── user_id (optional, for anonymous)
├── context_data (JSON: url, browser, etc.)
├── screenshots (attachments)
├── created_at
├── resolved_at
└── internal_notes
```

#### 6.4.2 API Endpoints
- `POST /api/v1/feedback` - Submit feedback
- `GET /api/v1/feedback/:id` - Get status (for user's own reports)
- Admin endpoints for management (separate admin namespace)

#### 6.4.3 Third-Party Integration Options
Consider integration with:
- **Sentry:** For automatic error capture and correlation
- **Linear/Jira:** For bug tracking workflow
- **Intercom/Zendesk:** For user communication
- Build custom initially, integrate as needed

---

## 7. Core Features

### 7.1 Family & Member Management

#### 7.1.1 Family Account Setup
- Family registration with admin user
- Family profile (name, photo, timezone, preferences)
- Subscription management (free tier initially)

#### 7.1.2 Member Management
- Invite members via email/link
- Member roles: Admin, Adult, Teen, Child (managed), Observer (extended family)
- Member profiles: name, avatar, birthday, role, notification preferences
- Pet profiles: name, type, photo, care schedule

#### 7.1.3 Visibility & Sharing Controls
- Personal goals (private to individual)
- Shared goals (visible to selected members)
- Family goals (visible to all members)
- Role-based default visibility settings

### 7.2 Multi-Scale Planning System

#### 7.2.1 Annual Planning & Review
- Annual theme/word of the year
- Long-term vision statements (personal and family)
- Annual SMART goals (3-7 recommended)
- Year-end review workflow:
  - Celebrate wins
  - Analyze incomplete goals
  - Extract lessons learned
  - Set intentions for next year

#### 7.2.2 Quarterly Planning & Review
- Quarterly objectives derived from annual goals (loose linking)
- Key results for each objective
- 90-day sprint mentality
- Quarterly review workflow:
  - Progress against objectives
  - Adjust annual goals if needed
  - Plan next quarter priorities

#### 7.2.3 Monthly Planning & Review
- Monthly focus areas
- Habit tracking setup/adjustment
- Monthly review workflow:
  - What worked/didn't work
  - Habit streaks and patterns
  - Upcoming month preview

#### 7.2.4 Weekly Planning & Review
- Weekly priorities (top 3-5 items)
- Calendar review and time blocking
- Weekly review workflow:
  - Task completion rate
  - Energy and mood patterns
  - Wins and gratitude
  - Next week intentions

#### 7.2.5 Daily Planning & Reflection

**Morning Planning:**
- Today's top 3 priorities
- Time-blocked schedule review
- Daily intentions/affirmations
- Quick checklist of must-dos

**Evening Reflection:**
- Task completion check-in
- Guided reflection prompts:
  - What went well today?
  - What was challenging?
  - What am I grateful for?
  - What will I do differently tomorrow?
- Mood/energy tracking (optional)
- Tomorrow preview

### 7.3 SMART Goal System

#### 7.3.1 Goal Creation
- Goal title and description
- SMART criteria fields:
  - **Specific**: Clear, well-defined objective
  - **Measurable**: Quantifiable success metrics
  - **Achievable**: Realistic given resources/constraints
  - **Relevant**: Aligned with values and higher-level goals
  - **Time-bound**: Clear deadline or timeframe
- Goal category/tags
- Linked parent goal (optional)
- Assigned family members
- Visibility settings

#### 7.3.2 Goal Tracking
- Progress percentage or milestone tracking
- Check-in reminders
- Status: Not Started, In Progress, At Risk, Completed, Abandoned
- Notes and updates log

#### 7.3.3 Goal Relationships
- Loose linking to parent goals (daily → weekly → monthly → quarterly → annual)
- Visual goal tree/hierarchy view
- Impact analysis (how daily actions connect to annual vision)

### 7.4 AI Coaching Features

#### 7.4.1 SMART Goal Refinement
- AI analyzes draft goals
- Suggests improvements for each SMART criterion
- Offers alternative phrasings
- Identifies potential obstacles
- Recommends measurable milestones

#### 7.4.2 Reflection Prompts
- Personalized prompts based on:
  - Recent goal progress
  - Historical patterns
  - Time of year/life events
  - Family context
- Adaptive difficulty (deeper prompts as user matures)
- Themed prompt sets (gratitude, growth, relationships, etc.)

#### 7.4.3 Progress Analysis
- Pattern recognition across time
- Identify peak productivity times
- Spot recurring blockers
- Suggest goal adjustments
- Celebrate consistency and streaks
- Gentle accountability nudges

#### 7.4.4 Family Insights
- Cross-member goal alignment suggestions
- Family meeting agenda generation
- Conflict detection (overcommitment, competing priorities)
- Shared celebration prompts

### 7.5 Calendar Integration

#### 7.5.1 Supported Calendars
- Google Calendar (read/write)
- Apple Calendar via iCloud (read/write)
- Outlook/Microsoft 365 (read/write)
- CalDAV generic support

#### 7.5.2 Sync Features
- Two-way sync for planning blocks
- Import existing events for context
- Export goals/tasks as calendar events
- Time blocking suggestions based on goals

### 7.6 Notifications & Reminders

#### 7.6.1 Notification Channels
- In-app notifications
- Email digests (daily, weekly, monthly)
- Push notifications (web and mobile)
- SMS for critical reminders (optional, future)

#### 7.6.2 Reminder Types
- Morning planning prompt
- Evening reflection prompt
- Goal check-in reminders
- Review period reminders (weekly, monthly, quarterly, annual)
- Shared goal updates from family members
- Streak maintenance alerts

#### 7.6.3 Notification Preferences
- Per-channel toggle
- Quiet hours
- Frequency controls
- Per-goal reminder customization

---

## 8. Technical Architecture

### 8.1 Technology Stack

#### Backend
- **Framework:** Ruby on Rails 7.x (API mode + some server-rendered views)
- **Database:** PostgreSQL 15+
- **Cache:** Redis
- **Background Jobs:** Sidekiq
- **Authentication:** Devise + JWT for API
- **Authorization:** Pundit
- **AI Integration:** OpenAI API (GPT-4) / Anthropic Claude API

#### Frontend (Web)
- **Framework:** React 18+ with TypeScript
- **State Management:** Zustand or Redux Toolkit
- **Styling:** Tailwind CSS
- **Component Library:** Radix UI or Shadcn/ui
- **API Client:** React Query (TanStack Query)
- **Routing:** React Router v6

#### Mobile (Future Phase)
- **Framework:** React Native
- **Navigation:** React Navigation
- **Shared Logic:** Shared TypeScript utilities with web

#### Infrastructure
- **Hosting:** American Cloud (details TBD)
- **CDN:** CloudFlare
- **File Storage:** S3-compatible object storage
- **Email:** SendGrid or Postmark
- **Monitoring:** Sentry, LogRocket

### 8.2 Data Models (High-Level)

```
Family
├── Members (polymorphic: User, Pet)
├── Goals
├── Reviews
└── Settings

User
├── Profile
├── Goals (personal)
├── Reflections
├── NotificationPreferences
└── CalendarConnections

Goal
├── SMART fields
├── TimeScale (daily, weekly, monthly, quarterly, annual)
├── Status
├── Progress entries
├── ParentGoal (optional)
└── AssignedMembers

Reflection
├── Type (morning, evening, weekly, monthly, quarterly, annual)
├── Prompts & Responses
├── Mood/Energy (optional)
└── LinkedGoals

Review
├── Period (week, month, quarter, year)
├── Metrics snapshot
├── Insights
└── NextPeriodIntentions
```

### 8.3 API Design
- RESTful JSON API for CRUD operations
- GraphQL consideration for complex family data fetching (evaluate in Phase 2)
- WebSocket/ActionCable for real-time updates
- Rate limiting and API versioning

---

## 9. User Experience

### 9.1 Key Screens

1. **Landing Page** - Public marketing page with value proposition and sign-up CTAs
2. **Registration/Login** - Sign-up form, OAuth options, email verification
3. **Onboarding Wizard** - Family setup flow for new users
4. **Dashboard** - Today's plan, upcoming reviews, family activity feed
5. **Goal Browser** - Filter by time scale, member, status; visual hierarchy
6. **Daily Planner** - Morning planning and evening reflection interface
7. **Review Wizard** - Guided review flows for each cadence
8. **Family Hub** - Member management, shared goals, family calendar
9. **AI Coach** - Chat interface for goal refinement and advice
10. **Settings** - Profile, notifications, integrations, family admin
11. **Feedback Widget** - Persistent bug report/feedback form (accessible from all screens)

### 9.2 Design Principles
- **Calm and focused** - Reduce overwhelm, progressive disclosure
- **Family-friendly** - Warm colors, approachable typography, optional playful elements for kids
- **Mobile-first** - Responsive design, touch-friendly targets
- **Accessible** - WCAG 2.1 AA compliance, screen reader support

---

## 10. Security & Privacy

### 10.1 Authentication
- Email/password with strong password requirements
- Magic link login option
- OAuth (Google, Apple) for convenience
- Two-factor authentication (TOTP)

### 10.2 Data Privacy
- Family data strictly isolated (multi-tenant)
- End-to-end encryption for sensitive reflections (consideration)
- GDPR-compliant data export and deletion
- Clear data retention policies
- AI prompts do not store personal data beyond session

### 10.3 Child Safety
- COPPA considerations for users under 13
- Parental consent workflows
- Age-appropriate content filtering

---

## 11. Success Metrics

### 11.1 Engagement Metrics
- Daily active users (DAU) per family
- Reflection completion rate
- Goal completion rate by time scale
- Review completion rate
- Streak lengths (daily planning consistency)

### 11.2 Outcome Metrics
- User-reported goal achievement satisfaction
- Family alignment score (shared goal participation)
- Retention rate (weekly, monthly)
- NPS score

---

## 12. Phased Rollout

### Phase 1: Foundation (MVP)
- Public landing page with marketing copy
- User registration and authentication
- Family setup wizard (onboarding flow)
- Family and member management
- SMART goal CRUD with loose linking
- Daily planning and reflection (hybrid: checklist + prompts)
- Weekly review workflow
- Basic notifications (in-app + email)
- AI SMART goal refinement (Anthropic Claude)
- Gamification system (streaks, badges, points, family leaderboards)
- In-app bug reporting and feedback system

### Phase 2: Full Cadences
- Monthly, quarterly, annual planning and reviews
- Calendar integration (Google first)
- Enhanced AI reflection prompts
- Progress analytics dashboard
- Push notifications

### Phase 3: Mobile & Polish
- React Native mobile app
- Offline support
- Advanced AI insights (pattern recognition)
- Additional calendar integrations
- Family insights and suggestions

### Phase 4: Growth
- Public launch / marketing
- Subscription tiers
- API for third-party integrations
- Community features (templates, shared wisdom)

---

## 13. Decisions Made

1. **AI Provider:** Anthropic Claude - better at nuanced reflection prompts
2. **Gamification:** Full system in MVP - streaks, badges, points, family leaderboards
3. **Offline Support:** Defer to Phase 2+ (PWA service worker)
4. **Child Accounts:** Basic support in MVP, full COPPA compliance in Phase 2+
5. **Family Templates:** Defer to Phase 3+
6. **Onboarding:** Step-by-step wizard in MVP, drip email education over 2 weeks
7. **Feedback System:** Custom in-app widget in MVP, third-party integration (Sentry/Linear) as needed
8. **Landing Page:** Single-page marketing site in MVP, separate marketing site consideration in Phase 4

---

## 14. Appendix

### A. Competitor Analysis
- **Notion:** Flexible but requires DIY setup, no family-specific features
- **Todoist:** Task-focused, lacks reflection and multi-scale planning
- **Day One:** Journal-focused, no goal tracking or family sharing
- **Cozi:** Family calendar focused, lacks goal/reflection depth
- **Full Focus Planner:** Paper-based, no digital collaboration

### B. User Research Insights
(To be populated after user interviews)

### C. Wireframes
(To be added)

---

*"Don't be hasty." - Treebeard*
