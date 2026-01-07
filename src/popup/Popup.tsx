import React, { useEffect, useState } from 'react';
import { StorageService } from '../lib/storage';
import type { DailyStats, Goal } from '../types/models';
import { GoalCard } from '../components/GoalCard';
import { WebsiteManager } from '../components/WebsiteManager';

/**
 * Main Popup UI - Matching Android HomeScreen exactly
 * Extension popup shown when clicking the extension icon
 */
export const Popup: React.FC = () => {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWebsiteManager, setShowWebsiteManager] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);

  useEffect(() => {
    loadData();
    loadMonitoringState();
    // Auto-refresh every 30 seconds like Android
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMonitoringState = async () => {
    const result = await chrome.storage.local.get('monitoringEnabled');
    setMonitoringEnabled(result.monitoringEnabled !== false); // Default to true
  };

  const toggleMonitoring = async () => {
    const newState = !monitoringEnabled;
    setMonitoringEnabled(newState);
    await chrome.storage.local.set({ monitoringEnabled: newState });

    // Send message to background script to enable/disable tracking
    chrome.runtime.sendMessage({
      type: newState ? 'START_MONITORING' : 'STOP_MONITORING'
    });
  };

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);

    try {
      const [dailyStats, userGoals] = await Promise.all([
        StorageService.getDailyStats(),
        StorageService.getGoals()
      ]);

      setStats(dailyStats);
      setGoals(userGoals);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const totalGoal = goals.reduce((sum, g) => sum + g.dailyLimitMinutes, 0) || 60;
  const totalUsage = stats?.totalMinutes || 0;
  const progressPercent = (totalUsage / totalGoal) * 100;

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  };

  const getProgressColor = (): string => {
    if (progressPercent < 50) return '#4CAF50'; // Green
    if (progressPercent < 90) return '#FFA726'; // Orange
    return '#FF5252'; // Red
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Top Bar - matching Android */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            ThinkFast
          </h1>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg
              className={`w-5 h-5 text-gray-700 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 space-y-4">
          {/* Greeting Section - matching Android */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {getGreeting()}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Let's stay mindful today
            </p>
          </div>

          {/* Tracked Apps Section - matching Android */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Tracked Apps
              </h3>
              {goals.length === 0 ? (
                <button
                  onClick={() => setShowWebsiteManager(true)}
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Add Apps
                </button>
              ) : (
                <button
                  onClick={() => setShowWebsiteManager(true)}
                  className="px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  Manage
                </button>
              )}
            </div>

            {/* Empty state - matching Android */}
            {goals.length === 0 ? (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 text-center">
                <div className="text-5xl mb-3">📱</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
                  No Apps Tracked Yet
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Start tracking apps to set goals and monitor your usage
                </p>
                <button
                  onClick={() => setShowWebsiteManager(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Add Apps to Track
                </button>
              </div>
            ) : (
            <>
              {/* Today's Usage Card - matching Android exactly */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 space-y-4">
                {/* Header Row: Title left, Total time right */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Today's Usage
                  </h3>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(totalUsage)}m
                  </span>
                </div>

                {/* Content Row: Progress ring left, Metrics right */}
                <div className="flex items-center gap-4">
                  {/* Left: Circular Progress Ring - 140px matching Android 140dp */}
                  <div className="flex-shrink-0 relative">
                    <svg width="140" height="140" className="transform -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="70"
                        cy="70"
                        r="62"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="12"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="70"
                        cy="70"
                        r="62"
                        fill="none"
                        stroke={getProgressColor()}
                        strokeWidth="12"
                        strokeDasharray={`${2 * Math.PI * 62}`}
                        strokeDashoffset={`${2 * Math.PI * 62 * (1 - Math.min(progressPercent / 100, 1))}`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    {/* Center text - positioned absolutely within ring */}
                    <div className="absolute top-0 left-0 w-[140px] h-[140px] flex flex-col items-center justify-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {Math.round(progressPercent)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        of goal
                      </div>
                    </div>
                  </div>

                  {/* Right: Three Metrics - matching Android spacing */}
                  <div className="flex-1 space-y-3">
                    {/* Total - with 24px clock icon */}
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                        <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                          {Math.round(totalUsage)}m
                        </div>
                      </div>
                    </div>

                    {/* Sessions - with 24px bar chart icon */}
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
                        <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                          {stats?.sessionCount || 0}
                        </div>
                      </div>
                    </div>

                    {/* Streak - with 24px fire emoji */}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl flex-shrink-0 w-6 flex items-center justify-center">🔥</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Streak</div>
                        <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                          {stats?.currentStreak || 0} days
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Monitoring Status - matching Android */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  {/* Left: Status with checkmark icon */}
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {monitoringEnabled ? (
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Usage Monitoring
                      </div>
                      <div className={`text-xs font-medium ${
                        monitoringEnabled
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {monitoringEnabled ? 'Active' : 'Paused'}
                      </div>
                    </div>
                  </div>

                  {/* Right: Material Design Toggle Switch */}
                  <button
                    onClick={toggleMonitoring}
                    className="relative inline-flex items-center"
                  >
                    <div className={`w-11 h-6 rounded-full shadow-inner relative transition-colors ${
                      monitoringEnabled
                        ? 'bg-green-500 dark:bg-green-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                        monitoringEnabled ? 'right-1' : 'left-1'
                      }`} />
                    </div>
                  </button>
                </div>
              </div>

              {/* Goal Cards */}
              <div className="space-y-2">
                {goals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    usage={stats?.siteBreakdown?.[goal.siteName] || 0}
                    onClick={() => setShowWebsiteManager(true)}
                  />
                ))}
              </div>
            </>
          )}
          </div>

        </div>
      </div>

      {/* Website Manager Modal */}
      <WebsiteManager
        show={showWebsiteManager}
        onClose={() => setShowWebsiteManager(false)}
        onSaved={() => loadData()}
      />
    </div>
  );
};
