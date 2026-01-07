import { UsageMonitor } from './usage-monitor';
import { SessionDetector } from './session-detector';
import { InterventionScheduler } from './intervention-scheduler';
import { StorageService } from '../lib/storage';
import { initializeSupabase, SupabaseService } from '../lib/supabase';
import { initializeAnalytics, AnalyticsService } from '../lib/analytics';

/**
 * Background Service Worker
 * Main orchestrator for ThinkFast extension
 * Replaces Android's UsageMonitorService
 */

// Initialize components
const usageMonitor = new UsageMonitor();
const sessionDetector = new SessionDetector();
const interventionScheduler = new InterventionScheduler();

console.log('[ServiceWorker] ThinkFast background service initialized');

// ==================== Installation & Setup ====================

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[ServiceWorker] Extension installed:', details.reason);

  if (details.reason === 'install') {
    // First-time installation
    await initializeExtension();
    AnalyticsService.trackInstall();
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('[ServiceWorker] Extension updated');
    const currentVersion = chrome.runtime.getManifest().version;
    AnalyticsService.trackUpdate(details.previousVersion || 'unknown', currentVersion);
  }

  // Set up periodic alarms
  await setupAlarms();

  // Create context menu
  chrome.contextMenus.create({
    id: 'thinkfast-snooze',
    title: 'Snooze ThinkFast for 30 minutes',
    contexts: ['all']
  });
});

async function initializeExtension() {
  console.log('[ServiceWorker] Initializing extension for first time');

  // Initialize default settings if not exists
  const settings = await StorageService.getSettings();
  await StorageService.saveSettings(settings);

  // Initialize Supabase
  await initializeSupabase();

  // Initialize Firebase Analytics
  await initializeAnalytics();

  // Show welcome notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'ThinkFast Installed!',
    message: 'Start building better browsing habits with mindful interventions.'
  });
}

async function setupAlarms() {
  // Check usage every minute
  chrome.alarms.create('checkUsage', { periodInMinutes: 1 });

  // Sync data every 15 minutes
  chrome.alarms.create('syncData', { periodInMinutes: 15 });

  // Morning notification (8 AM)
  chrome.alarms.create('morningNotification', {
    when: getTomorrowAt(8, 0),
    periodInMinutes: 1440 // Daily
  });

  // Evening notification (8 PM)
  chrome.alarms.create('eveningNotification', {
    when: getTomorrowAt(20, 0),
    periodInMinutes: 1440 // Daily
  });

  console.log('[ServiceWorker] Alarms set up');
}

function getTomorrowAt(hours: number, minutes: number): number {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hours, minutes, 0, 0);
  return tomorrow.getTime();
}

// ==================== Tab Tracking ====================

// Track when user switches to a different tab
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && tab.id && !tab.url.startsWith('chrome://')) {
      await usageMonitor.onTabActivated(tab.url, tab.id);
    }
  } catch (error) {
    console.error('[ServiceWorker] Error on tab activated:', error);
  }
});

// Track when URL changes in current tab
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active && !changeInfo.url.startsWith('chrome://')) {
    await usageMonitor.onTabActivated(changeInfo.url, tabId);
  }
});

// Track when tab is removed (closed)
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const currentSession = usageMonitor.getCurrentSession();
  if (currentSession.tabId === tabId) {
    await usageMonitor.endCurrentSession();
  }
});

// ==================== Window Focus Tracking ====================

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus
    usageMonitor.onBrowserBlurred();
  } else {
    // Browser gained focus
    usageMonitor.onBrowserFocused();

    // Get active tab in focused window
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, windowId });
      if (activeTab && activeTab.url && activeTab.id && !activeTab.url.startsWith('chrome://')) {
        await usageMonitor.onTabActivated(activeTab.url, activeTab.id);
      }
    } catch (error) {
      console.error('[ServiceWorker] Error on window focus:', error);
    }
  }
});

// ==================== Idle Detection ====================

// Detect when user is idle (away from computer)
chrome.idle.setDetectionInterval(60); // Check every 60 seconds

chrome.idle.onStateChanged.addListener((state) => {
  console.log('[ServiceWorker] Idle state changed:', state);

  if (state === 'idle' || state === 'locked') {
    usageMonitor.onUserIdle();
  } else if (state === 'active') {
    usageMonitor.onUserActive();
  }
});

// ==================== Periodic Tasks (Alarms) ====================

async function syncToCloud() {
  const startTime = Date.now();

  try {
    const isAuthenticated = await SupabaseService.isAuthenticated();
    if (!isAuthenticated) {
      console.log('[ServiceWorker] Skipping sync - user not authenticated');
      return;
    }

    console.log('[ServiceWorker] Starting cloud sync...');
    AnalyticsService.trackSyncStarted();

    // Get local data
    const settings = await StorageService.getSettings();
    const goals = await StorageService.getGoals();
    const interventionResults = await StorageService.getInterventionResults();

    // Push to cloud
    await SupabaseService.fullSyncPush({
      settings,
      goals,
      interventionResults
    });

    // Update last sync timestamp
    await StorageService.updateLastSync();

    const duration = Date.now() - startTime;
    const itemCount = 1 + goals.length + interventionResults.length;
    AnalyticsService.trackSyncCompleted(itemCount, duration);

    console.log('[ServiceWorker] Cloud sync completed');
  } catch (error) {
    console.error('[ServiceWorker] Cloud sync failed:', error);
    AnalyticsService.trackSyncFailed(String(error));
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('[ServiceWorker] Alarm fired:', alarm.name);

  switch (alarm.name) {
    case 'checkUsage':
      await usageMonitor.checkCurrentSession();
      break;

    case 'syncData':
      await syncToCloud();
      break;

    case 'morningNotification':
      await sendMorningNotification();
      break;

    case 'eveningNotification':
      await sendEveningNotification();
      break;
  }
});

async function sendMorningNotification() {
  const settings = await StorageService.getSettings();
  if (!settings.notificationsEnabled) return;

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '🌅 Good Morning!',
    message: 'Set your intention for mindful browsing today.'
  });
}

async function sendEveningNotification() {
  const settings = await StorageService.getSettings();
  if (!settings.notificationsEnabled) return;

  const today = new Date().toISOString().split('T')[0];
  const stats = await StorageService.getDailyStats(today);

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '🌙 Daily Summary',
    message: `You spent ${Math.round(stats.totalMinutes)} minutes today. ${stats.goBackCount} times you chose mindfulness!`
  });
}

// ==================== Message Handling ====================

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[ServiceWorker] Message received:', message.type);

  handleMessage(message)
    .then(response => sendResponse(response))
    .catch(error => {
      console.error('[ServiceWorker] Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // Keep channel open for async response
});

async function handleMessage(message: any) {
  switch (message.type) {
    case 'INTERVENTION_RESULT':
      await sessionDetector.recordInterventionResult(message.data);
      return { success: true };

    case 'GET_CURRENT_SESSION':
      return {
        success: true,
        data: sessionDetector.getCurrentSession()
      };

    case 'SNOOZE_INTERVENTIONS':
      interventionScheduler.snooze(message.duration);
      return { success: true };

    case 'CLEAR_SNOOZE':
      interventionScheduler.clearSnooze();
      return { success: true };

    case 'GET_STATS':
      const date = message.date || new Date().toISOString().split('T')[0];
      const stats = await StorageService.getDailyStats(date);
      return { success: true, data: stats };

    case 'RELOAD_SETTINGS':
      await usageMonitor.reloadTrackedSites();
      return { success: true };

    case 'PAGE_LOADED':
      // Content script notifying that page loaded
      console.log('[ServiceWorker] Page loaded:', message.url);
      return { success: true };

    case 'START_MONITORING':
      await chrome.storage.local.set({ monitoringEnabled: true });
      usageMonitor.enable();
      console.log('[ServiceWorker] Usage monitoring started');
      return { success: true };

    case 'STOP_MONITORING':
      await chrome.storage.local.set({ monitoringEnabled: false });
      usageMonitor.disable();
      console.log('[ServiceWorker] Usage monitoring stopped');
      return { success: true };

    case 'SUPABASE_AUTH_SUCCESS':
      console.log('[ServiceWorker] Supabase auth tokens received');
      // Tokens are already stored by auth-callback.html
      // Just acknowledge receipt
      return { success: true };

    case 'CLOSE_CURRENT_TAB':
      console.log('[ServiceWorker] Closing current tab');
      // Get the active tab and close it
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        await chrome.tabs.remove(tabs[0].id);
        return { success: true };
      }
      return { success: false, error: 'No active tab found' };

    default:
      console.warn('[ServiceWorker] Unknown message type:', message.type);
      return { success: false, error: 'Unknown message type' };
  }
}

// ==================== Context Menu ====================

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'thinkfast-snooze') {
    interventionScheduler.snooze(30);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'ThinkFast Snoozed',
      message: 'Interventions paused for 30 minutes'
    });
  }
});

console.log('[ServiceWorker] All event listeners registered');
