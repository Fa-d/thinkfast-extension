import React, { useMemo, useCallback } from 'react';

interface DayData {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  goalMinutes: number;
  onTrack: boolean;
}

interface Props {
  data: DayData[];
}

/**
 * Progress Timeline Chart
 * Shows daily progress over the past week/month with goal compliance
 * Optimized with React.memo and useMemo for performance
 */
export const ProgressTimeline: React.FC<Props> = React.memo(({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-2">📈</div>
        <p>No progress data yet</p>
      </div>
    );
  }

  // Memoize statistical calculations
  const stats = useMemo(() => {
    const maxMinutes = Math.max(...data.map(d => Math.max(d.totalMinutes, d.goalMinutes)), 1);
    const avgUsage = data.reduce((sum, d) => sum + d.totalMinutes, 0) / data.length;
    const daysOnTrack = data.filter(d => d.onTrack).length;
    const complianceRate = (daysOnTrack / data.length) * 100;
    return { maxMinutes, avgUsage, daysOnTrack, complianceRate };
  }, [data]);

  const { maxMinutes, avgUsage, daysOnTrack, complianceRate } = stats;

  const getDayLabel = useCallback((dateStr: string): string => {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }, []);

  const getDateLabel = useCallback((dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Progress Timeline
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {complianceRate.toFixed(0)}% on track
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-3">
        {data.map((day, index) => {
          const usagePercent = (day.totalMinutes / maxMinutes) * 100;
          const goalPercent = (day.goalMinutes / maxMinutes) * 100;
          const isToday = index === data.length - 1;

          return (
            <div key={day.date} className="space-y-1">
              {/* Day label */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {getDayLabel(day.date)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {getDateLabel(day.date)}
                  </span>
                  {day.onTrack && (
                    <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                  )}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {Math.round(day.totalMinutes)}m / {day.goalMinutes}m
                </div>
              </div>

              {/* Dual bars: usage vs goal */}
              <div className="relative h-8">
                {/* Goal bar (background) */}
                <div
                  className="absolute top-0 left-0 h-full bg-gray-200 dark:bg-gray-700 rounded-full transition-all duration-500"
                  style={{ width: `${goalPercent}%` }}
                />

                {/* Usage bar (foreground) */}
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                    day.onTrack
                      ? 'bg-green-500 dark:bg-green-600'
                      : 'bg-red-500 dark:bg-red-600'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />

                {/* Today indicator */}
                {isToday && (
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
                    <div className="w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-400 border-2 border-white dark:border-gray-800" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-gray-600 dark:text-gray-400 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
          <span>Daily Goal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>On Track</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span>Over Goal</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {daysOnTrack}/{data.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Days On Track</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(avgUsage)}m
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Avg Daily Usage</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {complianceRate.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Compliance Rate</div>
        </div>
      </div>

      {/* Trend indicator - Memoized for performance */}
      {data.length >= 2 && (() => {
        const trendAnalysis = useMemo(() => {
          const recentDays = data.slice(-3);
          const olderDays = data.slice(0, -3);
          if (olderDays.length === 0) return null;

          const recentAvg = recentDays.reduce((sum, d) => sum + d.totalMinutes, 0) / recentDays.length;
          const olderAvg = olderDays.reduce((sum, d) => sum + d.totalMinutes, 0) / olderDays.length;
          const change = ((recentAvg - olderAvg) / olderAvg) * 100;

          return { change, recentAvg, olderAvg };
        }, [data]);

        if (!trendAnalysis) return null;

        const { change } = trendAnalysis;

        return (
          <div className="text-center text-sm">
            {Math.abs(change) < 5 ? (
              <span className="text-gray-600 dark:text-gray-400">
                📊 Usage is stable
              </span>
            ) : change < 0 ? (
              <span className="text-green-600 dark:text-green-400">
                📉 Usage decreased by {Math.abs(change).toFixed(0)}% recently
              </span>
            ) : (
              <span className="text-orange-600 dark:text-orange-400">
                📈 Usage increased by {change.toFixed(0)}% recently
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
}, (prevProps, nextProps) => {
  // Array comparison - only re-render if data array actually changed
  if (prevProps.data.length !== nextProps.data.length) return false;
  return prevProps.data.every((item, idx) =>
    item.date === nextProps.data[idx].date &&
    item.totalMinutes === nextProps.data[idx].totalMinutes &&
    item.goalMinutes === nextProps.data[idx].goalMinutes &&
    item.onTrack === nextProps.data[idx].onTrack
  );
});
