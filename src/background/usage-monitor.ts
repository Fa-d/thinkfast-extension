import { StorageService } from '../lib/storage';
import type { TrackedSite } from '../types/models';
import { SessionDetector } from './session-detector';

/**
 * Usage Monitor
 * Tracks active tab time and detects when user is on tracked websites
 * Replaces Android's AppLaunchDetector
 */
export class UsageMonitor {
  private currentTabId: number | null = null;
  private currentUrl: string | null = null;
  private sessionStartTime: number | null = null;
  private isUserActive = true;
  private isBrowserFocused = true;
  private isEnabled = true;

  private trackedSites: TrackedSite[] = [];
  private sessionDetector: SessionDetector;

  constructor() {
    this.sessionDetector = new SessionDetector();
    this.loadTrackedSites();
    this.loadMonitoringState();
  }

  async loadTrackedSites() {
    const settings = await StorageService.getSettings();
    this.trackedSites = settings.trackedSites || [];
  }

  async loadMonitoringState() {
    try {
      const result = await chrome.storage.local.get('monitoringEnabled');
      this.isEnabled = result.monitoringEnabled !== false; // Default to true
      console.log('[UsageMonitor] Monitoring state loaded:', this.isEnabled);
    } catch (error) {
      console.error('[UsageMonitor] Failed to load monitoring state:', error);
      this.isEnabled = true; // Default to enabled on error
    }
  }

  /**
   * Called when user switches to a new tab or URL changes
   */
  async onTabActivated(url: string, tabId: number) {
    console.log('[UsageMonitor] Tab activated:', url);

    // Skip if monitoring is disabled
    if (!this.isEnabled) {
      console.log('[UsageMonitor] Monitoring disabled, skipping tracking');
      return;
    }

    // End previous session if different site
    if (this.currentUrl && this.currentUrl !== url) {
      await this.endCurrentSession();
    }

    this.currentTabId = tabId;
    this.currentUrl = url;

    // Check if this is a tracked site
    const site = this.matchTrackedSite(url);
    if (site) {
      await this.startSession(site, url);
    }
  }

  /**
   * Match URL against tracked site patterns
   */
  matchTrackedSite(url: string): TrackedSite | null {
    for (const site of this.trackedSites) {
      if (this.matchPattern(site.pattern, url)) {
        return site;
      }
    }
    return null;
  }

  /**
   * Convert Chrome match pattern to regex and test URL
   * Pattern format: scheme://host/path
   * - * in scheme matches http or https
   * - * in host matches any subdomain
   * - * in path matches any path
   */
  matchPattern(pattern: string, url: string): boolean {
    try {
      // Convert Chrome pattern to regex
      let regex = pattern
        .replace(/\./g, '\\.')  // Escape dots
        .replace(/\*/g, '.*')   // * becomes .*
        .replace(/\?/g, '\\?'); // Escape question marks

      // Add anchors
      regex = '^' + regex + '$';

      return new RegExp(regex).test(url);
    } catch (error) {
      console.error('[UsageMonitor] Pattern match error:', error);
      return false;
    }
  }

  /**
   * Start tracking a new session
   */
  async startSession(site: TrackedSite, url: string) {
    console.log('[UsageMonitor] Starting session for:', site.name);

    this.sessionStartTime = Date.now();
    await this.sessionDetector.startSession(site.name, url, site.dailyLimitMinutes);
  }

  /**
   * End the current session
   */
  async endCurrentSession() {
    if (this.sessionStartTime && this.currentUrl) {
      const duration = Date.now() - this.sessionStartTime;
      console.log('[UsageMonitor] Ending session, duration:', duration);

      await this.sessionDetector.endSession(duration);
      this.sessionStartTime = null;
    }
  }

  /**
   * Update current session (called periodically)
   */
  async checkCurrentSession() {
    // Skip if monitoring is disabled
    if (!this.isEnabled) {
      return;
    }

    // Don't count time when idle or browser unfocused
    if (!this.isUserActive || !this.isBrowserFocused) {
      return;
    }

    if (this.sessionStartTime) {
      const duration = Date.now() - this.sessionStartTime;
      await this.sessionDetector.updateSession(duration);
    }
  }

  /**
   * User went idle (away from computer)
   */
  onUserIdle() {
    console.log('[UsageMonitor] User idle');
    this.isUserActive = false;
    this.endCurrentSession();
  }

  /**
   * User is back active
   */
  onUserActive() {
    console.log('[UsageMonitor] User active');
    this.isUserActive = true;
  }

  /**
   * Browser window lost focus
   */
  onBrowserBlurred() {
    console.log('[UsageMonitor] Browser blurred');
    this.isBrowserFocused = false;
    this.endCurrentSession();
  }

  /**
   * Browser window gained focus
   */
  onBrowserFocused() {
    console.log('[UsageMonitor] Browser focused');
    this.isBrowserFocused = true;
  }

  /**
   * Reload tracked sites from storage (called when settings change)
   */
  async reloadTrackedSites() {
    await this.loadTrackedSites();
  }

  /**
   * Get current session info
   */
  getCurrentSession() {
    return {
      tabId: this.currentTabId,
      url: this.currentUrl,
      isActive: this.isUserActive && this.isBrowserFocused && this.isEnabled,
      sessionStartTime: this.sessionStartTime
    };
  }

  /**
   * Enable usage monitoring
   */
  enable() {
    console.log('[UsageMonitor] Enabled');
    this.isEnabled = true;
  }

  /**
   * Disable usage monitoring (stop tracking)
   */
  disable() {
    console.log('[UsageMonitor] Disabled');
    this.isEnabled = false;
    // End current session when disabling
    this.endCurrentSession();
  }
}
