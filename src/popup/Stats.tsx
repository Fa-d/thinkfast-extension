import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StorageService } from '../lib/storage';
import type { DailyStats, Goal } from '../types/models';
import { AppBreakdownChart } from '../components/Charts/AppBreakdownChart';
import { TimePatternChart } from '../components/Charts/TimePatternChart';
import { ProgressTimeline } from '../components/Charts/ProgressTimeline';

type TimeRange = 'today' | 'week' | 'month';

/**
 * Statistics Page - Matching Android StatsScreen exactly
 */
export const Stats: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);

    try {
      const endDate = new Date();
      let startDate = new Date();

      if (timeRange === 'today') {
        startDate = endDate;
      } else if (timeRange === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else {
        startDate.setDate(endDate.getDate() - 30);
      }

      const [rangeStats, userGoals] = await Promise.all([
        StorageService.getStatsRange(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ),
        StorageService.getGoals()
      ]);

      setStats(rangeStats);
      setGoals(userGoals);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate aggregated stats - Memoized for performance
  const aggregatedStats = useMemo(() => {
    const totalMinutes = stats.reduce((sum, s) => sum + s.totalMinutes, 0);
    const totalSessions = stats.reduce((sum, s) => sum + s.sessionCount, 0);
    const totalInterventions = stats.reduce((sum, s) => sum + s.interventionsShown, 0);
    const totalGoBack = stats.reduce((sum, s) => sum + s.goBackCount, 0);
    const currentStreak = stats[stats.length - 1]?.currentStreak || 0;
    const longestStreak = Math.max(...stats.map(s => s.longestStreak || 0), 0);
    const successRate = totalInterventions > 0 ? Math.round((totalGoBack / totalInterventions) * 100) : 0;

    return {
      totalMinutes,
      totalSessions,
      totalInterventions,
      totalGoBack,
      currentStreak,
      longestStreak,
      successRate
    };
  }, [stats]);

  const { totalMinutes, totalSessions, totalInterventions, totalGoBack, currentStreak, longestStreak, successRate } = aggregatedStats;

  // Get site breakdown - Memoized for performance
  const siteBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    stats.forEach(dayStat => {
      Object.entries(dayStat.siteBreakdown).forEach(([site, minutes]) => {
        breakdown[site] = (breakdown[site] || 0) + minutes;
      });
    });
    return breakdown;
  }, [stats]);

  // Get hourly pattern - Memoized for performance
  const hourlyPattern = useMemo(() => {
    const pattern: Record<number, number> = {};
    stats.forEach(dayStat => {
      // Simulate hourly distribution
      const totalDay = dayStat.totalMinutes;
      for (let hour = 0; hour < 24; hour++) {
        if (!pattern[hour]) pattern[hour] = 0;
        // Distribute usage across hours (simplified)
        if (hour >= 9 && hour <= 22) {
          pattern[hour] += totalDay / 14;
        }
      }
    });
    return pattern;
  }, [stats]);

  // Goal compliance timeline - Memoized for performance
  const timelineData = useMemo(() => {
    const totalGoal = goals.reduce((sum, g) => sum + g.dailyLimitMinutes, 0) || 60;
    return stats.slice(-7).map(dayStat => ({
      date: dayStat.date,
      totalMinutes: dayStat.totalMinutes,
      goalMinutes: totalGoal,
      onTrack: dayStat.totalMinutes <= totalGoal
    }));
  }, [stats, goals]);

  // Compliance rate calculations - Memoized for performance
  const complianceRate = useMemo(() => {
    const totalGoal = goals.reduce((sum, g) => sum + g.dailyLimitMinutes, 0) || 60;
    const onTrack = stats.filter(s => s.totalMinutes <= totalGoal).length;
    return stats.length > 0 ? (onTrack / stats.length) * 100 : 0;
  }, [stats, goals]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-2">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header - matching Android TopAppBar */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Statistics
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Time Range Selector - matching Android */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'today' as TimeRange, label: 'Today' },
            { value: 'week' as TimeRange, label: 'This Week' },
            { value: 'month' as TimeRange, label: 'This Month' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTimeRange(value)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                timeRange === value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {stats.length === 0 ? (
          <EmptyStatsCard />
        ) : (
          <div className="space-y-6">
            {/* Overview Stats Card - matching Android */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
                Overview
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  label="Total Time"
                  value={`${Math.floor(totalMinutes / 60)}h ${Math.round(totalMinutes % 60)}m`}
                  subtitle={`${stats.length} days`}
                  icon="⏱️"
                  color="blue"
                />
                <MetricCard
                  label="Sessions"
                  value={totalSessions}
                  subtitle={`${Math.round(totalSessions / stats.length)} avg/day`}
                  icon="🔄"
                  color="green"
                />
                <MetricCard
                  label="Mindful Rate"
                  value={`${successRate}%`}
                  subtitle={`${totalGoBack}/${totalInterventions} choices`}
                  icon="✨"
                  color="purple"
                />
                <MetricCard
                  label="Current Streak"
                  value={`${currentStreak} days`}
                  subtitle={`Best: ${longestStreak}`}
                  icon="🔥"
                  color="orange"
                />
              </div>
            </div>

            {/* Site Breakdown Chart */}
            {Object.keys(siteBreakdown).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <AppBreakdownChart data={siteBreakdown} />
              </div>
            )}

            {/* Time Pattern Chart */}
            {timeRange !== 'today' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <TimePatternChart data={hourlyPattern} />
              </div>
            )}

            {/* Goal Progress Timeline */}
            {timelineData.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
                <ProgressTimeline data={timelineData} />
              </div>
            )}

            {/* Streak Consistency Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Streak Consistency
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-500 mb-2">
                    {currentStreak}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Current Streak (days)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-500 mb-2">
                    {longestStreak}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Longest Streak (days)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-500 mb-2">
                    {complianceRate.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Goal Compliance
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Insights */}
            {totalMinutes > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl shadow-sm p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-3xl">💡</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Smart Insights
                    </h3>
                    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                      {successRate >= 70 && (
                        <p>✓ Great job! You're making mindful choices {successRate}% of the time.</p>
                      )}
                      {currentStreak >= 3 && (
                        <p>🔥 You're on a {currentStreak}-day streak! Keep it up!</p>
                      )}
                      {complianceRate >= 80 && (
                        <p>🎯 Excellent goal adherence at {complianceRate.toFixed(0)}%.</p>
                      )}
                      {totalMinutes < (stats.length * 60) && (
                        <p>📊 You're averaging {Math.round(totalMinutes / stats.length)} minutes per day.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Components

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
    </div>
  );
};

const EmptyStatsCard: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center">
    <div className="text-6xl mb-4">📊</div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
      No data yet
    </h3>
    <p className="text-gray-600 dark:text-gray-400">
      Start browsing tracked sites to see your statistics
    </p>
  </div>
);
