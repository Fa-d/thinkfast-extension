import React from 'react';

interface Props {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercentage?: boolean;
}

/**
 * Progress Ring Component
 * Circular progress indicator matching Android app design
 */
export const ProgressRing: React.FC<Props> = ({
  percentage,
  size = 200,
  strokeWidth = 20,
  label,
  showPercentage = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  // Color based on percentage
  const getColor = () => {
    if (percentage < 50) return '#4CAF50'; // Green - on track
    if (percentage < 90) return '#FFA726'; // Orange - approaching
    return '#FF5252'; // Red - over limit
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Center label */}
      <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: size / 2 - 30 }}>
        {showPercentage && (
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(percentage)}%
          </div>
        )}
        {label && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">
            {label}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Compact Progress Ring (smaller size for cards)
 */
export const CompactProgressRing: React.FC<Props> = ({
  percentage,
  size = 80,
  strokeWidth = 8
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  const getColor = () => {
    if (percentage < 50) return '#4CAF50';
    if (percentage < 90) return '#FFA726';
    return '#FF5252';
  };

  const color = getColor();

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute text-sm font-bold text-gray-900 dark:text-gray-100">
        {Math.round(percentage)}%
      </div>
    </div>
  );
};
