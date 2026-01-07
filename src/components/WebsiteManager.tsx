import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StorageService } from '../lib/storage';
import type { Goal } from '../types/models';
import { AnalyticsService } from '../lib/analytics';

interface Props {
  show: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface PresetWebsite {
  name: string;
  pattern: string;
  icon: string;
  defaultLimit: number;
}

const PRESET_WEBSITES: PresetWebsite[] = [
  { name: 'Facebook', pattern: '*://*.facebook.com/*', icon: '📘', defaultLimit: 30 },
  { name: 'Instagram', pattern: '*://*.instagram.com/*', icon: '📷', defaultLimit: 30 },
  { name: 'Twitter/X', pattern: '*://*.twitter.com/*', icon: '🐦', defaultLimit: 30 },
  { name: 'X.com', pattern: '*://*.x.com/*', icon: '✖️', defaultLimit: 30 },
  { name: 'TikTok', pattern: '*://*.tiktok.com/*', icon: '🎵', defaultLimit: 30 },
  { name: 'YouTube', pattern: '*://*.youtube.com/*', icon: '📺', defaultLimit: 60 },
  { name: 'Reddit', pattern: '*://*.reddit.com/*', icon: '🤖', defaultLimit: 45 },
  { name: 'LinkedIn', pattern: '*://*.linkedin.com/*', icon: '💼', defaultLimit: 45 },
  { name: 'Pinterest', pattern: '*://*.pinterest.com/*', icon: '📌', defaultLimit: 30 },
  { name: 'Snapchat', pattern: '*://*.snapchat.com/*', icon: '👻', defaultLimit: 30 },
  { name: 'Twitch', pattern: '*://*.twitch.tv/*', icon: '🎮', defaultLimit: 60 },
  { name: 'Netflix', pattern: '*://*.netflix.com/*', icon: '🎬', defaultLimit: 120 },
  { name: 'WhatsApp Web', pattern: '*://web.whatsapp.com/*', icon: '💬', defaultLimit: 45 },
  { name: 'Discord', pattern: '*://*.discord.com/*', icon: '💬', defaultLimit: 60 },
  { name: 'Slack', pattern: '*://*.slack.com/*', icon: '💼', defaultLimit: 60 }
];

/**
 * Website Manager Modal
 * Allows users to add/manage tracked websites with URL patterns and limits
 */
export const WebsiteManager: React.FC<Props> = ({ show, onClose, onSaved }) => {
  const [view, setView] = useState<'list' | 'add-preset' | 'add-custom'>('list');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());

  // Custom website form
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customLimit, setCustomLimit] = useState(30);

  // Track current slider values (controlled component pattern)
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (show) {
      loadGoals();
    }
  }, [show]);

  // Initialize slider values when goals load
  useEffect(() => {
    if (goals.length > 0) {
      const initialValues: Record<string, number> = {};
      goals.forEach(goal => {
        initialValues[goal.id] = goal.dailyLimitMinutes;
      });
      setSliderValues(initialValues);
    }
  }, [goals]);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    const allGoals = await StorageService.getGoals();
    setGoals(allGoals);
    setLoading(false);
  }, []);

  const handleAddPresetWebsites = useCallback(async () => {
    const sitesToAdd = PRESET_WEBSITES.filter(site => selectedPresets.has(site.name));

    for (const site of sitesToAdd) {
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        siteName: site.name,
        sitePattern: site.pattern,
        dailyLimitMinutes: site.defaultLimit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        currentStreak: 0,
        longestStreak: 0
      };

      await StorageService.saveGoal(newGoal);
      AnalyticsService.trackGoalCreated(site.name, site.defaultLimit);
    }

    setSelectedPresets(new Set());
    setView('list');
    await loadGoals();
    onSaved?.();
  }, [selectedPresets, loadGoals, onSaved]);

  const handleAddCustomWebsite = useCallback(async () => {
    if (!customName.trim() || !customUrl.trim()) {
      alert('Please enter both website name and URL');
      return;
    }

    // Convert URL to pattern
    let pattern = customUrl.trim();

    // If user didn't include protocol, add wildcard
    if (!pattern.startsWith('http') && !pattern.startsWith('*://')) {
      pattern = `*://${pattern}`;
    }

    // If no wildcard path, add it
    if (!pattern.endsWith('*')) {
      pattern = `${pattern}/*`;
    }

    const newGoal: Goal = {
      id: crypto.randomUUID(),
      siteName: customName.trim(),
      sitePattern: pattern,
      dailyLimitMinutes: customLimit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      currentStreak: 0,
      longestStreak: 0
    };

    await StorageService.saveGoal(newGoal);
    AnalyticsService.trackGoalCreated(customName, customLimit);

    // Reset form
    setCustomName('');
    setCustomUrl('');
    setCustomLimit(30);
    setView('list');
    await loadGoals();
    onSaved?.();
  }, [customName, customUrl, customLimit, loadGoals, onSaved]);

  const handleDeleteGoal = useCallback(async (goalId: string) => {
    if (window.confirm('Remove this website from tracking?')) {
      const goal = goals.find(g => g.id === goalId);
      await StorageService.deleteGoal(goalId);
      if (goal) {
        AnalyticsService.trackGoalUpdated(goal.siteName, goal.dailyLimitMinutes, 0);
      }
      await loadGoals();
      onSaved?.();
    }
  }, [goals, loadGoals, onSaved]);

  /**
   * Handle slider change (saves to storage when drag ends)
   */
  const handleSliderChange = useCallback(async (goalId: string, newLimit: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal && goal.dailyLimitMinutes !== newLimit) {
      const updated = { ...goal, dailyLimitMinutes: newLimit, updatedAt: new Date().toISOString() };
      await StorageService.saveGoal(updated);
      AnalyticsService.trackGoalUpdated(goal.siteName, goal.dailyLimitMinutes, newLimit);

      // Update goals state
      setGoals(prevGoals =>
        prevGoals.map(g => g.id === goalId ? updated : g)
      );

      onSaved?.();
    }
  }, [goals, onSaved]);

  // Memoize filtered presets for performance
  const availablePresets = useMemo(() =>
    PRESET_WEBSITES.filter(
      preset => !goals.some(goal => goal.sitePattern === preset.pattern)
    ),
    [goals]
  );

  // Optimize Set operations with functional updates
  const togglePreset = useCallback((name: string) => {
    setSelectedPresets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {view === 'list' && 'Manage Websites'}
            {view === 'add-preset' && 'Add Popular Websites'}
            {view === 'add-custom' && 'Add Custom Website'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {view === 'list' && (
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setView('add-preset')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Popular Sites
                </button>
                <button
                  onClick={() => setView('add-custom')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Custom URL
                </button>
              </div>

              {/* Tracked Websites List */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
              ) : goals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-3">🌐</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No Websites Tracked
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add websites to start tracking your usage
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Tracked Websites ({goals.length})
                  </h3>
                  {goals.map(goal => (
                    <div
                      key={goal.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xl">
                            {goal.siteName ? goal.siteName.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {goal.siteName || 'Unknown Site'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {goal.sitePattern || 'No pattern'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Daily Limit: {sliderValues[goal.id] ?? goal.dailyLimitMinutes} minutes
                        </label>

                        {/* Click-based time selection */}
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {[15, 30, 45, 60, 90, 120, 150, 180].map(minutes => (
                            <button
                              key={minutes}
                              onClick={() => {
                                setSliderValues(prev => ({ ...prev, [goal.id]: minutes }));
                                handleSliderChange(goal.id, minutes);
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                (sliderValues[goal.id] ?? goal.dailyLimitMinutes) === minutes
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              {minutes}m
                            </button>
                          ))}
                        </div>

                        {/* Fine-tune with +/- buttons */}
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              const currentValue = sliderValues[goal.id] ?? goal.dailyLimitMinutes;
                              const newValue = Math.max(5, currentValue - 5);
                              setSliderValues(prev => ({ ...prev, [goal.id]: newValue }));
                              handleSliderChange(goal.id, newValue);
                            }}
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                          >
                            -5 min
                          </button>
                          <button
                            onClick={() => {
                              const currentValue = sliderValues[goal.id] ?? goal.dailyLimitMinutes;
                              const newValue = Math.min(180, currentValue + 5);
                              setSliderValues(prev => ({ ...prev, [goal.id]: newValue }));
                              handleSliderChange(goal.id, newValue);
                            }}
                            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                          >
                            +5 min
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'add-preset' && (
            <div className="space-y-4">
              <button
                onClick={() => setView('list')}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to list
              </button>

              {availablePresets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-3">✅</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    All Popular Sites Added
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You can add custom websites using the Custom URL option
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Select websites to track:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {availablePresets.map(site => (
                      <button
                        key={site.name}
                        onClick={() => togglePreset(site.name)}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          selectedPresets.has(site.name)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{site.icon}</span>
                          <div className="text-left">
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {site.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {site.defaultLimit} min/day
                            </div>
                          </div>
                        </div>
                        {selectedPresets.has(site.name) && (
                          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>

                  {selectedPresets.size > 0 && (
                    <button
                      onClick={handleAddPresetWebsites}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                    >
                      Add {selectedPresets.size} Website{selectedPresets.size > 1 ? 's' : ''}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {view === 'add-custom' && (
            <div className="space-y-4">
              <button
                onClick={() => setView('list')}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to list
              </button>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., GitHub, Gmail, etc."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website URL or Domain
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="e.g., github.com, *.example.com/*, https://site.com/*"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Examples: reddit.com, *.youtube.com/*, https://twitter.com/*
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Daily Limit: {customLimit} minutes
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="180"
                    step="5"
                    value={customLimit}
                    onInput={(e) => setCustomLimit(parseInt(e.currentTarget.value))}
                    onChange={(e) => setCustomLimit(parseInt(e.currentTarget.value))}
                    className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                    style={{
                      background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((customLimit - 5) / 175) * 100}%, #e5e7eb ${((customLimit - 5) / 175) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>5 min</span>
                    <span>180 min</span>
                  </div>
                </div>

                <button
                  onClick={handleAddCustomWebsite}
                  disabled={!customName.trim() || !customUrl.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Add Website
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
