// Shared types between web and mobile applications
// These types mirror the backend Rails API responses

// =============================================================================
// User Types
// =============================================================================

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirmation: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RefreshResponse {
  token: string;
  refresh_token: string;
}

export interface ApiError {
  error?: string;
  errors?: Record<string, string[]>;
}

// =============================================================================
// Family Types
// =============================================================================

export type MemberRole = "observer" | "child" | "teen" | "adult" | "admin";

export interface Family {
  id: number;
  name: string;
  timezone: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  role: MemberRole;
  joined_at: string;
}

export interface FamilyWithMembers extends Family {
  members: FamilyMember[];
}

export interface Invitation {
  id: number;
  email: string;
  role: MemberRole;
  expires_at: string;
  created_at: string;
  inviter: {
    id: number;
    name: string;
  };
}

export interface CreateFamilyData {
  name: string;
  timezone: string;
}

export interface UpdateFamilyData {
  name?: string;
  timezone?: string;
  settings?: Record<string, unknown>;
}

export interface InvitationData {
  email: string;
  role: MemberRole;
}

// =============================================================================
// Goal Types
// =============================================================================

export type TimeScale = "daily" | "weekly" | "monthly" | "quarterly" | "annual";

export type GoalStatus =
  | "not_started"
  | "in_progress"
  | "at_risk"
  | "completed"
  | "abandoned";

export type GoalVisibility = "personal" | "shared" | "family";

export interface GoalUser {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface Goal {
  id: number;
  title: string;
  description: string | null;
  time_scale: TimeScale;
  status: GoalStatus;
  visibility: GoalVisibility;
  progress: number;
  due_date: string | null;
  parent_id: number | null;
  family_id: number;
  creator: GoalUser;
  assignees: GoalUser[];
  created_at: string;
  updated_at: string;
  // SMART fields (included in detail view)
  specific?: string | null;
  measurable?: string | null;
  achievable?: string | null;
  relevant?: string | null;
  time_bound?: string | null;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  time_bound?: string;
  time_scale: TimeScale;
  status?: GoalStatus;
  visibility?: GoalVisibility;
  progress?: number;
  due_date?: string;
  parent_id?: number | null;
  assignee_ids?: number[];
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  specific?: string;
  measurable?: string;
  achievable?: string;
  relevant?: string;
  time_bound?: string;
  time_scale?: TimeScale;
  status?: GoalStatus;
  visibility?: GoalVisibility;
  progress?: number;
  due_date?: string;
  parent_id?: number | null;
  assignee_ids?: number[];
}

export interface GoalFilters {
  time_scale?: TimeScale;
  status?: GoalStatus;
  visibility?: GoalVisibility;
  assignee_id?: number;
}

// AI Refinement Types
export interface SmartSuggestions {
  specific: string | null;
  measurable: string | null;
  achievable: string | null;
  relevant: string | null;
  time_bound: string | null;
}

export interface Obstacle {
  obstacle: string;
  mitigation: string;
}

export interface Milestone {
  title: string;
  description: string | null;
  suggested_progress: number;
}

export interface GoalRefinementResponse {
  smart_suggestions: SmartSuggestions;
  alternative_titles: string[];
  alternative_descriptions: string[];
  potential_obstacles: Obstacle[];
  milestones: Milestone[];
  overall_feedback: string;
}

// =============================================================================
// Daily Planning Types
// =============================================================================

export interface DailyTask {
  id: number;
  title: string;
  completed: boolean;
  position: number;
  goal_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TopPriority {
  id: number;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface DailyPlan {
  id: number;
  date: string;
  intention: string | null;
  user_id: number;
  family_id: number;
  tasks: DailyTask[];
  top_priorities: TopPriority[];
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Reflection Types
// =============================================================================

export type ReflectionType =
  | "quick"
  | "evening"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual";

export type MoodType = "great" | "good" | "okay" | "difficult" | "rough";

export interface ReflectionResponse {
  id: number;
  prompt: string;
  response: string;
}

export interface Reflection {
  id: number;
  reflection_type: ReflectionType;
  mood: MoodType | null;
  energy_level: number | null;
  gratitude_items: string[];
  daily_plan_id: number | null;
  user_id: number;
  family_id: number;
  responses: ReflectionResponse[];
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Notification Types
// =============================================================================

export interface Notification {
  id: number;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

export interface NotificationPreference {
  id: number;
  in_app: boolean;
  email: boolean;
  push: boolean;
  morning_planning: boolean;
  evening_reflection: boolean;
  weekly_review: boolean;
  morning_planning_time: string;
  evening_reflection_time: string;
  weekly_review_time: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

// =============================================================================
// Gamification Types
// =============================================================================

export type StreakType = "daily_planning" | "evening_reflection" | "weekly_review";

export interface Streak {
  id: number;
  streak_type: StreakType;
  current_count: number;
  longest_count: number;
  last_activity_date: string | null;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  criteria: Record<string, unknown>;
}

export interface UserBadge {
  id: number;
  badge: Badge;
  earned_at: string;
}

export interface PointsEntry {
  id: number;
  points: number;
  activity_type: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: number;
  name: string;
  avatar_url: string | null;
  total_points: number;
  weekly_points: number;
  streak_count: number;
  badge_count: number;
}

// =============================================================================
// Weekly Review Types
// =============================================================================

export interface WeeklyReview {
  id: number;
  week_start_date: string;
  wins: string[];
  challenges: string[];
  lessons_learned: string | null;
  next_week_priorities: string[];
  completed: boolean;
  user_id: number;
  family_id: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReviewMetrics {
  tasks_completed: number;
  tasks_total: number;
  goals_progressed: number;
  reflections_completed: number;
}

// =============================================================================
// Pet Types
// =============================================================================

export interface Pet {
  id: number;
  name: string;
  pet_type: string;
  avatar_url: string | null;
  birthday: string | null;
  notes: string | null;
  family_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePetData {
  name: string;
  pet_type: string;
  avatar_url?: string;
  birthday?: string;
  notes?: string;
}

export interface UpdatePetData {
  name?: string;
  pet_type?: string;
  avatar_url?: string;
  birthday?: string;
  notes?: string;
}

// =============================================================================
// Device Token Types (Push Notifications)
// =============================================================================

export type DevicePlatform = "ios" | "android" | "web";

export interface DeviceToken {
  id: number;
  token: string;
  platform: DevicePlatform;
  device_name: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDeviceTokenData {
  token: string;
  platform: DevicePlatform;
  device_name?: string;
}

export interface DeleteDeviceTokenData {
  token: string;
}
