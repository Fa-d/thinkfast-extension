import React from 'react';

interface Props {
  data: Record<number, number>; // hour -> minutes
}

/**
 * Time Pattern Chart
 * Shows usage patterns by hour of day as a bar chart
 */
export const TimePatternChart: React.FC<Props> = ({ data }) => {
  // Generate all 24 hours with data
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    minutes: data[i] || 0
  }));

  const maxMinutes = Math.max(...hours.map(h => h.minutes), 1);

  const getHourLabel = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const getBarColor = (minutes: number): string => {
    const intensity = minutes / maxMinutes;
    if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (intensity < 0.3) return 'bg-blue-200 dark:bg-blue-900';
    if (intensity < 0.6) return 'bg-blue-400 dark:bg-blue-700';
    if (intensity < 0.8) return 'bg-purple-400 dark:bg-purple-700';
    return 'bg-purple-600 dark:bg-purple-500';
  };

  const getPeakHours = (): string[] => {
    const sorted = [...hours].sort((a, b) => b.minutes - a.minutes);
    const top3 = sorted.slice(0, 3).filter(h => h.minutes > 0);
    return top3.map(h => getHourLabel(h.hour));
  };

  const totalMinutes = hours.reduce((sum, h) => sum + h.minutes, 0);

  if (totalMinutes === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-4xl mb-2">📊</div>
        <p>No usage data yet</p>
      </div>
    );
  }

  const peakHours = getPeakHours();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Usage by Hour
        </h3>
        {peakHours.length > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Peak: {peakHours.join(', ')}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Hour labels and bars */}
        <div className="grid grid-cols-12 gap-1">
          {hours.map(({ hour, minutes }) => {
            const heightPercent = maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0;
            const showLabel = hour % 3 === 0; // Show every 3rd hour label

            return (
              <div key={hour} className="flex flex-col items-center gap-1">
                {/* Bar */}
                <div className="w-full h-32 flex flex-col justify-end relative group">
                  <div
                    className={`w-full transition-all duration-500 rounded-t ${getBarColor(minutes)}`}
                    style={{ height: `${heightPercent}%` }}
                  />

                  {/* Tooltip on hover */}
                  {minutes > 0 && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {getHourLabel(hour)}: {Math.round(minutes)}m
                      </div>
                    </div>
                  )}
                </div>

                {/* Hour label */}
                {showLabel && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {hour === 0 ? '12A' : hour === 12 ? '12P' : hour < 12 ? `${hour}A` : `${hour-12}P`}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Y-axis reference line */}
        <div className="absolute top-0 left-0 right-0 border-b border-gray-200 dark:border-gray-700" />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-600 dark:text-gray-400 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-900" />
          <span>Light</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-400 dark:bg-blue-700" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-400 dark:bg-purple-700" />
          <span>Heavy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-600 dark:bg-purple-500" />
          <span>Peak</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {hours.filter(h => h.minutes > 0).length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Active Hours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(totalMinutes / hours.filter(h => h.minutes > 0).length) || 0}m
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Avg per Hour</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(Math.max(...hours.map(h => h.minutes)))}m
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Peak Hour</div>
        </div>
      </div>
    </div>
  );
};
