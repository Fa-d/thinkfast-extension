import type { Session, DailyStats, Goal, Settings, InterventionResult } from '../types/models';

/**
 * Chrome Storage Service
 * Wrapper around Chrome Storage API with type-safe methods
 * Uses chrome.storage.local for large data and chrome.storage.sync for settings
 */
export class StorageService {
  // Settings Management (Chrome Storage Sync - synced across devices)

  static async getSettings(): Promise<Settings> {
    const result = await chrome.storage.sync.get('settings');
    return (result?.settings as Settings) || this.getDefaultSettings();
  }

  static async saveSettings(settings: Settings): Promise<void> {
    await chrome.storage.sync.set({ settings });
    // Note: Supabase sync will be handled separately
  }

  static getDefaultSettings(): Settings {
    return {
      timerDurationMinutes: 10,
      alwaysShowReminder: true,
      overlayStyle: 'full',
      frictionLevel: 'auto',
      snoozeEnabled: true,
      snoozeDurationMinutes: 30,
      trackedSites: [], // No default tracked sites - user must add via Goals
      theme: 'light',
      notificationsEnabled: true,
      morningNotificationTime: '08:00',
      eveningNotificationTime: '20:00'
    };
  }

  static getDefaultTrackedSites() {
    // Kept for reference but not used by default
    // Users can add these via the "Popular Sites" preset in WebsiteManager
    return [];
  }

  // Goals Management (Chrome Storage Local)

  static async getGoals(): Promise<Goal[]> {
    const result = await chrome.storage.local.get('goals');
    return (result?.goals as Goal[]) || [];
  }

  static async saveGoal(goal: Goal): Promise<void> {
    const goals = await this.getGoals();
    const index = goals.findIndex(g => g.id === goal.id);
    if (index >= 0) {
      goals[index] = goal;
    } else {
      goals.push(goal);
    }
    await chrome.storage.local.set({ goals });
  }

  static async deleteGoal(goalId: string): Promise<void> {
    const goals = await this.getGoals();
    const filtered = goals.filter(g => g.id !== goalId);
    await chrome.storage.local.set({ goals: filtered });
  }

  // Daily Stats Management (Chrome Storage Local)

  static async getDailyStats(date?: string): Promise<DailyStats> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const key = `stats_${targetDate}`;
    const result = await chrome.storage.local.get(key);
    return (result?.[key] as DailyStats) || this.createEmptyStats(targetDate);
  }

  static async saveDailyStats(date: string, stats: DailyStats): Promise<void> {
    const key = `stats_${date}`;
    await chrome.storage.local.set({ [key]: stats });
  }

  static async getStatsRange(startDate: string, endDate: string): Promise<DailyStats[]> {
    const stats: DailyStats[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayStat = await this.getDailyStats(dateStr);
      stats.push(dayStat);
    }

    return stats;
  }

  static createEmptyStats(date: string): DailyStats {
    return {
      date,
      totalMinutes: 0,
      sessionCount: 0,
      siteBreakdown: {},
      interventionsShown: 0,
      goBackCount: 0,
      proceedCount: 0,
      currentStreak: 0,
      longestStreak: 0
    };
  }

  // Session Management (Chrome Storage Local)

  static async getSessions(): Promise<Session[]> {
    const result = await chrome.storage.local.get('sessions');
    return (result?.sessions as Session[]) || [];
  }

  static async saveSession(session: Session): Promise<void> {
    const sessions = await this.getSessions();
    sessions.push(session);
    // Keep only last 100 sessions to prevent storage overflow
    const trimmed = sessions.slice(-100);
    await chrome.storage.local.set({ sessions: trimmed });
  }

  static async updateSession(session: Session): Promise<void> {
    const sessions = await this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
      await chrome.storage.local.set({ sessions });
    }
  }

  static async saveCompletedSession(session: Session): Promise<void> {
    await this.updateSession(session);
    // Optionally: move to completed sessions list or aggregate to daily stats
  }

  // Intervention Results Management (Chrome Storage Local)

  static async getInterventionResults(): Promise<InterventionResult[]> {
    const result = await chrome.storage.local.get('interventionResults');
    return (result?.interventionResults as InterventionResult[]) || [];
  }

  static async saveInterventionResult(result: InterventionResult): Promise<void> {
    const results = await this.getInterventionResults();
    results.push(result);
    // Keep only last 200 results
    const trimmed = results.slice(-200);
    await chrome.storage.local.set({ interventionResults: trimmed });
  }

  // User ID Management (Chrome Storage Sync)

  static async getUserId(): Promise<string | null> {
    const result = await chrome.storage.sync.get('userId');
    return (result?.userId as string) || null;
  }

  static async saveUserId(userId: string): Promise<void> {
    await chrome.storage.sync.set({ userId });
  }

  static async clearUserId(): Promise<void> {
    await chrome.storage.sync.remove('userId');
  }

  // Last Sync Timestamp (Chrome Storage Local)

  static async getLastSync(): Promise<string | null> {
    const result = await chrome.storage.local.get('lastSync');
    return (result?.lastSync as string) || null;
  }

  static async updateLastSync(): Promise<void> {
    const now = new Date().toISOString();
    await chrome.storage.local.set({ lastSync: now });
  }

  // Clear All Data

  static async clearAllData(): Promise<void> {
    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();
  }

  // Export/Import Data (for backup/restore)

  static async exportData(): Promise<string> {
    const [settings, goals, sessions, results] = await Promise.all([
      this.getSettings(),
      this.getGoals(),
      this.getSessions(),
      this.getInterventionResults()
    ]);

    const data = {
      settings,
      goals,
      sessions,
      interventionResults: results,
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(data, null, 2);
  }

  static async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);

    if (data.settings) await this.saveSettings(data.settings);
    if (data.goals) await chrome.storage.local.set({ goals: data.goals });
    if (data.sessions) await chrome.storage.local.set({ sessions: data.sessions });
    if (data.interventionResults) {
      await chrome.storage.local.set({ interventionResults: data.interventionResults });
    }
  }
}
