import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, logEvent, setUserId, setUserProperties, type Analytics } from 'firebase/analytics';

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

/**
 * Firebase Analytics Service
 * Tracks user events and behavior for insights
 */
export class AnalyticsService {
  private static app: FirebaseApp | null = null;
  private static analytics: Analytics | null = null;
  private static initialized = false;

  /**
   * Initialize Firebase Analytics
   */
  static async initialize() {
    if (this.initialized) return;

    try {
      // Check if Firebase config is available
      if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
        console.warn('[Analytics] Firebase config not found - analytics disabled');
        return;
      }

      this.app = initializeApp(FIREBASE_CONFIG);
      this.analytics = getAnalytics(this.app);
      this.initialized = true;

      console.log('[Analytics] Firebase Analytics initialized');
    } catch (error) {
      console.error('[Analytics] Failed to initialize:', error);
    }
  }

  /**
   * Set user ID for analytics
   */
  static setUser(userId: string) {
    if (!this.analytics) return;
    try {
      setUserId(this.analytics, userId);
    } catch (error) {
      console.error('[Analytics] Error setting user ID:', error);
    }
  }

  /**
   * Set user properties
   */
  static setUserProperty(properties: Record<string, string>) {
    if (!this.analytics) return;
    try {
      setUserProperties(this.analytics, properties);
    } catch (error) {
      console.error('[Analytics] Error setting user properties:', error);
    }
  }

  // ==================== Extension Events ====================

  /**
   * Track extension installation
   */
  static trackInstall() {
    this.logEvent('extension_installed', {
      timestamp: new Date().toISOString(),
      version: chrome.runtime.getManifest().version
    });
  }

  /**
   * Track extension update
   */
  static trackUpdate(previousVersion: string, currentVersion: string) {
    this.logEvent('extension_updated', {
      previous_version: previousVersion,
      current_version: currentVersion,
      timestamp: new Date().toISOString()
    });
  }

  // ==================== Session Events ====================

  /**
   * Track session start
   */
  static trackSessionStart(siteName: string, url: string) {
    this.logEvent('session_start', {
      site_name: siteName,
      url_domain: new URL(url).hostname,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track session end
   */
  static trackSessionEnd(siteName: string, durationMinutes: number) {
    this.logEvent('session_end', {
      site_name: siteName,
      duration_minutes: Math.round(durationMinutes),
      timestamp: new Date().toISOString()
    });
  }

  // ==================== Intervention Events ====================

  /**
   * Track intervention shown
   */
  static trackInterventionShown(type: 'TIMER' | 'REMINDER', contentType: string, context: any) {
    this.logEvent('intervention_shown', {
      intervention_type: type,
      content_type: contentType,
      time_of_day: context.timeOfDay || new Date().getHours(),
      day_of_week: context.dayOfWeek || new Date().getDay(),
      session_count_today: context.sessionCount || 0,
      total_usage_today: Math.round(context.totalUsageToday || 0),
      is_over_goal: context.isOverGoal || false,
      quick_reopen: context.quickReopenAttempt || false,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track user choice on intervention
   */
  static trackInterventionChoice(
    type: 'TIMER' | 'REMINDER',
    contentType: string,
    choice: 'GO_BACK' | 'PROCEED',
    timeToDecisionMs: number
  ) {
    this.logEvent('intervention_choice', {
      intervention_type: type,
      content_type: contentType,
      user_choice: choice,
      time_to_decision_ms: timeToDecisionMs,
      time_to_decision_seconds: Math.round(timeToDecisionMs / 1000),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track intervention effectiveness
   */
  static trackInterventionEffectiveness(
    choice: 'GO_BACK' | 'PROCEED',
    returnedWithin5Minutes: boolean
  ) {
    this.logEvent('intervention_effectiveness', {
      user_choice: choice,
      returned_within_5min: returnedWithin5Minutes,
      effective: choice === 'GO_BACK' || !returnedWithin5Minutes,
      timestamp: new Date().toISOString()
    });
  }

  // ==================== Goal Events ====================

  /**
   * Track goal created
   */
  static trackGoalCreated(goalType: string, targetMinutes: number) {
    this.logEvent('goal_created', {
      goal_type: goalType,
      target_minutes: targetMinutes,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track goal updated
   */
  static trackGoalUpdated(goalType: string, oldTarget: number, newTarget: number) {
    this.logEvent('goal_updated', {
      goal_type: goalType,
      old_target_minutes: oldTarget,
      new_target_minutes: newTarget,
      change_percent: Math.round(((newTarget - oldTarget) / oldTarget) * 100),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track goal achieved
   */
  static trackGoalAchieved(goalType: string, daysInStreak: number) {
    this.logEvent('goal_achieved', {
      goal_type: goalType,
      streak_days: daysInStreak,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track goal failed
   */
  static trackGoalFailed(goalType: string, overageMinutes: number) {
    this.logEvent('goal_failed', {
      goal_type: goalType,
      overage_minutes: Math.round(overageMinutes),
      timestamp: new Date().toISOString()
    });
  }

  // ==================== Streak Events ====================

  /**
   * Track streak milestone
   */
  static trackStreakMilestone(days: number, tier: 'bronze' | 'silver' | 'gold' | 'platinum') {
    this.logEvent('streak_milestone', {
      streak_days: days,
      tier,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track streak broken
   */
  static trackStreakBroken(days: number, reason: string) {
    this.logEvent('streak_broken', {
      streak_days: days,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track streak recovered
   */
  static trackStreakRecovered(daysRecovered: number, gemsSpent: number) {
    this.logEvent('streak_recovered', {
      days_recovered: daysRecovered,
      gems_spent: gemsSpent,
      timestamp: new Date().toISOString()
    });
  }

  // ==================== Settings Events ====================

  /**
   * Track settings changed
   */
  static trackSettingsChanged(setting: string, oldValue: any, newValue: any) {
    this.logEvent('settings_changed', {
      setting_name: setting,
      old_value: String(oldValue),
      new_value: String(newValue),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track friction level changed
   */
  static trackFrictionLevelChanged(oldLevel: string, newLevel: string) {
    this.logEvent('friction_level_changed', {
      old_level: oldLevel,
      new_level: newLevel,
      timestamp: new Date().toISOString()
    });
  }

  // ==================== Feature Usage Events ====================

  /**
   * Track feature used
   */
  static trackFeatureUsed(featureName: string, metadata?: Record<string, any>) {
    this.logEvent('feature_used', {
      feature_name: featureName,
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track snooze activated
   */
  static trackSnoozeActivated(durationMinutes: number) {
    this.logEvent('snooze_activated', {
      duration_minutes: durationMinutes,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track site added
   */
  static trackSiteAdded(siteName: string, dailyLimit: number) {
    this.logEvent('site_added', {
      site_name: siteName,
      daily_limit_minutes: dailyLimit,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track site removed
   */
  static trackSiteRemoved(siteName: string) {
    this.logEvent('site_removed', {
      site_name: siteName,
      timestamp: new Date().toISOString()
    });
  }

  // ==================== Daily Summary Events ====================

  /**
   * Track daily summary
   */
  static trackDailySummary(stats: {
    totalMinutes: number;
    sessionCount: number;
    interventionsShown: number;
    goBackCount: number;
    proceedCount: number;
    successRate: number;
  }) {
    this.logEvent('daily_summary', {
      total_minutes: Math.round(stats.totalMinutes),
      session_count: stats.sessionCount,
      interventions_shown: stats.interventionsShown,
      go_back_count: stats.goBackCount,
      proceed_count: stats.proceedCount,
      success_rate_percent: Math.round(stats.successRate * 100),
      timestamp: new Date().toISOString()
    });
  }

  // ==================== Cloud Sync Events ====================

  /**
   * Track sync started
   */
  static trackSyncStarted() {
    this.logEvent('sync_started', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track sync completed
   */
  static trackSyncCompleted(itemsSynced: number, durationMs: number) {
    this.logEvent('sync_completed', {
      items_synced: itemsSynced,
      duration_ms: durationMs,
      duration_seconds: Math.round(durationMs / 1000),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track sync failed
   */
  static trackSyncFailed(error: string) {
    this.logEvent('sync_failed', {
      error_message: error,
      timestamp: new Date().toISOString()
    });
  }

  // ==================== Helper Methods ====================

  /**
   * Log custom event
   */
  private static logEvent(eventName: string, params?: Record<string, any>) {
    if (!this.analytics) {
      console.log('[Analytics] Event (not sent):', eventName, params);
      return;
    }

    try {
      // Convert all numeric strings to numbers for better analytics
      const processedParams = params ? this.processParams(params) : {};
      logEvent(this.analytics, eventName, processedParams);
      console.log('[Analytics] Event logged:', eventName, processedParams);
    } catch (error) {
      console.error('[Analytics] Error logging event:', error);
    }
  }

  /**
   * Process parameters to ensure correct types
   */
  private static processParams(params: Record<string, any>): Record<string, any> {
    const processed: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && !isNaN(Number(value)) && value !== '') {
        processed[key] = Number(value);
      } else if (typeof value === 'boolean') {
        processed[key] = value;
      } else if (typeof value === 'number') {
        processed[key] = value;
      } else {
        processed[key] = String(value);
      }
    }

    return processed;
  }

  /**
   * Check if analytics is enabled
   */
  static isEnabled(): boolean {
    return this.initialized && this.analytics !== null;
  }
}

/**
 * Initialize analytics on extension load
 */
export async function initializeAnalytics() {
  await AnalyticsService.initialize();
}
