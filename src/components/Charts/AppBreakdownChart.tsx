import React, { useMemo } from 'react';

interface Props {
  data: Record<string, number>; // siteName -> minutes
}

/**
 * App/Site Breakdown Chart
 * Shows time spent on each tracked site as a horizontal bar chart
 * Optimized with React.memo and useMemo for performance
 */
export const AppBreakdownChart: React.FC<Props> = React.memo(({ data }) => {
  const entries = useMemo(() =>
    Object.entries(data).sort(([, a], [, b]) => b - a),
    [data]
  );

  const total = useMemo(() =>
    entries.reduce((sum, [, minutes]) => sum + minutes, 0),
    [entries]
  );

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-2">📊</div>
        <p>No usage data yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Site Breakdown
      </h3>

      {entries.map(([siteName, minutes]) => {
        const percentage = (minutes / total) * 100;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        return (
          <div key={siteName} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {siteName}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {timeLabel} ({Math.round(percentage)}%)
              </span>
            </div>

            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div className="pt-4 border-t dark:border-gray-700">
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="text-gray-900 dark:text-gray-100">Total Time</span>
          <span className="text-gray-900 dark:text-gray-100">
            {Math.floor(total / 60)}h {Math.round(total % 60)}m
          </span>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Deep comparison for data object - only re-render if data actually changed
  const prevKeys = Object.keys(prevProps.data).sort();
  const nextKeys = Object.keys(nextProps.data).sort();
  if (prevKeys.length !== nextKeys.length) return false;
  return prevKeys.every(key => prevProps.data[key] === nextProps.data[key]);
});
