import React, { useMemo } from 'react';
import type { Goal } from '../types/models';

interface Props {
  goal: Goal;
  usage: number; // minutes used today
  onClick?: () => void;
}

/**
 * Goal Card Component - Matching Android GoalCard exactly
 * Compact display with app icon, name, limit, streak, and progress bar
 * Optimized with React.memo and useMemo for performance
 */
export const GoalCard: React.FC<Props> = React.memo(({ goal, usage, onClick }) => {
  // Memoize calculations for performance
  const percentageUsed = useMemo(() =>
    (usage / goal.dailyLimitMinutes) * 100,
    [usage, goal.dailyLimitMinutes]
  );

  const remaining = useMemo(() =>
    Math.max(0, goal.dailyLimitMinutes - usage),
    [goal.dailyLimitMinutes, usage]
  );

  const isOverLimit = useMemo(() =>
    usage > goal.dailyLimitMinutes,
    [usage, goal.dailyLimitMinutes]
  );

  // Memoize progress color calculation
  const progressColor = useMemo(() => {
    if (percentageUsed < 50) return '#4CAF50'; // Green - on track
    if (percentageUsed < 80) return '#FFA726'; // Orange - approaching limit
    return '#FF5252'; // Red - over limit
  }, [percentageUsed]);

  // Memoize streak color calculation
  const streakColor = useMemo(() => {
    const streak = goal.currentStreak || 0;
    if (streak >= 30) return '#9C27B0'; // Platinum
    if (streak >= 14) return '#F44336'; // Gold
    if (streak >= 7) return '#FF5722'; // Silver
    return '#FF9800'; // Bronze
  }, [goal.currentStreak]);

  const currentStreak = useMemo(() =>
    goal.currentStreak || 0,
    [goal.currentStreak]
  );

  // Memoize inline style objects
  const streakBadgeStyle = useMemo(() => ({
    backgroundColor: `${streakColor}26` // 15% opacity
  }), [streakColor]);

  const streakTextStyle = useMemo(() => ({
    color: streakColor
  }), [streakColor]);

  const progressTrackStyle = useMemo(() => ({
    backgroundColor: `${progressColor}33`
  }), [progressColor]);

  const progressBarStyle = useMemo(() => ({
    width: `${Math.min(percentageUsed, 100)}%`,
    backgroundColor: progressColor
  }), [percentageUsed, progressColor]);

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 transition-all ${
        onClick ? 'hover:shadow-md cursor-pointer active:scale-[0.98]' : ''
      }`}
    >
      {/* App info row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        {/* Left: App icon + name + limit */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* App Icon - 48px matching Android 48dp */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl flex-shrink-0">
            {goal.siteName ? goal.siteName.charAt(0).toUpperCase() : '?'}
          </div>

          {/* Name + Limit */}
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {goal.siteName || 'Unknown Site'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {goal.dailyLimitMinutes} min/day
            </div>
          </div>
        </div>

        {/* Right: Streak badge */}
        {currentStreak > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-lg"
            style={streakBadgeStyle}
          >
            <span className="text-sm">🔥</span>
            <span
              className="text-sm font-bold"
              style={streakTextStyle}
            >
              {currentStreak}
            </span>
          </div>
        )}
      </div>

      {/* Usage text row */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
        <span>{Math.round(usage)} min used</span>
        {isOverLimit ? (
          <span className="font-semibold text-red-600 dark:text-red-400">
            Over limit
          </span>
        ) : (
          <span>{Math.round(remaining)} min left</span>
        )}
      </div>

      {/* Progress bar - 8px height matching Android */}
      <div className="w-full h-2 rounded-lg overflow-hidden" style={progressTrackStyle}>
        <div
          className="h-full rounded-lg transition-all duration-500"
          style={progressBarStyle}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if these specific props change
  return (
    prevProps.goal.id === nextProps.goal.id &&
    prevProps.goal.dailyLimitMinutes === nextProps.goal.dailyLimitMinutes &&
    prevProps.goal.currentStreak === nextProps.goal.currentStreak &&
    prevProps.usage === nextProps.usage
  );
});
