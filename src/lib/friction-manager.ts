import { StorageService } from './storage';
import type { FrictionLevel, FrictionConfig } from '../types/intervention';
import { FRICTION_CONFIGS } from '../types/intervention';

/**
 * Friction Manager
 * Manages friction levels and countdown delays for interventions
 */
export class FrictionManager {
  /**
   * Get current friction configuration
   */
  static async getFrictionConfig(): Promise<FrictionConfig> {
    const settings = await StorageService.getSettings();
    const level = settings.frictionLevel;

    if (level === 'auto') {
      // Auto-adaptive friction based on user behavior
      return await this.calculateAdaptiveFriction();
    }

    return {
      level,
      ...FRICTION_CONFIGS[level]
    };
  }

  /**
   * Calculate adaptive friction based on user behavior
   */
  private static async calculateAdaptiveFriction(): Promise<FrictionConfig> {
    const results = await StorageService.getInterventionResults();

    if (results.length < 10) {
      // Not enough data, use gentle
      return { level: 'gentle', ...FRICTION_CONFIGS.gentle };
    }

    // Get last 20 results
    const recent = results.slice(-20);
    const proceedCount = recent.filter(r => r.userChoice === 'PROCEED').length;
    const proceedRate = proceedCount / recent.length;

    // Adapt friction based on proceed rate
    if (proceedRate > 0.8) {
      // User proceeds most of the time - increase friction
      return { level: 'firm', ...FRICTION_CONFIGS.firm };
    } else if (proceedRate > 0.5) {
      // User proceeds half the time - moderate friction
      return { level: 'moderate', ...FRICTION_CONFIGS.moderate };
    } else {
      // User goes back most of the time - keep it gentle
      return { level: 'gentle', ...FRICTION_CONFIGS.gentle };
    }
  }

  /**
   * Get friction level for display
   */
  static async getFrictionLevel(): Promise<FrictionLevel> {
    const config = await this.getFrictionConfig();
    return config.level;
  }
}
