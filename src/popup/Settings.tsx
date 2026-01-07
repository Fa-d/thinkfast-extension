import React, { useEffect, useState } from 'react';
import { StorageService } from '../lib/storage';
import type { Settings as SettingsType } from '../types/models';
import { ThemeManager } from '../lib/theme';
import { WebsiteManager } from '../components/WebsiteManager';
import { AccountManager } from '../components/AccountManager';

/**
 * Settings Page - iOS-style grouped menu matching Android exactly
 */
export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showIntervention, setShowIntervention] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showWebsiteManager, setShowWebsiteManager] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const currentSettings = await StorageService.getSettings();
    setSettings(currentSettings);
    setLoading(false);
  };

  const handleSaveSetting = async (key: string, value: any) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    await StorageService.saveSettings(updated);
    setSettings(updated);
    chrome.runtime.sendMessage({ type: 'RELOAD_SETTINGS' });
  };

  if (loading || !settings) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header - matching Android TopAppBar */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
        </div>
      </div>

      {/* Content - iOS-style grouped cards */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {/* Group 1: Account */}
          <SettingsGroupCard>
            <SettingsMenuItem
              icon="👤"
              title="Account"
              onClick={() => setShowAccount(true)}
            />
          </SettingsGroupCard>

          {/* Group 2: Goals */}
          <SettingsGroupCard>
            <SettingsMenuItem
              icon="🎯"
              title="Goals"
              onClick={() => setShowWebsiteManager(true)}
            />
          </SettingsGroupCard>

          {/* Group 3: Notifications, Appearance, Intervention Settings */}
          <SettingsGroupCard>
            <SettingsMenuItem
              icon="🔔"
              title="Notifications"
              onClick={() => setShowNotifications(true)}
            />
            <SettingsDivider />
            <SettingsMenuItem
              icon="🌙"
              title="Appearance"
              onClick={() => setShowAppearance(true)}
            />
            <SettingsDivider />
            <SettingsMenuItem
              icon="✋"
              title="Intervention Settings"
              onClick={() => setShowIntervention(true)}
            />
          </SettingsGroupCard>

          {/* Group 4: Help & Support, About */}
          <SettingsGroupCard>
            <SettingsMenuItem
              icon="❓"
              title="Help & Support"
              onClick={() => window.open('https://github.com/anthropics/claude-code/issues', '_blank')}
            />
            <SettingsDivider />
            <SettingsMenuItem
              icon="ℹ️"
              title="About"
              onClick={() => alert('ThinkFast - Mindful Browsing v1.0.0')}
            />
          </SettingsGroupCard>

          {/* Group 5: App Version */}
          <SettingsGroupCard>
            <div className="flex items-center gap-3 p-4">
              <span className="text-2xl">📱</span>
              <div className="flex-1">
                <div className="text-base font-medium text-gray-900 dark:text-gray-100">
                  App Version
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                1.0.0
              </div>
            </div>
          </SettingsGroupCard>
        </div>
      </div>

      {/* Bottom Sheets / Modals */}
      {showNotifications && (
        <BottomSheetModal title="Notifications" onClose={() => setShowNotifications(false)}>
          <div className="space-y-6 p-6">
            <ToggleSetting
              label="Notifications Enabled"
              description="Enable all notifications"
              checked={settings.notificationsEnabled ?? true}
              onChange={(checked) => handleSaveSetting('notificationsEnabled', checked)}
            />

            <TextInputSetting
              label="Morning Notification"
              description="Daily motivation reminder"
              type="time"
              value={settings.morningNotificationTime || '08:00'}
              onChange={(value) => handleSaveSetting('morningNotificationTime', value)}
            />

            <TextInputSetting
              label="Evening Notification"
              description="End-of-day reflection"
              type="time"
              value={settings.eveningNotificationTime || '20:00'}
              onChange={(value) => handleSaveSetting('eveningNotificationTime', value)}
            />
          </div>
        </BottomSheetModal>
      )}

      {showAppearance && (
        <BottomSheetModal title="Appearance" onClose={() => setShowAppearance(false)}>
          <div className="space-y-6 p-6">
            <SelectSetting
              label="Theme"
              description="Choose your preferred theme"
              value={settings.theme || 'light'}
              onChange={async (value) => {
                handleSaveSetting('theme', value);
                if (value === 'dark') {
                  await ThemeManager.setTheme('dark');
                } else if (value === 'light') {
                  await ThemeManager.setTheme('light');
                } else {
                  await ThemeManager.useSystemTheme();
                }
              }}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'auto', label: 'Auto (System)' }
              ]}
            />
          </div>
        </BottomSheetModal>
      )}

      {showIntervention && (
        <BottomSheetModal title="Intervention Settings" onClose={() => setShowIntervention(false)}>
          <div className="space-y-6 p-6">
            <SelectSetting
              label="Timer Duration"
              description="How long between timer alerts"
              value={settings.timerDurationMinutes}
              onChange={(value) => handleSaveSetting('timerDurationMinutes', parseInt(value))}
              options={[
                { value: '5', label: '5 minutes' },
                { value: '10', label: '10 minutes' },
                { value: '15', label: '15 minutes' },
                { value: '20', label: '20 minutes' },
                { value: '30', label: '30 minutes' }
              ]}
            />

            <ToggleSetting
              label="Always Show Reminder"
              description="Show reminder every time you visit a tracked site"
              checked={settings.alwaysShowReminder}
              onChange={(checked) => handleSaveSetting('alwaysShowReminder', checked)}
            />

            <SelectSetting
              label="Overlay Style"
              description="How interventions appear on screen"
              value={settings.overlayStyle || 'full'}
              onChange={(value) => handleSaveSetting('overlayStyle', value)}
              options={[
                { value: 'full', label: 'Full Page' },
                { value: 'compact', label: 'Compact Popup' }
              ]}
            />

            <SelectSetting
              label="Friction Level"
              description="How much delay before you can proceed"
              value={settings.frictionLevel || 'auto'}
              onChange={(value) => handleSaveSetting('frictionLevel', value)}
              options={[
                { value: 'gentle', label: 'Gentle (No delay)' },
                { value: 'moderate', label: 'Moderate (3 seconds)' },
                { value: 'firm', label: 'Firm (7 seconds)' },
                { value: 'locked', label: 'Locked (15 seconds)' },
                { value: 'auto', label: 'Auto (Adaptive)' }
              ]}
            />

            <ToggleSetting
              label="Snooze Enabled"
              description="Allow snoozing interventions for 30 minutes"
              checked={settings.snoozeEnabled ?? true}
              onChange={(checked) => handleSaveSetting('snoozeEnabled', checked)}
            />
          </div>
        </BottomSheetModal>
      )}

      {/* Website Manager Modal */}
      <WebsiteManager
        show={showWebsiteManager}
        onClose={() => setShowWebsiteManager(false)}
      />

      {/* Account Modal */}
      {showAccount && (
        <BottomSheetModal title="Account & Sync" onClose={() => setShowAccount(false)}>
          <div className="p-6">
            <AccountManager />
          </div>
        </BottomSheetModal>
      )}
    </div>
  );
};

// iOS-style Components

const SettingsGroupCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
    {children}
  </div>
);

interface MenuItemProps {
  icon: string;
  title: string;
  onClick: () => void;
}

const SettingsMenuItem: React.FC<MenuItemProps> = ({ icon, title, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
  >
    <span className="text-2xl">{icon}</span>
    <span className="flex-1 text-base font-medium text-gray-900 dark:text-gray-100">
      {title}
    </span>
    <svg
      className="w-5 h-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </button>
);

const SettingsDivider: React.FC = () => (
  <div className="h-px bg-gray-200 dark:bg-gray-700 ml-14" />
);

// Bottom Sheet Modal

interface BottomSheetProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const BottomSheetModal: React.FC<BottomSheetProps> = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center"
    onClick={onClose}
  >
    <div
      className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
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
      {children}
    </div>
  </div>
);

// Setting Components

interface ToggleSettingProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSetting: React.FC<ToggleSettingProps> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <div className="text-base font-medium text-gray-900 dark:text-gray-100">{label}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

interface SelectSettingProps {
  label: string;
  description: string;
  value: any;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

const SelectSetting: React.FC<SelectSettingProps> = ({ label, description, value, onChange, options }) => (
  <div>
    <label className="block text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
      {label}
    </label>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

interface TextInputSettingProps {
  label: string;
  description: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}

const TextInputSetting: React.FC<TextInputSettingProps> = ({ label, description, type, value, onChange }) => (
  <div>
    <label className="block text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
      {label}
    </label>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{description}</p>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
);
