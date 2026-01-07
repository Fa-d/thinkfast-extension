import React, { useState, useEffect } from 'react';
import { StorageService } from '../lib/storage';
import { AnalyticsService } from '../lib/analytics';
import type { TrackedSite } from '../types/models';

export const SiteManager: React.FC = () => {
  const [sites, setSites] = useState<TrackedSite[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSite, setNewSite] = useState({
    name: '',
    pattern: '',
    dailyLimitMinutes: 30
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    const settings = await StorageService.getSettings();
    setSites(settings.trackedSites || []);
  };

  const handleAddSite = async () => {
    setError('');
    setSuccess('');

    // Validation
    if (!newSite.name.trim()) {
      setError('Please enter a site name');
      return;
    }

    if (!newSite.pattern.trim()) {
      setError('Please enter a URL pattern');
      return;
    }

    // Convert simple URL to pattern if needed
    let pattern = newSite.pattern.trim();
    if (!pattern.includes('*')) {
      // Simple URL like "facebook.com" -> "*://*.facebook.com/*"
      pattern = `*://*.${pattern}/*`;
    }

    // Check for duplicates
    if (sites.some(s => s.pattern === pattern)) {
      setError('This site is already tracked');
      return;
    }

    // Check limit (max 20 sites)
    if (sites.length >= 20) {
      setError('Maximum 20 sites allowed');
      return;
    }

    const site: TrackedSite = {
      name: newSite.name.trim(),
      pattern,
      dailyLimitMinutes: newSite.dailyLimitMinutes
    };

    const updatedSites = [...sites, site];
    await saveSites(updatedSites);

    // Track site added
    AnalyticsService.trackSiteAdded(site.name, site.dailyLimitMinutes);

    setSuccess(`Added ${newSite.name} to tracked sites`);
    setNewSite({ name: '', pattern: '', dailyLimitMinutes: 30 });
    setShowAddForm(false);
  };

  const handleRemoveSite = async (pattern: string) => {
    const site = sites.find(s => s.pattern === pattern);
    const updatedSites = sites.filter(s => s.pattern !== pattern);
    await saveSites(updatedSites);

    // Track site removed
    if (site) {
      AnalyticsService.trackSiteRemoved(site.name);
    }

    setSuccess('Site removed');
  };

  const handleUpdateLimit = async (pattern: string, newLimit: number) => {
    const updatedSites = sites.map(s =>
      s.pattern === pattern ? { ...s, dailyLimitMinutes: newLimit } : s
    );
    await saveSites(updatedSites);
  };

  const saveSites = async (updatedSites: TrackedSite[]) => {
    const settings = await StorageService.getSettings();
    settings.trackedSites = updatedSites;
    await StorageService.saveSettings(settings);
    setSites(updatedSites);

    // Notify background to reload
    chrome.runtime.sendMessage({ type: 'RELOAD_SETTINGS' });
  };

  const defaultSites = StorageService.getDefaultSettings().trackedSites;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tracked Sites</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage which websites you want to track and set daily limits
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ Add Site'}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="font-bold text-gray-900 mb-4">Add New Site</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={newSite.name}
                onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                placeholder="e.g., Facebook, Twitter"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Pattern
              </label>
              <input
                type="text"
                value={newSite.pattern}
                onChange={(e) => setNewSite({ ...newSite, pattern: e.target.value })}
                placeholder="e.g., facebook.com or *://*.facebook.com/*"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-600 mt-1">
                Simple: facebook.com | Advanced: *://*.facebook.com/*
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Limit (minutes)
              </label>
              <input
                type="number"
                value={newSite.dailyLimitMinutes}
                onChange={(e) =>
                  setNewSite({ ...newSite, dailyLimitMinutes: parseInt(e.target.value) })
                }
                min="5"
                max="480"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button onClick={handleAddSite} className="btn btn-primary w-full">
              Add Site
            </button>
          </div>
        </div>
      )}

      {/* Sites List */}
      <div className="space-y-3">
        {sites.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-5xl mb-3">🌐</div>
            <p className="text-gray-600">No tracked sites yet</p>
            <p className="text-sm text-gray-500 mt-1">Add sites to start tracking your usage</p>
          </div>
        ) : (
          sites.map((site) => {
            const isDefault = defaultSites.some(d => d.pattern === site.pattern);

            return (
              <div
                key={site.pattern}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{site.name}</h3>
                      {isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-mono">{site.pattern}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Daily Limit */}
                    <div className="text-right">
                      <label className="text-xs text-gray-600 block mb-1">Daily Limit</label>
                      <select
                        value={site.dailyLimitMinutes}
                        onChange={(e) =>
                          handleUpdateLimit(site.pattern, parseInt(e.target.value))
                        }
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value={15}>15m</option>
                        <option value={30}>30m</option>
                        <option value={45}>45m</option>
                        <option value={60}>1h</option>
                        <option value={90}>1.5h</option>
                        <option value={120}>2h</option>
                        <option value={180}>3h</option>
                      </select>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveSite(site.pattern)}
                      className="text-red-600 hover:text-red-800 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove site"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-600 text-center">
        {sites.length} of 20 sites tracked
      </div>
    </div>
  );
};
