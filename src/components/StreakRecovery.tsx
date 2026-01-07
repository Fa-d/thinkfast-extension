import React, { useState, useEffect } from 'react';
import { StorageService } from '../lib/storage';
import { AnalyticsService } from '../lib/analytics';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  gems: number;
  canRecover: boolean;
  daysSinceBreak: number;
}

/**
 * Streak Recovery Component
 * Allows users to recover broken streaks using gems
 */
export const StreakRecovery: React.FC = () => {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    setLoading(true);

    try {
      // Get today's stats and yesterday's stats
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      const todayStats = await StorageService.getDailyStats(today);
      const yesterdayStats = await StorageService.getDailyStats(yesterday);

      // Get gems from settings (stored as part of user data)
      const settings = await StorageService.getSettings();
      const gems = (settings as any).gems || 0;

      // Calculate if streak is broken (no goal achievement yesterday)
      const yesterdaySuccessRate =
        yesterdayStats.interventionsShown > 0
          ? yesterdayStats.goBackCount / yesterdayStats.interventionsShown
          : 0;

      const streakBroken = yesterdaySuccessRate < 0.5 && yesterdayStats.sessionCount > 0;

      // Calculate days since break
      const lastActive = new Date(yesterdayStats.date || yesterday);
      const now = new Date();
      const daysSinceBreak = Math.floor((now.getTime() - lastActive.getTime()) / 86400000);

      // Can only recover if broken within last 3 days and have enough gems
      const canRecover = streakBroken && daysSinceBreak <= 3 && gems >= 5;

      setStreakData({
        currentStreak: todayStats.currentStreak || 0,
        longestStreak: todayStats.longestStreak || 0,
        lastActiveDate: yesterdayStats.date || yesterday,
        gems,
        canRecover,
        daysSinceBreak
      });
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverStreak = async () => {
    if (!streakData || !streakData.canRecover) return;

    const gemCost = 5;

    if (streakData.gems < gemCost) {
      alert('Not enough gems to recover streak!');
      return;
    }

    try {
      // Deduct gems
      const settings = await StorageService.getSettings();
      (settings as any).gems = streakData.gems - gemCost;
      await StorageService.saveSettings(settings);

      // Restore streak (set yesterday's stats to show success)
      const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const yesterdayStats = await StorageService.getDailyStats(yesterdayDate);
      yesterdayStats.goBackCount = yesterdayStats.interventionsShown || 1;
      await StorageService.saveDailyStats(yesterdayDate, yesterdayStats);

      // Update today's streak
      const today = new Date().toISOString().split('T')[0];
      const todayStats = await StorageService.getDailyStats(today);
      todayStats.currentStreak = streakData.currentStreak + 1;
      await StorageService.saveDailyStats(today, todayStats);

      // Track recovery
      AnalyticsService.trackStreakRecovered(1, gemCost);

      // Reload data
      await loadStreakData();
      setShowRecoveryModal(false);

      alert('Streak recovered! Keep up the good work! 🔥');
    } catch (error) {
      console.error('Error recovering streak:', error);
      alert('Failed to recover streak. Please try again.');
    }
  };

  if (loading || !streakData) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">⏳</div>
        <p className="text-gray-600">Loading streak data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Streak Display */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200">
        <div className="text-center">
          <div className="text-6xl mb-3">🔥</div>
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {streakData.currentStreak} Day{streakData.currentStreak !== 1 ? 's' : ''}
          </div>
          <p className="text-gray-600">Current Streak</p>

          {streakData.longestStreak > streakData.currentStreak && (
            <div className="mt-4 pt-4 border-t border-orange-200">
              <p className="text-sm text-gray-600">
                Personal Best: <span className="font-semibold">{streakData.longestStreak} days</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Streak Tiers */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Streak Milestones</h3>
        <div className="space-y-3">
          <StreakTier
            name="Bronze Streak"
            days={7}
            icon="🥉"
            color="orange"
            achieved={streakData.currentStreak >= 7}
          />
          <StreakTier
            name="Silver Streak"
            days={14}
            icon="🥈"
            color="gray"
            achieved={streakData.currentStreak >= 14}
          />
          <StreakTier
            name="Gold Streak"
            days={30}
            icon="🥇"
            color="yellow"
            achieved={streakData.currentStreak >= 30}
          />
          <StreakTier
            name="Platinum Streak"
            days={100}
            icon="💎"
            color="purple"
            achieved={streakData.currentStreak >= 100}
          />
        </div>
      </div>

      {/* Gem Balance */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl mb-2">💎</div>
            <p className="text-gray-600 text-sm">Mindfulness Gems</p>
          </div>
          <div className="text-3xl font-bold text-gray-900">{streakData.gems}</div>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Earn gems by choosing "Go Back" during interventions
        </p>
      </div>

      {/* Streak Recovery Option */}
      {streakData.canRecover && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
          <div className="text-center">
            <div className="text-5xl mb-3">⚠️</div>
            <h3 className="font-bold text-gray-900 mb-2">Streak At Risk!</h3>
            <p className="text-sm text-gray-700 mb-4">
              Your streak was broken {streakData.daysSinceBreak} day
              {streakData.daysSinceBreak !== 1 ? 's' : ''} ago. You can recover it using gems!
            </p>

            <button
              onClick={() => setShowRecoveryModal(true)}
              className="btn btn-primary py-3 px-6"
            >
              <span className="flex items-center justify-center gap-2">
                <span>💎</span>
                <span>Recover Streak (5 Gems)</span>
              </span>
            </button>

            <p className="text-xs text-gray-600 mt-3">
              Recovery available for {3 - streakData.daysSinceBreak} more day
              {3 - streakData.daysSinceBreak !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">💎</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Recover Your Streak?</h2>
              <p className="text-gray-600 mb-6">
                Use 5 gems to restore your {streakData.currentStreak + 1} day streak?
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current Gems:</span>
                  <span className="font-semibold">{streakData.gems} 💎</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-semibold text-red-600">-5 💎</span>
                </div>
                <div className="border-t border-gray-200 mt-2 pt-2 flex items-center justify-between">
                  <span className="text-gray-600 font-medium">After Recovery:</span>
                  <span className="font-bold text-green-600">{streakData.gems - 5} 💎</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRecoveryModal(false)}
                  className="flex-1 btn btn-secondary py-3"
                >
                  Cancel
                </button>
                <button onClick={handleRecoverStreak} className="flex-1 btn btn-primary py-3">
                  Recover Streak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How to Earn Gems */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">💡 How to Earn Gems</h4>
        <ul className="text-xs text-gray-700 space-y-1">
          <li>• Choose "Go Back" during interventions: +1 gem</li>
          <li>• Complete a full day without exceeding limits: +3 gems</li>
          <li>• Reach streak milestones: +5-20 gems</li>
          <li>• Weekly perfect score (80%+ go-back rate): +10 gems</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Streak Tier Component
 */
interface StreakTierProps {
  name: string;
  days: number;
  icon: string;
  color: string;
  achieved: boolean;
}

const StreakTier: React.FC<StreakTierProps> = ({ name, days, icon, color, achieved }) => {
  const colorClasses = {
    orange: 'bg-orange-100 border-orange-300 text-orange-900',
    gray: 'bg-gray-100 border-gray-300 text-gray-900',
    yellow: 'bg-yellow-100 border-yellow-300 text-yellow-900',
    purple: 'bg-purple-100 border-purple-300 text-purple-900'
  };

  const baseClass = achieved
    ? colorClasses[color as keyof typeof colorClasses]
    : 'bg-gray-50 border-gray-200 text-gray-400';

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border-2 ${baseClass}`}>
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <div className="font-semibold text-sm">{name}</div>
          <div className="text-xs opacity-75">{days} days</div>
        </div>
      </div>
      {achieved && <div className="text-lg">✓</div>}
    </div>
  );
};
