import React, { useState } from 'react';
import { Popup } from './Popup';
import { Stats } from './Stats';
import { Settings } from './Settings';

/**
 * Main Popup App with Bottom Navigation
 * Matches Android bottom navigation (Home, Statistics, Settings)
 */
type View = 'home' | 'stats' | 'settings';

export const PopupApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');

  return (
    <div className="w-[400px] h-[600px] bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'home' && <Popup />}
        {currentView === 'stats' && <Stats />}
        {currentView === 'settings' && <Settings />}
      </div>

      {/* Bottom Navigation Bar - matching Android */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-around h-16">
          {/* Home Tab */}
          <button
            onClick={() => setCurrentView('home')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
              currentView === 'home'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </button>

          {/* Statistics Tab */}
          <button
            onClick={() => setCurrentView('stats')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
              currentView === 'stats'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium">Statistics</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setCurrentView('settings')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
              currentView === 'settings'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
