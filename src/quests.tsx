import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { OnboardingQuest } from './components/OnboardingQuest';
import { ThemeManager } from './lib/theme';

// Initialize theme
ThemeManager.initialize();

/**
 * Quests Page
 * Dedicated page for onboarding quests
 */
const QuestsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎮</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Onboarding Quests</h1>
              <p className="text-gray-600 dark:text-gray-400">Complete quests to earn gems and master ThinkFast</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <OnboardingQuest />
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QuestsPage />
  </StrictMode>
);
