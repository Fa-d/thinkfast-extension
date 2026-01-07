import React, { useState, useEffect } from 'react';
import { StorageService } from '../lib/storage';
import { AnalyticsService } from '../lib/analytics';

interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward: number; // gems
  completed: boolean;
  action?: string;
}

interface OnboardingState {
  quests: Quest[];
  totalGems: number;
  completedCount: number;
}

/**
 * Onboarding Quest System
 * Guides new users through key features
 */
export const OnboardingQuest: React.FC = () => {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestState();
  }, []);

  const loadQuestState = async () => {
    setLoading(true);

    try {
      const settings = await StorageService.getSettings();
      const onboarding = (settings as any).onboarding || {};
      const completedQuests = onboarding.completedQuests || [];
      const hasSeenWelcome = onboarding.hasSeenWelcome || false;

      // Define quests
      const quests: Quest[] = [
        {
          id: 'add_first_site',
          title: 'Add Your First Site',
          description: 'Track a website that you want to be more mindful about',
          icon: '🌐',
          reward: 5,
          completed: completedQuests.includes('add_first_site'),
          action: 'Add a custom tracked site in Settings'
        },
        {
          id: 'experience_intervention',
          title: 'Experience an Intervention',
          description: 'Visit a tracked site and see the mindfulness prompt',
          icon: '💭',
          reward: 3,
          completed: completedQuests.includes('experience_intervention')
        },
        {
          id: 'choose_go_back',
          title: 'Make a Mindful Choice',
          description: 'Choose "Go Back" during an intervention',
          icon: '✨',
          reward: 5,
          completed: completedQuests.includes('choose_go_back')
        },
        {
          id: 'set_goal',
          title: 'Set a Daily Goal',
          description: 'Create a usage goal for one of your tracked sites',
          icon: '🎯',
          reward: 5,
          completed: completedQuests.includes('set_goal'),
          action: 'Set daily limits in Site Manager'
        },
        {
          id: 'complete_day',
          title: 'Complete Your First Day',
          description: 'Finish a full day while staying under your goals',
          icon: '🌅',
          reward: 10,
          completed: completedQuests.includes('complete_day')
        },
        {
          id: 'reach_3_day_streak',
          title: 'Build a Streak',
          description: 'Maintain mindful browsing for 3 days in a row',
          icon: '🔥',
          reward: 10,
          completed: completedQuests.includes('reach_3_day_streak')
        },
        {
          id: 'enable_sync',
          title: 'Enable Cloud Sync',
          description: 'Sign in to backup your progress across devices',
          icon: '☁️',
          reward: 5,
          completed: completedQuests.includes('enable_sync'),
          action: 'Sign in with Google in Account & Sync'
        }
      ];

      const completedCount = quests.filter(q => q.completed).length;
      const totalGems = quests.filter(q => q.completed).reduce((sum, q) => sum + q.reward, 0);

      setState({
        quests,
        totalGems,
        completedCount
      });

      // Show welcome modal for first-time users
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    } catch (error) {
      console.error('Error loading quest state:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissWelcome = async () => {
    setShowWelcome(false);

    // Mark welcome as seen
    const settings = await StorageService.getSettings();
    (settings as any).onboarding = {
      ...(settings as any).onboarding,
      hasSeenWelcome: true
    };
    await StorageService.saveSettings(settings);
  };

  const completeQuest = async (questId: string) => {
    if (!state) return;

    const settings = await StorageService.getSettings();
    const onboarding = (settings as any).onboarding || {};
    const completedQuests = onboarding.completedQuests || [];

    if (!completedQuests.includes(questId)) {
      completedQuests.push(questId);
      onboarding.completedQuests = completedQuests;

      // Award gems
      const quest = state.quests.find(q => q.id === questId);
      if (quest) {
        const currentGems = (settings as any).gems || 0;
        (settings as any).gems = currentGems + quest.reward;
      }

      (settings as any).onboarding = onboarding;
      await StorageService.saveSettings(settings);

      // Track quest completion
      AnalyticsService.trackFeatureUsed('quest_completed', { quest_id: questId });

      // Reload state
      await loadQuestState();
    }
  };

  if (loading || !state) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">⏳</div>
        <p className="text-gray-600">Loading quests...</p>
      </div>
    );
  }

  const progressPercent = (state.completedCount / state.quests.length) * 100;

  return (
    <div className="space-y-6">
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to ThinkFast!</h2>
              <p className="text-gray-600 mb-6">
                Build better browsing habits with mindful interventions. Complete quests to earn
                gems and unlock features!
              </p>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 font-medium mb-2">🎯 How It Works:</p>
                <ul className="text-xs text-left text-gray-600 space-y-1">
                  <li>1. Track websites you want to be mindful about</li>
                  <li>2. Get gentle reminders when visiting them</li>
                  <li>3. Make mindful choices to earn gems</li>
                  <li>4. Build streaks and recover with gems</li>
                </ul>
              </div>

              <button onClick={handleDismissWelcome} className="btn btn-primary w-full py-3">
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Header */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-lg">Getting Started</h3>
          <div className="text-2xl">🎮</div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-gray-900">
              {state.completedCount} / {state.quests.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Gems Earned */}
        <div className="flex items-center justify-between bg-white bg-opacity-60 rounded-lg p-3">
          <span className="text-sm text-gray-700">Gems Earned</span>
          <div className="flex items-center gap-2">
            <span className="text-xl">💎</span>
            <span className="font-bold text-gray-900">{state.totalGems}</span>
          </div>
        </div>
      </div>

      {/* Quest List */}
      <div className="space-y-3">
        {state.quests.map((quest, index) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            number={index + 1}
            onComplete={() => completeQuest(quest.id)}
          />
        ))}
      </div>

      {/* Completion Celebration */}
      {state.completedCount === state.quests.length && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300 text-center">
          <div className="text-6xl mb-3">🎊</div>
          <h3 className="font-bold text-gray-900 text-xl mb-2">Quests Complete!</h3>
          <p className="text-gray-700 mb-4">
            You've mastered ThinkFast basics. Keep building mindful habits!
          </p>
          <div className="bg-white bg-opacity-60 rounded-lg p-4 inline-block">
            <div className="text-3xl mb-1">💎</div>
            <div className="text-2xl font-bold text-gray-900">{state.totalGems} Total Gems</div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Quest Card Component
 */
interface QuestCardProps {
  quest: Quest;
  number: number;
  onComplete: () => void;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest }) => {
  return (
    <div
      className={`rounded-xl p-4 border-2 transition-all ${
        quest.completed
          ? 'bg-green-50 border-green-300'
          : 'bg-white border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Quest Number/Icon */}
        <div className="flex-shrink-0">
          {quest.completed ? (
            <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-xl">
              ✓
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
              {quest.icon}
            </div>
          )}
        </div>

        {/* Quest Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold ${quest.completed ? 'text-green-900' : 'text-gray-900'}`}>
              {quest.title}
            </h4>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-lg">💎</span>
              <span className="font-bold text-sm">{quest.reward}</span>
            </div>
          </div>

          <p className={`text-sm ${quest.completed ? 'text-green-700' : 'text-gray-600'} mb-2`}>
            {quest.description}
          </p>

          {quest.action && !quest.completed && (
            <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-xs text-blue-900">
              💡 {quest.action}
            </div>
          )}

          {quest.completed && (
            <div className="text-xs text-green-700 font-medium">✓ Completed</div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Export function to complete quests from other components
 */
export async function completeOnboardingQuest(questId: string) {
  const settings = await StorageService.getSettings();
  const onboarding = (settings as any).onboarding || {};
  const completedQuests = onboarding.completedQuests || [];

  if (!completedQuests.includes(questId)) {
    completedQuests.push(questId);
    onboarding.completedQuests = completedQuests;
    (settings as any).onboarding = onboarding;
    await StorageService.saveSettings(settings);

    AnalyticsService.trackFeatureUsed('quest_completed', { quest_id: questId });
  }
}
