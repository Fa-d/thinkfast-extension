// Core data models for ThinkFast Chrome Extension

export interface TrackedSite {
  pattern: string;
  name: string;
  icon?: string;
  dailyLimitMinutes: number;
}

export interface Session {
  id: string;
  siteName: string;
  url: string;
  startTime: number;
  lastActiveTime: number;
  totalDuration: number;
  timerStartTime: number;
  lastTimerAlertTime: number;
  dailyLimitMinutes: number;
}

export interface DailyStats {
  date: string;
  totalMinutes: number;
  sessionCount: number;
  siteBreakdown: Record<string, number>;
  interventionsShown: number;
  goBackCount: number;
  proceedCount: number;
  currentStreak: number;
  longestStreak: number;
}

export interface Goal {
  id: string;
  siteName: string;
  sitePattern: string;
  dailyLimitMinutes: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  currentStreak?: number; // Per-app streak
  longestStreak?: number; // Per-app longest streak
}

export interface Settings {
  timerDurationMinutes: number;
  alwaysShowReminder: boolean;
  overlayStyle: 'full' | 'compact';
  frictionLevel: 'gentle' | 'moderate' | 'firm' | 'locked' | 'auto';
  snoozeEnabled: boolean;
  snoozeDurationMinutes: number;
  trackedSites: TrackedSite[];
  theme: 'light' | 'dark' | 'auto';
  notificationsEnabled: boolean;
  morningNotificationTime: string;
  eveningNotificationTime: string;
}

export interface InterventionResult {
  id: string;
  sessionId: string;
  type: 'REMINDER' | 'TIMER';
  contentType: string;
  userChoice: 'GO_BACK' | 'PROCEED' | 'SNOOZE';
  timeToShowDecisionMs: number;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  isPremium: boolean;
}

export interface OnboardingQuest {
  id: string;
  userId: string;
  startDate: string;
  currentDay: number;
  daysCompleted: number;
  isActive: boolean;
  isCompleted: boolean;
  progressPercentage: number;
  nextMilestone?: string;
}

export interface StreakRecovery {
  id: string;
  userId: string;
  brokenStreakDays: number;
  startRecoveryDate: string;
  currentRecoveryDays: number;
  targetRecoveryDays: number;
  isRecoveryComplete: boolean;
  getRecoveryProgress: () => number;
  getRecoveryMessage: () => string;
  calculateRecoveryTarget: () => number;
}

export interface UserBaseline {
  userId: string;
  averageDailyMinutes: number;
  calculatedAt: string;
  daysCounted: number;
  getComparisonMessage: () => string;
}

export const POPULATION_AVERAGE_MINUTES = 120; // 2 hours per day
