import React, { useState, useEffect } from 'react';
import { ThemeManager } from '../lib/theme';
import { AnalyticsService } from '../lib/analytics';

/**
 * Theme Toggle Component
 * Allows users to switch between light and dark modes
 */
export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    await ThemeManager.initialize();
    setTheme(ThemeManager.getTheme());
  };

  const handleToggle = async () => {
    const newTheme = await ThemeManager.toggleTheme();
    setTheme(newTheme);

    // Track theme change
    AnalyticsService.trackSettingsChanged('theme', theme, newTheme);
  };

  return (
    <button
      onClick={handleToggle}
      className="relative inline-flex items-center h-8 w-16 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      style={{
        backgroundColor: theme === 'dark' ? '#2196F3' : '#D1D5DB'
      }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span
        className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out"
        style={{
          transform: theme === 'dark' ? 'translateX(2.25rem)' : 'translateX(0.25rem)'
        }}
      >
        <span className="flex items-center justify-center h-full text-sm">
          {theme === 'dark' ? '🌙' : '☀️'}
        </span>
      </span>
    </button>
  );
};

/**
 * Theme Toggle with Label
 */
export const ThemeToggleWithLabel: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    await ThemeManager.initialize();
    setTheme(ThemeManager.getTheme());
  };

  const handleToggle = async () => {
    const newTheme = await ThemeManager.toggleTheme();
    setTheme(newTheme);
    AnalyticsService.trackSettingsChanged('theme', theme, newTheme);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Use dark theme for easier viewing at night
        </div>
      </div>
      <button
        onClick={handleToggle}
        className="relative inline-flex items-center h-8 w-16 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        style={{
          backgroundColor: theme === 'dark' ? '#2196F3' : '#D1D5DB'
        }}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <span
          className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out"
          style={{
            transform: theme === 'dark' ? 'translateX(2.25rem)' : 'translateX(0.25rem)'
          }}
        >
          <span className="flex items-center justify-center h-full text-sm">
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
        </span>
      </button>
    </div>
  );
};
