// Chrome Storage types and keys

import type { Settings, Goal, Session, InterventionResult } from './models';

export interface StorageData {
  settings: Settings;
  goals: Goal[];
  sessions: Session[];
  interventionResults: InterventionResult[];
  lastSync: string;
  userId?: string;
}

export type StorageKey =
  | 'settings'
  | 'goals'
  | 'sessions'
  | 'interventionResults'
  | 'lastSync'
  | 'userId'
  | `stats_${string}`; // Dynamic key for daily stats (e.g., stats_2024-01-05)

export interface ChromeStorageArea {
  get: (keys?: string | string[] | null) => Promise<{ [key: string]: any }>;
  set: (items: { [key: string]: any }) => Promise<void>;
  remove: (keys: string | string[]) => Promise<void>;
  clear: () => Promise<void>;
}

export interface SyncData {
  settings: Settings;
  goals: Goal[];
  sessions: Session[];
  lastModified: string;
}

export interface SupabaseUser {
  id: string;
  email: string;
  created_at: string;
}

export interface SupabaseSettings {
  user_id: string;
  settings: Settings;
  last_modified: string;
}

export interface SupabaseGoal {
  id: string;
  user_id: string;
  site_name: string;
  site_pattern: string;
  daily_limit_minutes: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_modified: string;
}

export interface SupabaseInterventionResult {
  id: string;
  user_id: string;
  session_id: string;
  type: 'REMINDER' | 'TIMER';
  content_type: string;
  user_choice: 'GO_BACK' | 'PROCEED' | 'SNOOZE';
  time_to_show_decision_ms: number;
  timestamp: string;
}
