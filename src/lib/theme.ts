import { StorageService } from './storage';

/**
 * Theme Manager
 * Handles dark mode and theme preferences
 */
export class ThemeManager {
  private static currentTheme: 'light' | 'dark' = 'light';

  /**
   * Initialize theme from storage
   */
  static async initialize() {
    const settings = await StorageService.getSettings();
    const savedTheme = settings.theme || 'light';

    // Handle 'auto' theme by using system preference
    if (savedTheme === 'auto') {
      this.currentTheme = this.getSystemTheme();
    } else {
      this.currentTheme = savedTheme as 'light' | 'dark';
    }

    this.applyTheme(this.currentTheme);
  }

  /**
   * Apply theme to document
   */
  static applyTheme(theme: 'light' | 'dark') {
    this.currentTheme = theme;

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Update meta theme color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1f2937' : '#ffffff');
    }
  }

  /**
   * Toggle theme
   */
  static async toggleTheme(): Promise<'light' | 'dark'> {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    await this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Set specific theme
   */
  static async setTheme(theme: 'light' | 'dark') {
    this.applyTheme(theme);

    // Save to storage
    const settings = await StorageService.getSettings();
    settings.theme = theme;
    await StorageService.saveSettings(settings);
  }

  /**
   * Get current theme
   */
  static getTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  /**
   * Detect system theme preference
   */
  static getSystemTheme(): 'light' | 'dark' {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Use system theme
   */
  static async useSystemTheme() {
    const systemTheme = this.getSystemTheme();
    await this.setTheme(systemTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async (e) => {
      const settings = await StorageService.getSettings();
      if (settings.theme === 'auto') {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}
