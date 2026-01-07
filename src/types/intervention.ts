// Intervention system types

export type InterventionType = 'REMINDER' | 'TIMER';

export type ContentType =
  | 'REFLECTION'
  | 'TIME_ALTERNATIVE'
  | 'BREATHING'
  | 'STATS'
  | 'QUOTE'
  | 'ACTIVITY'
  | 'EMOTIONAL'
  | 'GAMIFICATION';

export type FrictionLevel = 'gentle' | 'moderate' | 'firm' | 'locked' | 'auto';

export interface InterventionContext {
  timeOfDay: number;
  dayOfWeek: number;
  isWeekend: boolean;
  totalUsageToday: number;
  sessionCount: number;
  quickReopenAttempt: boolean;
  streakDays: number;
  isOverGoal: boolean;
}

export interface InterventionContent {
  type: ContentType;
  data: any;
  id: string;
}

export interface ReflectionContent {
  id: string;
  question: string;
  category: 'trigger' | 'priority' | 'emotional' | 'pattern' | 'future';
}

export interface TimeAlternativeContent {
  id: string;
  duration: string;
  alternatives: string[];
}

export interface BreathingContent {
  id: string;
  variant: '4-7-8' | 'box' | 'calm';
  name: string;
  duration: number;
}

export interface QuoteContent {
  id: string;
  text: string;
  author: string;
}

export interface ActivityContent {
  id: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
  suggestion: string;
  benefit: string;
}

export interface StatsContent {
  todayUsage: number;
  weeklyAverage: number;
  goalProgress: number;
  streakDays: number;
}

export interface FrictionConfig {
  level: FrictionLevel;
  delaySeconds: number;
  requireAction: boolean;
  showTimer: boolean;
}

export const FRICTION_CONFIGS: Record<FrictionLevel, Omit<FrictionConfig, 'level'>> = {
  gentle: {
    delaySeconds: 0,
    requireAction: false,
    showTimer: false
  },
  moderate: {
    delaySeconds: 3,
    requireAction: false,
    showTimer: true
  },
  firm: {
    delaySeconds: 7,
    requireAction: false,
    showTimer: true
  },
  locked: {
    delaySeconds: 15,
    requireAction: true,
    showTimer: true
  },
  auto: {
    delaySeconds: 0,
    requireAction: false,
    showTimer: false
  }
};
