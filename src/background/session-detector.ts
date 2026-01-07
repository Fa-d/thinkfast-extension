import { StorageService } from '../lib/storage';
import type { Session } from '../types/models';

/**
 * Session Detector
 * Manages session lifecycle and triggers interventions
 * Replaces Android SessionDetector
 */
export class SessionDetector {
  private currentSession: Session | null = null;

  /**
   * Start a new usage session
   */
  async startSession(siteName: string, url: string, dailyLimitMinutes: number) {
    console.log('[SessionDetector] Starting session:', siteName);

    // Check if should show reminder on launch
    const shouldShowReminder = await this.shouldShowReminder();

    this.currentSession = {
      id: crypto.randomUUID(),
      siteName,
      url,
      startTime: Date.now(),
      lastActiveTime: Date.now(),
      totalDuration: 0,
      timerStartTime: Date.now(),
      lastTimerAlertTime: 0,
      dailyLimitMinutes
    };

    // Save to storage
    await StorageService.saveSession(this.currentSession);

    // Show reminder if applicable
    if (shouldShowReminder) {
      await this.showReminderOverlay();
    }
  }

  /**
   * Update current session (called periodically)
   */
  async updateSession(currentDuration: number) {
    if (!this.currentSession) return;

    this.currentSession.totalDuration = currentDuration;
    this.currentSession.lastActiveTime = Date.now();

    // Check if timer alert should fire
    const settings = await StorageService.getSettings();
    const timerDurationMs = settings.timerDurationMinutes * 60 * 1000;
    const timeSinceTimerStart = Date.now() - this.currentSession.timerStartTime;

    if (
      timeSinceTimerStart >= timerDurationMs &&
      Date.now() - this.currentSession.lastTimerAlertTime > timerDurationMs
    ) {
      await this.showTimerOverlay();
      this.currentSession.lastTimerAlertTime = Date.now();
    }

    // Update in storage
    await StorageService.updateSession(this.currentSession);
  }

  /**
   * End the current session
   */
  async endSession(finalDuration: number) {
    if (!this.currentSession) return;

    console.log('[SessionDetector] Ending session:', this.currentSession.siteName);

    this.currentSession.totalDuration = finalDuration;

    // Save final session
    await StorageService.saveCompletedSession(this.currentSession);

    // Update daily stats
    await this.updateDailyStats(this.currentSession);

    this.currentSession = null;
  }

  /**
   * Determine if reminder should be shown on launch
   */
  async shouldShowReminder(): Promise<boolean> {
    const settings = await StorageService.getSettings();

    // Always show if setting is enabled
    if (settings.alwaysShowReminder) {
      return true;
    }

    // Additional logic can be added here for smart reminders
    // For example: show if user reopens quickly after closing

    return false;
  }

  /**
   * Check if a tab URL is valid for content script injection
   */
  private isValidTabUrl(url?: string): boolean {
    if (!url) return false;

    // Exclude special pages where content scripts cannot run
    const invalidPrefixes = [
      'chrome://',
      'chrome-extension://',
      'about:',
      'edge://',
      'opera://',
      'brave://',
      'vivaldi://',
      'data:',
      'file://',
      'view-source:'
    ];

    return !invalidPrefixes.some(prefix => url.startsWith(prefix));
  }

  /**
   * Show reminder overlay via content script
   */
  async showReminderOverlay() {
    console.log('[SessionDetector] Showing reminder overlay');

    if (!this.currentSession) {
      console.log('[SessionDetector] No current session, skipping reminder');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        console.log('[SessionDetector] No active tab found');
        return;
      }

      if (!tab.id) {
        console.log('[SessionDetector] Tab has no ID');
        return;
      }

      // Check if URL is valid for content script
      if (!this.isValidTabUrl(tab.url)) {
        console.log('[SessionDetector] Tab URL not valid for content script:', tab.url);
        return;
      }

      // Check if tab is still loading
      if (tab.status !== 'complete') {
        console.log('[SessionDetector] Tab still loading, waiting...');
        // Wait for tab to finish loading
        await this.waitForTabLoad(tab.id);
      }

      console.log('[SessionDetector] Sending reminder intervention to tab', tab.id);
      await chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_INTERVENTION',
        data: {
          type: 'REMINDER',
          session: this.currentSession,
          context: await this.buildContext()
        }
      });
    } catch (error) {
      console.error('[SessionDetector] Error showing reminder:', error);
    }
  }

  /**
   * Show timer overlay via content script
   */
  async showTimerOverlay() {
    console.log('[SessionDetector] Showing timer overlay');

    if (!this.currentSession) {
      console.log('[SessionDetector] No current session, skipping timer');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab) {
        console.log('[SessionDetector] No active tab found');
        return;
      }

      if (!tab.id) {
        console.log('[SessionDetector] Tab has no ID');
        return;
      }

      // Check if URL is valid for content script
      if (!this.isValidTabUrl(tab.url)) {
        console.log('[SessionDetector] Tab URL not valid for content script:', tab.url);
        return;
      }

      // Check if tab is still loading
      if (tab.status !== 'complete') {
        console.log('[SessionDetector] Tab still loading, waiting...');
        await this.waitForTabLoad(tab.id);
      }

      console.log('[SessionDetector] Sending timer intervention to tab', tab.id);
      await chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_INTERVENTION',
        data: {
          type: 'TIMER',
          session: this.currentSession,
          context: await this.buildContext()
        }
      });
    } catch (error) {
      console.error('[SessionDetector] Error showing timer:', error);
    }
  }

  /**
   * Wait for a tab to finish loading
   */
  private async waitForTabLoad(tabId: number, timeout: number = 5000): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkTab = async () => {
        try {
          const tab = await chrome.tabs.get(tabId);

          if (tab.status === 'complete') {
            resolve();
            return;
          }

          // Check timeout
          if (Date.now() - startTime > timeout) {
            console.log('[SessionDetector] Tab load timeout');
            resolve();
            return;
          }

          // Check again in 100ms
          setTimeout(checkTab, 100);
        } catch (error) {
          // Tab might have been closed
          resolve();
        }
      };

      checkTab();
    });
  }

  /**
   * Build intervention context for content selection
   */
  async buildContext() {
    const today = new Date().toISOString().split('T')[0];
    const stats = await StorageService.getDailyStats(today);
    const goals = await StorageService.getGoals();

    const now = new Date();
    const timeOfDay = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
      timeOfDay,
      dayOfWeek,
      isWeekend,
      totalUsageToday: stats.totalMinutes,
      sessionCount: stats.sessionCount,
      quickReopenAttempt: false, // TODO: Implement detection
      streakDays: stats.currentStreak,
      isOverGoal: this.isOverGoal(stats, goals)
    };
  }

  /**
   * Check if user is over their daily goal
   */
  private isOverGoal(stats: any, goals: any[]): boolean {
    if (!this.currentSession) return false;

    const goal = goals.find(g => g.siteName === this.currentSession?.siteName);
    if (!goal) return false;

    const siteUsage = stats.siteBreakdown[this.currentSession.siteName] || 0;
    return siteUsage >= goal.dailyLimitMinutes;
  }

  /**
   * Update daily statistics
   */
  async updateDailyStats(session: Session) {
    const today = new Date().toISOString().split('T')[0];
    const stats = await StorageService.getDailyStats(today);

    const sessionMinutes = session.totalDuration / 60000;

    stats.totalMinutes += sessionMinutes;
    stats.sessionCount += 1;
    stats.siteBreakdown[session.siteName] =
      (stats.siteBreakdown[session.siteName] || 0) + sessionMinutes;

    await StorageService.saveDailyStats(today, stats);
  }

  /**
   * Reset timer (called when user clicks "Go Back")
   */
  resetTimer() {
    if (this.currentSession) {
      this.currentSession.timerStartTime = Date.now();
      console.log('[SessionDetector] Timer reset');
    }
  }

  /**
   * Record intervention result
   */
  async recordInterventionResult(result: any) {
    console.log('[SessionDetector] Recording intervention result:', result);

    await StorageService.saveInterventionResult(result);

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    const stats = await StorageService.getDailyStats(today);

    stats.interventionsShown += 1;
    if (result.userChoice === 'GO_BACK') {
      stats.goBackCount += 1;
      this.resetTimer(); // Reset timer on successful "go back"
    } else if (result.userChoice === 'PROCEED') {
      stats.proceedCount += 1;
    }

    await StorageService.saveDailyStats(today, stats);
  }

  /**
   * Get current session info
   */
  getCurrentSession() {
    return this.currentSession;
  }
}
