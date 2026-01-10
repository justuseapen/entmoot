# Entmoot - Family Multi-Scale Planning Platform

## Product Requirements Document (PRD)

**Version:** 1.0
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

## 4. Core Features

### 4.1 Family & Member Management

#### 4.1.1 Family Account Setup
- Family registration with admin user
- Family profile (name, photo, timezone, preferences)
- Subscription management (free tier initially)

#### 4.1.2 Member Management
- Invite members via email/link
- Member roles: Admin, Adult, Teen, Child (managed), Observer (extended family)
- Member profiles: name, avatar, birthday, role, notification preferences
- Pet profiles: name, type, photo, care schedule

#### 4.1.3 Visibility & Sharing Controls
- Personal goals (private to individual)
- Shared goals (visible to selected members)
- Family goals (visible to all members)
- Role-based default visibility settings

### 4.2 Multi-Scale Planning System

#### 4.2.1 Annual Planning & Review
- Annual theme/word of the year
- Long-term vision statements (personal and family)
- Annual SMART goals (3-7 recommended)
- Year-end review workflow:
  - Celebrate wins
  - Analyze incomplete goals
  - Extract lessons learned
  - Set intentions for next year

#### 4.2.2 Quarterly Planning & Review
- Quarterly objectives derived from annual goals (loose linking)
- Key results for each objective
- 90-day sprint mentality
- Quarterly review workflow:
  - Progress against objectives
  - Adjust annual goals if needed
  - Plan next quarter priorities

#### 4.2.3 Monthly Planning & Review
- Monthly focus areas
- Habit tracking setup/adjustment
- Monthly review workflow:
  - What worked/didn't work
  - Habit streaks and patterns
  - Upcoming month preview

#### 4.2.4 Weekly Planning & Review
- Weekly priorities (top 3-5 items)
- Calendar review and time blocking
- Weekly review workflow:
  - Task completion rate
  - Energy and mood patterns
  - Wins and gratitude
  - Next week intentions

#### 4.2.5 Daily Planning & Reflection

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

### 4.3 SMART Goal System

#### 4.3.1 Goal Creation
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

#### 4.3.2 Goal Tracking
- Progress percentage or milestone tracking
- Check-in reminders
- Status: Not Started, In Progress, At Risk, Completed, Abandoned
- Notes and updates log

#### 4.3.3 Goal Relationships
- Loose linking to parent goals (daily → weekly → monthly → quarterly → annual)
- Visual goal tree/hierarchy view
- Impact analysis (how daily actions connect to annual vision)

### 4.4 AI Coaching Features

#### 4.4.1 SMART Goal Refinement
- AI analyzes draft goals
- Suggests improvements for each SMART criterion
- Offers alternative phrasings
- Identifies potential obstacles
- Recommends measurable milestones

#### 4.4.2 Reflection Prompts
- Personalized prompts based on:
  - Recent goal progress
  - Historical patterns
  - Time of year/life events
  - Family context
- Adaptive difficulty (deeper prompts as user matures)
- Themed prompt sets (gratitude, growth, relationships, etc.)

#### 4.4.3 Progress Analysis
- Pattern recognition across time
- Identify peak productivity times
- Spot recurring blockers
- Suggest goal adjustments
- Celebrate consistency and streaks
- Gentle accountability nudges

#### 4.4.4 Family Insights
- Cross-member goal alignment suggestions
- Family meeting agenda generation
- Conflict detection (overcommitment, competing priorities)
- Shared celebration prompts

### 4.5 Calendar Integration

#### 4.5.1 Supported Calendars
- Google Calendar (read/write)
- Apple Calendar via iCloud (read/write)
- Outlook/Microsoft 365 (read/write)
- CalDAV generic support

#### 4.5.2 Sync Features
- Two-way sync for planning blocks
- Import existing events for context
- Export goals/tasks as calendar events
- Time blocking suggestions based on goals

### 4.6 Notifications & Reminders

#### 4.6.1 Notification Channels
- In-app notifications
- Email digests (daily, weekly, monthly)
- Push notifications (web and mobile)
- SMS for critical reminders (optional, future)

#### 4.6.2 Reminder Types
- Morning planning prompt
- Evening reflection prompt
- Goal check-in reminders
- Review period reminders (weekly, monthly, quarterly, annual)
- Shared goal updates from family members
- Streak maintenance alerts

#### 4.6.3 Notification Preferences
- Per-channel toggle
- Quiet hours
- Frequency controls
- Per-goal reminder customization

---

## 5. Technical Architecture

### 5.1 Technology Stack

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

### 5.2 Data Models (High-Level)

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

### 5.3 API Design
- RESTful JSON API for CRUD operations
- GraphQL consideration for complex family data fetching (evaluate in Phase 2)
- WebSocket/ActionCable for real-time updates
- Rate limiting and API versioning

---

## 6. User Experience

### 6.1 Key Screens

1. **Dashboard** - Today's plan, upcoming reviews, family activity feed
2. **Goal Browser** - Filter by time scale, member, status; visual hierarchy
3. **Daily Planner** - Morning planning and evening reflection interface
4. **Review Wizard** - Guided review flows for each cadence
5. **Family Hub** - Member management, shared goals, family calendar
6. **AI Coach** - Chat interface for goal refinement and advice
7. **Settings** - Profile, notifications, integrations, family admin

### 6.2 Design Principles
- **Calm and focused** - Reduce overwhelm, progressive disclosure
- **Family-friendly** - Warm colors, approachable typography, optional playful elements for kids
- **Mobile-first** - Responsive design, touch-friendly targets
- **Accessible** - WCAG 2.1 AA compliance, screen reader support

---

## 7. Security & Privacy

### 7.1 Authentication
- Email/password with strong password requirements
- Magic link login option
- OAuth (Google, Apple) for convenience
- Two-factor authentication (TOTP)

### 7.2 Data Privacy
- Family data strictly isolated (multi-tenant)
- End-to-end encryption for sensitive reflections (consideration)
- GDPR-compliant data export and deletion
- Clear data retention policies
- AI prompts do not store personal data beyond session

### 7.3 Child Safety
- COPPA considerations for users under 13
- Parental consent workflows
- Age-appropriate content filtering

---

## 8. Success Metrics

### 8.1 Engagement Metrics
- Daily active users (DAU) per family
- Reflection completion rate
- Goal completion rate by time scale
- Review completion rate
- Streak lengths (daily planning consistency)

### 8.2 Outcome Metrics
- User-reported goal achievement satisfaction
- Family alignment score (shared goal participation)
- Retention rate (weekly, monthly)
- NPS score

---

## 9. Phased Rollout

### Phase 1: Foundation (MVP)
- Family and member management
- SMART goal CRUD with loose linking
- Daily planning and reflection (hybrid: checklist + prompts)
- Weekly review workflow
- Basic notifications (in-app + email)
- AI SMART goal refinement (Anthropic Claude)
- Gamification system (streaks, badges, points, family leaderboards)

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

## 10. Decisions Made

1. **AI Provider:** Anthropic Claude - better at nuanced reflection prompts
2. **Gamification:** Full system in MVP - streaks, badges, points, family leaderboards
3. **Offline Support:** Defer to Phase 2+ (PWA service worker)
4. **Child Accounts:** Basic support in MVP, full COPPA compliance in Phase 2+
5. **Family Templates:** Defer to Phase 3+

---

## 11. Appendix

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
