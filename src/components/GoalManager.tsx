import React, { useState, useEffect } from 'react';
import { StorageService } from '../lib/storage';
import { AnalyticsService } from '../lib/analytics';
import type { Goal } from '../types/models';
import { GoalCard } from './GoalCard';

/**
 * Goal Manager Component
 * Full CRUD interface for managing daily goals
 */
export const GoalManager: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sites, setSites] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [goalsData, statsData, settings] = await Promise.all([
      StorageService.getGoals(),
      StorageService.getDailyStats(),
      StorageService.getSettings()
    ]);

    setGoals(goalsData);
    setStats(statsData);

    // Get tracked sites from settings
    const trackedSites = settings.trackedSites?.map((s: any) => s.name) || [];
    setSites(trackedSites);
  };

  const handleAddGoal = () => {
    setEditingGoal(null);
    setShowAddModal(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowAddModal(true);
  };

  // Delete functionality available in edit modal
  // const handleDeleteGoal = async (goalId: string) => {
  //   if (window.confirm('Are you sure you want to delete this goal?')) {
  //     const goal = goals.find(g => g.id === goalId);
  //     await StorageService.deleteGoal(goalId);
  //     if (goal) {
  //       AnalyticsService.trackGoalUpdated(goal.siteName, goal.dailyLimitMinutes, 0);
  //     }
  //     await loadData();
  //   }
  // };

  const handleSaveGoal = async (goalData: Partial<Goal>) => {
    if (editingGoal) {
      // Update existing goal
      const updatedGoal: Goal = {
        ...editingGoal,
        ...goalData,
        updatedAt: new Date().toISOString()
      };
      await StorageService.saveGoal(updatedGoal);
      AnalyticsService.trackGoalUpdated(
        updatedGoal.siteName,
        editingGoal.dailyLimitMinutes,
        updatedGoal.dailyLimitMinutes
      );
    } else {
      // Create new goal
      const siteName = goalData.siteName || '';
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        siteName,
        sitePattern: `*://*.${siteName.toLowerCase().replace(/\s+/g, '')}.com/*`,
        dailyLimitMinutes: goalData.dailyLimitMinutes || 30,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };
      await StorageService.saveGoal(newGoal);
      AnalyticsService.trackGoalCreated(newGoal.siteName, newGoal.dailyLimitMinutes);
    }

    setShowAddModal(false);
    setEditingGoal(null);
    await loadData();
  };

  const getUsageForSite = (siteName: string): number => {
    return stats?.siteBreakdown?.[siteName] || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Your Goals
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Set daily time limits for websites
          </p>
        </div>
        <button
          onClick={handleAddGoal}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <span className="flex items-center gap-2">
            <span>+</span>
            Add Goal
          </span>
        </button>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No goals yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Set your first goal to start building better habits
          </p>
          <button
            onClick={handleAddGoal}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-xl shadow hover:shadow-md transition-all duration-200"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              usage={getUsageForSite(goal.siteName)}
              onClick={() => handleEditGoal(goal)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      {showAddModal && (
        <GoalModal
          goal={editingGoal}
          sites={sites}
          onSave={handleSaveGoal}
          onCancel={() => {
            setShowAddModal(false);
            setEditingGoal(null);
          }}
        />
      )}

      {/* Quick Tips */}
      {goals.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <span>💡</span>
            Tips for Success
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• Start with realistic limits and adjust as needed</li>
            <li>• Use interventions to build awareness of your habits</li>
            <li>• Track your progress and celebrate small wins</li>
            <li>• Maintain your streak to build lasting change</li>
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Goal Modal Component
 * Modal for adding/editing goals
 */
interface GoalModalProps {
  goal: Goal | null;
  sites: string[];
  onSave: (goalData: Partial<Goal>) => void;
  onCancel: () => void;
}

const GoalModal: React.FC<GoalModalProps> = ({ goal, sites, onSave, onCancel }) => {
  const [siteName, setSiteName] = useState(goal?.siteName || '');
  const [dailyLimit, setDailyLimit] = useState(goal?.dailyLimitMinutes || 30);
  const [customSite, setCustomSite] = useState('');
  const [useCustomSite, setUseCustomSite] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalSiteName = useCustomSite ? customSite : siteName;

    if (!finalSiteName.trim()) {
      alert('Please select or enter a site name');
      return;
    }

    if (dailyLimit < 1 || dailyLimit > 1440) {
      alert('Daily limit must be between 1 and 1440 minutes (24 hours)');
      return;
    }

    onSave({
      siteName: finalSiteName.trim(),
      dailyLimitMinutes: dailyLimit
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100000] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {goal ? 'Edit Goal' : 'Add New Goal'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Site Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Website
            </label>

            {!useCustomSite ? (
              <>
                <select
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!useCustomSite}
                >
                  <option value="">Select a website</option>
                  {sites.map(site => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setUseCustomSite(true)}
                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  + Add custom website
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={customSite}
                  onChange={(e) => setCustomSite(e.target.value)}
                  placeholder="e.g., Twitter, YouTube"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={useCustomSite}
                />
                <button
                  type="button"
                  onClick={() => setUseCustomSite(false)}
                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  ← Choose from tracked websites
                </button>
              </>
            )}
          </div>

          {/* Daily Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily Limit (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="1440"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              That's {Math.floor(dailyLimit / 60)}h {dailyLimit % 60}m per day
            </p>
          </div>

          {/* Quick Presets */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Presets:
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[15, 30, 60, 120].map(minutes => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setDailyLimit(minutes)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dailyLimit === minutes
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {minutes}m
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {goal ? 'Save Changes' : 'Add Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
