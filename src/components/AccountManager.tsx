import React, { useState, useEffect, useCallback } from 'react';
import { SupabaseService } from '../lib/supabase';
import { StorageService } from '../lib/storage';

/**
 * Account Manager Component
 * Handles user authentication and cloud sync
 * Optimized with useCallback for performance
 */
export const AccountManager: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUser();
    loadLastSync();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await SupabaseService.getUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLastSync = async () => {
    const timestamp = await StorageService.getLastSync();
    setLastSync(timestamp);
  };

  const handleSignIn = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await SupabaseService.signInWithGoogle();

      if (result.success) {
        setSuccess('Signed in successfully! Syncing your data...');

        // Wait a moment for session to be fully established
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Reload user
        const currentUser = await SupabaseService.getUser();
        setUser(currentUser);

        console.log('User after sign-in:', currentUser);

        if (currentUser) {
          await handleSyncAfterSignIn();
        } else {
          setError('Sign-in succeeded but could not retrieve user. Please refresh and try again.');
        }
      } else {
        setError(result.error || 'Failed to sign in');
      }
    } catch (err) {
      console.error('Sign-in error:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSyncAfterSignIn = useCallback(async () => {
    setSyncing(true);
    setError('');
    setSuccess('');

    try {
      // Get local data
      const settings = await StorageService.getSettings();
      const goals = await StorageService.getGoals();
      const interventionResults = await StorageService.getInterventionResults();

      // Push to cloud
      await SupabaseService.fullSyncPush({
        settings,
        goals,
        interventionResults
      });

      // Update last sync timestamp
      await StorageService.updateLastSync();
      await loadLastSync();

      setSuccess('Data synced successfully');
    } catch (err) {
      setError('Failed to sync: ' + String(err));
    } finally {
      setSyncing(false);
    }
  }, [user]);

  const handleSignOut = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await SupabaseService.signOut();
      setUser(null);
      setSuccess('Signed out successfully');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSync = useCallback(async () => {
    if (!user) {
      setError('Please sign in to sync');
      return;
    }

    setSyncing(true);
    setError('');
    setSuccess('');

    try {
      // Get local data
      const settings = await StorageService.getSettings();
      const goals = await StorageService.getGoals();
      const interventionResults = await StorageService.getInterventionResults();

      // Push to cloud
      await SupabaseService.fullSyncPush({
        settings,
        goals,
        interventionResults
      });

      // Update last sync timestamp
      await StorageService.updateLastSync();
      await loadLastSync();

      setSuccess('Data synced successfully');
    } catch (err) {
      setError('Failed to sync: ' + String(err));
    } finally {
      setSyncing(false);
    }
  }, [user]);

  const handlePullFromCloud = useCallback(async () => {
    if (!user) {
      setError('Please sign in to pull data');
      return;
    }

    setSyncing(true);
    setError('');
    setSuccess('');

    try {
      // Pull from cloud
      console.log('[AccountManager] Pulling data from cloud...');
      const cloudData = await SupabaseService.fullSyncPull();
      console.log('[AccountManager] Cloud data received:', {
        hasSettings: !!cloudData.settings,
        goalsCount: cloudData.goals?.length || 0,
        interventionResultsCount: cloudData.interventionResults?.length || 0
      });

      // Save to local storage
      if (cloudData.settings) {
        console.log('[AccountManager] Saving settings...');
        await StorageService.saveSettings(cloudData.settings);
      }

      if (cloudData.goals && cloudData.goals.length > 0) {
        console.log('[AccountManager] Saving goals...');
        for (const goal of cloudData.goals) {
          await StorageService.saveGoal(goal);
        }
      }

      // Update last sync timestamp
      await StorageService.updateLastSync();
      await loadLastSync();

      console.log('[AccountManager] Pull from cloud completed successfully');
      setSuccess('Data pulled from cloud successfully! Changes will be reflected across the extension.');

      // Notify the extension to reload settings
      chrome.runtime.sendMessage({ type: 'RELOAD_SETTINGS' }).catch(err => {
        console.warn('[AccountManager] Failed to send RELOAD_SETTINGS message:', err);
      });
    } catch (err) {
      console.error('[AccountManager] Pull from cloud failed:', err);
      setError('Failed to pull data: ' + String(err));
    } finally {
      setSyncing(false);
    }
  }, [user]);

  const formatDate = useCallback((timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">⏳</div>
        <p className="text-gray-600">Loading account...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Account & Sync</h2>
        <p className="text-sm text-gray-600 mt-1">
          Sign in to sync your data across devices
        </p>
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

      {/* Account Status */}
      {!user ? (
        <>
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">☁️</div>
              <h3 className="font-bold text-gray-900 mb-2">Cloud Sync Available</h3>
              <p className="text-gray-600 text-sm">
                Sign in with Google to backup your data and sync across devices
              </p>
            </div>

            <button
              onClick={handleSignIn}
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              <span className="flex items-center justify-center gap-2">
                <span>🔐</span>
                <span>Sign in with Google</span>
              </span>
            </button>
          </div>

          {/* Setup Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="text-sm text-blue-900 dark:text-blue-200">
              <p className="font-medium mb-2">⚙️ First-Time Setup Required</p>
              <p className="text-xs mb-2">Before you can sign in, configure Supabase:</p>
              <ol className="text-xs space-y-1 ml-4 list-decimal">
                <li>Click "Sign in with Google" below</li>
                <li>Open browser console (F12 → Console tab)</li>
                <li>Copy the "Redirect URL" shown (looks like: https://xxx.chromiumapp.org/)</li>
                <li>Go to <a href="https://uoxmrsrvcorotvphzymb.supabase.co/project/default/auth/url-configuration" target="_blank" rel="noopener noreferrer" className="underline font-medium">Supabase Dashboard</a></li>
                <li>Add the redirect URL to "Redirect URLs" and save</li>
                <li>Click "Sign in with Google" again - it will now work!</li>
              </ol>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {/* User Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">👤</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{user.email}</div>
                <div className="text-sm text-gray-600">Signed in</div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Sign Out
              </button>
            </div>

            {/* Last Sync */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last synced:</span>
                <span className="font-medium text-gray-900">{formatDate(lastSync)}</span>
              </div>
            </div>
          </div>

          {/* Sync Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn btn-primary py-3"
            >
              {syncing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  <span>Syncing...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>☁️</span>
                  <span>Sync Now</span>
                </span>
              )}
            </button>

            <button
              onClick={handlePullFromCloud}
              disabled={syncing}
              className="btn btn-secondary py-3"
            >
              <span className="flex items-center justify-center gap-2">
                <span>⬇️</span>
                <span>Pull from Cloud</span>
              </span>
            </button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">💡 Sync Information</p>
              <ul className="space-y-1 text-xs">
                <li>• Sync Now: Push your local data to the cloud</li>
                <li>• Pull from Cloud: Replace local data with cloud data</li>
                <li>• Auto-sync happens every 15 minutes when signed in</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warning */}
      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-900">
            <p className="font-medium mb-1">⚠️ Without Cloud Sync</p>
            <p className="text-xs">
              Your data is only stored locally. If you uninstall the extension or clear
              browser data, all your progress will be lost.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
