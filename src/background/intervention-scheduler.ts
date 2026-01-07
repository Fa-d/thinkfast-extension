import { StorageService } from '../lib/storage';

/**
 * Intervention Scheduler
 * Handles intervention timing, snooze logic, and cooldowns
 */
export class InterventionScheduler {
  private snoozedUntil: number | null = null;

  /**
   * Check if interventions are currently snoozed
   */
  isSnoozed(): boolean {
    if (!this.snoozedUntil) return false;
    return Date.now() < this.snoozedUntil;
  }

  /**
   * Snooze interventions for specified duration
   */
  snooze(durationMinutes: number) {
    this.snoozedUntil = Date.now() + (durationMinutes * 60 * 1000);
    console.log('[InterventionScheduler] Snoozed for', durationMinutes, 'minutes');
  }

  /**
   * Clear snooze
   */
  clearSnooze() {
    this.snoozedUntil = null;
    console.log('[InterventionScheduler] Snooze cleared');
  }

  /**
   * Check if reminder should be shown
   */
  async shouldShowReminder(): Promise<boolean> {
    // Don't show if snoozed
    if (this.isSnoozed()) {
      return false;
    }

    const settings = await StorageService.getSettings();

    // Check if always show is enabled
    if (settings.alwaysShowReminder) {
      return true;
    }

    // Additional logic for smart reminders
    // For example: show based on time of day, usage patterns, etc.

    return false;
  }

  /**
   * Check if timer alert should be shown
   */
  async shouldShowTimer(sessionDuration: number): Promise<boolean> {
    // Don't show if snoozed
    if (this.isSnoozed()) {
      return false;
    }

    const settings = await StorageService.getSettings();
    const timerDurationMs = settings.timerDurationMinutes * 60 * 1000;

    // Show if session duration exceeds timer duration
    return sessionDuration >= timerDurationMs;
  }

  /**
   * Get remaining snooze time in minutes
   */
  getRemainingSnoozeTime(): number {
    if (!this.snoozedUntil) return 0;

    const remaining = this.snoozedUntil - Date.now();
    return Math.max(0, Math.ceil(remaining / 60000));
  }
}
