import { createClient, type SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import type { Settings, Goal, InterventionResult } from '../types/models';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Supabase Service for Cloud Sync
 * Handles authentication and data synchronization
 */
export class SupabaseService {
  private static instance: SupabaseClientType | null = null;

  static getClient(): SupabaseClientType {
    if (!this.instance) {
      this.instance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: {
            getItem: async (key: string): Promise<string | null> => {
              const result = await chrome.storage.local.get(key);
              const value = result[key] as string || null;
              console.log(`[Supabase Storage] getItem(${key}):`, value ? 'Found' : 'Not found');
              return value;
            },
            setItem: async (key: string, value: string) => {
              console.log(`[Supabase Storage] setItem(${key})`);
              await chrome.storage.local.set({ [key]: value });
            },
            removeItem: async (key: string) => {
              console.log(`[Supabase Storage] removeItem(${key})`);
              await chrome.storage.local.remove(key);
            }
          },
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        }
      });
    }
    return this.instance;
  }

  /**
   * Sign in with Google OAuth - Opens new tab for authentication
   */
  static async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient();

      // Use the proper Chrome extension OAuth redirect URL format
      // Format: https://EXTENSION_ID.chromiumapp.org/
      const extensionId = chrome.runtime.id;
      const redirectURL = `https://${extensionId}.chromiumapp.org/`;

      console.log('=== OAuth Setup ===');
      console.log('Extension ID:', extensionId);
      console.log('Redirect URL:', redirectURL);
      console.log('Add this URL to Supabase Dashboard → Authentication → Redirect URLs:');
      console.log('https://uoxmrsrvcorotvphzymb.supabase.co/project/default/auth/url-configuration');
      console.log('==================');

      // Get the OAuth URL from Supabase
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectURL,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('OAuth URL generation error:', error);
        return { success: false, error: error.message };
      }

      if (!data?.url) {
        return { success: false, error: 'Failed to get OAuth URL' };
      }

      console.log('Opening OAuth URL...');

      // Use chrome.identity.launchWebAuthFlow for proper OAuth handling
      return new Promise((resolve) => {
        chrome.identity.launchWebAuthFlow(
          {
            url: data.url,
            interactive: true
          },
          async (responseUrl) => {
            if (chrome.runtime.lastError) {
              console.error('OAuth flow error:', chrome.runtime.lastError);
              resolve({ success: false, error: chrome.runtime.lastError.message });
              return;
            }

            if (!responseUrl) {
              resolve({ success: false, error: 'No response from OAuth' });
              return;
            }

            console.log('OAuth response received');

            try {
              // Extract tokens from the response URL
              const url = new URL(responseUrl);
              const hashParams = new URLSearchParams(url.hash.substring(1));
              const accessToken = hashParams.get('access_token');
              const refreshToken = hashParams.get('refresh_token');

              if (!accessToken || !refreshToken) {
                resolve({ success: false, error: 'No tokens in response' });
                return;
              }

              // Set the session in Supabase
              const { data: sessionData, error: sessionError } = await client.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });

              if (sessionError) {
                console.error('Error setting session:', sessionError);
                resolve({ success: false, error: sessionError.message });
                return;
              }

              console.log('Session set successfully!', sessionData);

              // Verify the session is working
              const { data: userData, error: userError } = await client.auth.getUser();
              if (userError || !userData.user) {
                console.error('Session set but cannot retrieve user:', userError);
                resolve({ success: false, error: 'Session created but user verification failed' });
                return;
              }

              console.log('User verified:', userData.user.email);
              resolve({ success: true });
            } catch (err) {
              console.error('Error processing auth response:', err);
              resolve({ success: false, error: String(err) });
            }
          }
        );
      });
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Sign out
   */
  static async signOut(): Promise<void> {
    const client = this.getClient();
    await client.auth.signOut();
  }

  /**
   * Get current user
   */
  static async getUser() {
    const client = this.getClient();
    const { data, error } = await client.auth.getUser();

    if (error) {
      console.error('[Supabase] Error getting user:', error);
      return null;
    }

    console.log('[Supabase] User retrieved:', data.user ? 'Signed in' : 'Not signed in');
    return data.user;
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getUser();
    return !!user;
  }

  /**
   * Sync settings to cloud
   */
  static async syncSettings(settings: Settings): Promise<void> {
    const user = await this.getUser();
    if (!user) return;

    const client = this.getClient();
    await client
      .from('user_settings')
      .upsert({
        user_id: user.id,
        settings,
        last_modified: new Date().toISOString()
      });
  }

  /**
   * Pull settings from cloud
   */
  static async pullSettings(): Promise<Settings | null> {
    const user = await this.getUser();
    if (!user) return null;

    const client = this.getClient();
    const { data, error } = await client
      .from('user_settings')
      .select('settings')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return null;
    return data.settings;
  }

  /**
   * Sync goals to cloud
   */
  static async syncGoals(goals: Goal[]): Promise<void> {
    const user = await this.getUser();
    if (!user) return;

    const client = this.getClient();

    // Delete all existing goals for this user
    await client.from('goals').delete().eq('user_id', user.id);

    // Insert new goals
    if (goals.length > 0) {
      await client.from('goals').insert(
        goals.map(goal => ({
          ...goal,
          user_id: user.id,
          last_modified: new Date().toISOString()
        }))
      );
    }
  }

  /**
   * Pull goals from cloud
   */
  static async pullGoals(): Promise<Goal[]> {
    const user = await this.getUser();
    if (!user) return [];

    const client = this.getClient();
    const { data, error } = await client
      .from('goals')
      .select('*')
      .eq('user_id', user.id);

    if (error || !data) return [];
    return data as Goal[];
  }

  /**
   * Sync intervention result to cloud
   */
  static async syncInterventionResult(result: InterventionResult): Promise<void> {
    const user = await this.getUser();
    if (!user) return;

    const client = this.getClient();
    await client.from('intervention_results').insert({
      ...result,
      user_id: user.id
    });
  }

  /**
   * Pull intervention results from cloud
   */
  static async pullInterventionResults(limit = 200): Promise<InterventionResult[]> {
    const user = await this.getUser();
    if (!user) return [];

    const client = this.getClient();
    const { data, error } = await client
      .from('intervention_results')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as InterventionResult[];
  }

  /**
   * Sync daily stats to cloud
   */
  static async syncDailyStats(date: string, stats: any): Promise<void> {
    const user = await this.getUser();
    if (!user) return;

    const client = this.getClient();
    await client
      .from('daily_stats')
      .upsert({
        user_id: user.id,
        date,
        stats,
        last_modified: new Date().toISOString()
      });
  }

  /**
   * Pull daily stats range from cloud
   */
  static async pullDailyStatsRange(startDate: string, endDate: string): Promise<any[]> {
    const user = await this.getUser();
    if (!user) return [];

    const client = this.getClient();
    const { data, error } = await client
      .from('daily_stats')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error || !data) return [];
    return data;
  }

  /**
   * Full sync - push all local data to cloud
   */
  static async fullSyncPush(localData: {
    settings: Settings;
    goals: Goal[];
    interventionResults: InterventionResult[];
  }): Promise<void> {
    const user = await this.getUser();
    if (!user) return;

    await this.syncSettings(localData.settings);
    await this.syncGoals(localData.goals);

    // Sync intervention results (last 200)
    for (const result of localData.interventionResults.slice(-200)) {
      await this.syncInterventionResult(result);
    }
  }

  /**
   * Full sync - pull all cloud data
   */
  static async fullSyncPull(): Promise<{
    settings: Settings | null;
    goals: Goal[];
    interventionResults: InterventionResult[];
  }> {
    const user = await this.getUser();
    if (!user) {
      return { settings: null, goals: [], interventionResults: [] };
    }

    const [settings, goals, interventionResults] = await Promise.all([
      this.pullSettings(),
      this.pullGoals(),
      this.pullInterventionResults()
    ]);

    return { settings, goals, interventionResults };
  }

  /**
   * Merge local and cloud data (conflict resolution)
   */
  static mergeData<T extends { last_modified?: string }>(
    local: T,
    cloud: T
  ): T {
    // Simple last-write-wins strategy
    if (!local.last_modified) return cloud;
    if (!cloud.last_modified) return local;

    const localTime = new Date(local.last_modified).getTime();
    const cloudTime = new Date(cloud.last_modified).getTime();

    return cloudTime > localTime ? cloud : local;
  }
}

/**
 * Initialize Supabase on extension load
 */
export async function initializeSupabase() {
  const client = SupabaseService.getClient();

  // Listen for auth state changes
  client.auth.onAuthStateChange((event) => {
    console.log('Supabase auth state changed:', event);

    if (event === 'SIGNED_IN') {
      // User signed in - sync data
      syncOnSignIn();
    } else if (event === 'SIGNED_OUT') {
      // User signed out - clear local data if needed
      console.log('User signed out');
    }
  });

  // Check if already authenticated
  const isAuth = await SupabaseService.isAuthenticated();
  console.log('Supabase initialized, authenticated:', isAuth);
}

/**
 * Sync data when user signs in
 */
async function syncOnSignIn() {
  try {
    // Import StorageService dynamically to avoid circular dependency
    const { StorageService } = await import('./storage');

    // Get local data
    const interventionResults = await StorageService.getInterventionResults();

    // Pull cloud data
    const cloudData = await SupabaseService.fullSyncPull();

    // Merge and save (simple: use cloud if available, otherwise keep local)
    if (cloudData.settings) {
      await StorageService.saveSettings(cloudData.settings);
    }

    if (cloudData.goals.length > 0) {
      for (const goal of cloudData.goals) {
        await StorageService.saveGoal(goal);
      }
    }

    // Push local intervention results to cloud (they don't conflict)
    for (const result of interventionResults) {
      await SupabaseService.syncInterventionResult(result);
    }

    console.log('Sync completed on sign in');
  } catch (error) {
    console.error('Error syncing on sign in:', error);
  }
}
