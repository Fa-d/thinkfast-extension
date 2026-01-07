import type { InterventionContext, InterventionContent, ContentType } from '../types/intervention';
import { ContentPools } from '../utils/content-pools';

/**
 * Intervention Engine
 * Context-aware content selection for interventions
 * Ported from Android with all selection logic
 */
export class InterventionEngine {
  private static lastShownContent: string[] = [];
  private static readonly MAX_HISTORY = 10;

  /**
   * Select intervention content based on type and context
   */
  static selectContent(
    type: 'REMINDER' | 'TIMER',
    context: InterventionContext
  ): InterventionContent {
    // Calculate content type weights based on context
    const weights = this.calculateWeights(type, context);

    // Select content type using weighted random
    const contentType = this.weightedRandom(weights);

    // Get specific content for selected type
    const content = this.getContentForType(contentType, context);

    // Track to avoid repeats
    this.trackShownContent(content.id);

    return content;
  }

  /**
   * Calculate weights for each content type based on context
   */
  private static calculateWeights(
    type: 'REMINDER' | 'TIMER',
    context: InterventionContext
  ): Record<string, number> {
    // Base weights for different content types
    const baseWeights: Record<string, number> = {
      REFLECTION: 40,
      TIME_ALTERNATIVE: 30,
      BREATHING: 20,
      STATS: 10,
      QUOTE: 5,
      ACTIVITY: 15,
      EMOTIONAL: 0, // Conditional
      GAMIFICATION: 0 // Conditional
    };

    // Context-based adjustments
    const isLateNight = context.timeOfDay >= 22 || context.timeOfDay <= 5;
    const isWeekendMorning =
      context.isWeekend && context.timeOfDay >= 6 && context.timeOfDay <= 10;
    const isQuickReopen = context.quickReopenAttempt;
    const isExtendedSession = type === 'TIMER';
    const isOverGoal = context.isOverGoal;
    const hasStreak = context.streakDays >= 7;

    // Late night adjustments - encourage rest
    if (isLateNight) {
      baseWeights.ACTIVITY = 40;
      baseWeights.BREATHING = 30;
      baseWeights.REFLECTION = 20;
      baseWeights.TIME_ALTERNATIVE = 10;
    }

    // Weekend morning - encourage productive activities
    if (isWeekendMorning) {
      baseWeights.REFLECTION = 35;
      baseWeights.ACTIVITY = 35;
      baseWeights.TIME_ALTERNATIVE = 20;
    }

    // Quick reopen - stronger emotional appeal
    if (isQuickReopen) {
      baseWeights.REFLECTION = 60;
      baseWeights.EMOTIONAL = 25;
      baseWeights.QUOTE = 10;
    }

    // Extended session - show alternatives and stats
    if (isExtendedSession) {
      baseWeights.TIME_ALTERNATIVE = 60;
      baseWeights.STATS = 20;
      baseWeights.BREATHING = 15;
    }

    // Over goal - emphasize stats and reflection
    if (isOverGoal) {
      baseWeights.STATS = 35;
      baseWeights.REFLECTION = 30;
      baseWeights.QUOTE = 20;
    }

    // Has streak - gamification elements
    if (hasStreak) {
      baseWeights.GAMIFICATION = 25;
      baseWeights.STATS = 25;
    }

    return baseWeights;
  }

  /**
   * Weighted random selection
   */
  private static weightedRandom(weights: Record<string, number>): string {
    // Filter out zero weights
    const activeWeights = Object.entries(weights).filter(([_, weight]) => weight > 0);

    if (activeWeights.length === 0) {
      return 'REFLECTION'; // Fallback
    }

    const totalWeight = activeWeights.reduce((sum, [_, weight]) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (const [type, weight] of activeWeights) {
      random -= weight;
      if (random <= 0) {
        return type;
      }
    }

    return 'REFLECTION'; // Fallback
  }

  /**
   * Get specific content for a content type
   */
  private static getContentForType(
    contentType: string,
    context: InterventionContext
  ): InterventionContent {
    // Handle special cases that don't have pools
    if (contentType === 'STATS') {
      return this.createStatsContent(context);
    }

    if (contentType === 'GAMIFICATION') {
      return this.createGamificationContent(context);
    }

    if (contentType === 'EMOTIONAL') {
      // Emotional appeals are reflections with emotional category
      contentType = 'REFLECTION';
    }

    // Get pool for content type
    const pool = ContentPools[contentType as keyof typeof ContentPools];
    if (!pool || pool.length === 0) {
      // Fallback to reflection
      return {
        type: 'REFLECTION',
        data: { id: 'fallback', question: 'What matters most right now?', category: 'priority' },
        id: 'fallback'
      };
    }

    // Filter out recently shown content
    const available = pool.filter(item => !this.lastShownContent.includes(item.id));
    const candidates = available.length > 0 ? available : pool;

    // Select based on context for certain types
    if (contentType === 'ACTIVITY') {
      return this.selectActivity(candidates as any[], context);
    }

    if (contentType === 'TIME_ALTERNATIVE') {
      return this.selectTimeAlternative(candidates as any[], context);
    }

    // Random selection for other types
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    return {
      type: contentType as ContentType,
      data: selected,
      id: selected.id
    };
  }

  /**
   * Select activity based on time of day
   */
  private static selectActivity(pool: any[], context: InterventionContext): InterventionContent {
    const hour = context.timeOfDay;
    let timeOfDay: string;

    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    // Filter activities by time of day
    const timeAppropriate = pool.filter(
      act => act.timeOfDay === timeOfDay || act.timeOfDay === 'any'
    );

    const candidates = timeAppropriate.length > 0 ? timeAppropriate : pool;
    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    return {
      type: 'ACTIVITY',
      data: selected,
      id: selected.id
    };
  }

  /**
   * Select time alternative based on context
   */
  private static selectTimeAlternative(
    pool: any[],
    context: InterventionContext
  ): InterventionContent {
    // For extended sessions, suggest longer alternatives
    const preferLonger = context.sessionCount > 3 || context.totalUsageToday > 60;

    let candidates = pool;
    if (preferLonger) {
      // Prefer 10-30 minute alternatives
      candidates = pool.filter(alt => alt.duration.includes('10') || alt.duration.includes('30'));
    }

    if (candidates.length === 0) candidates = pool;

    const selected = candidates[Math.floor(Math.random() * candidates.length)];

    return {
      type: 'TIME_ALTERNATIVE',
      data: selected,
      id: selected.id
    };
  }

  /**
   * Create stats visualization content
   */
  private static createStatsContent(context: InterventionContext): InterventionContent {
    return {
      type: 'STATS',
      data: {
        todayUsage: context.totalUsageToday,
        weeklyAverage: 0, // TODO: Calculate from historical data
        goalProgress: context.isOverGoal ? 100 : 50,
        streakDays: context.streakDays
      },
      id: `stats_${Date.now()}`
    };
  }

  /**
   * Create gamification content
   */
  private static createGamificationContent(context: InterventionContext): InterventionContent {
    const messages = [
      `🔥 ${context.streakDays} day streak! Keep it going!`,
      `⭐ You've made ${context.sessionCount} mindful choices today!`,
      `🎯 You're building a powerful habit!`,
      `💪 ${context.streakDays} days of intentional browsing!`
    ];

    return {
      type: 'GAMIFICATION',
      data: {
        message: messages[Math.floor(Math.random() * messages.length)],
        streakDays: context.streakDays
      },
      id: `gamification_${Date.now()}`
    };
  }

  /**
   * Track shown content to avoid repeats
   */
  private static trackShownContent(id: string) {
    this.lastShownContent.push(id);
    if (this.lastShownContent.length > this.MAX_HISTORY) {
      this.lastShownContent.shift();
    }
  }

  /**
   * Reset history (for testing or user preference)
   */
  static resetHistory() {
    this.lastShownContent = [];
  }
}
