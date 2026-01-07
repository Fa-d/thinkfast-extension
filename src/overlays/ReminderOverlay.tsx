import React, { useState, useEffect } from 'react';
import { InterventionEngine } from '../lib/intervention-engine';
import { FrictionManager } from '../lib/friction-manager';
import { InterventionContent } from '../components/InterventionContent';
import { AnalyticsService } from '../lib/analytics';
import type { InterventionContent as InterventionContentType } from '../types/intervention';

interface Props {
  session: any;
  context: any;
  onResult: (result: any) => void;
}

export const ReminderOverlay: React.FC<Props> = ({ session, context, onResult }) => {
  const [content, setContent] = useState<InterventionContentType | null>(null);
  const [canProceed, setCanProceed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    loadContent();
    loadFriction();
  }, []);

  const loadContent = async () => {
    const selectedContent = InterventionEngine.selectContent('REMINDER', context);
    setContent(selectedContent);

    // Track intervention shown
    AnalyticsService.trackInterventionShown('REMINDER', selectedContent.type, context);
  };

  const loadFriction = async () => {
    const friction = await FrictionManager.getFrictionConfig();
    const delaySeconds = Math.max(0, friction.delaySeconds - 2); // Reminders have less friction
    setCountdown(delaySeconds);

    if (delaySeconds === 0) {
      setCanProceed(true);
    } else {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanProceed(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  };

  const handleGoBack = async () => {
    const timeToDecision = Date.now() - startTime;
    const result = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      type: 'REMINDER' as const,
      contentType: content?.type || 'SIMPLE',
      userChoice: 'GO_BACK' as const,
      timeToShowDecisionMs: timeToDecision,
      timestamp: new Date().toISOString()
    };

    // Track choice
    AnalyticsService.trackInterventionChoice(
      'REMINDER',
      content?.type || 'SIMPLE',
      'GO_BACK',
      timeToDecision
    );

    onResult(result);

    // Close the current tab (equivalent to Android closing the app)
    // Send message to background script since content scripts can't use chrome.tabs.remove()
    await chrome.runtime.sendMessage({ type: 'CLOSE_CURRENT_TAB' });
  };

  const handleProceed = () => {
    if (!canProceed) return;

    const timeToDecision = Date.now() - startTime;
    const result = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      type: 'REMINDER' as const,
      contentType: content?.type || 'SIMPLE',
      userChoice: 'PROCEED' as const,
      timeToShowDecisionMs: timeToDecision,
      timestamp: new Date().toISOString()
    };

    // Track choice
    AnalyticsService.trackInterventionChoice(
      'REMINDER',
      content?.type || 'SIMPLE',
      'PROCEED',
      timeToDecision
    );

    onResult(result);
  };

  const handleSnooze = async () => {
    const snoozeDuration = 30; // minutes

    // Send message to background to snooze interventions
    await chrome.runtime.sendMessage({
      type: 'SNOOZE_INTERVENTIONS',
      duration: snoozeDuration
    });

    // Track snooze
    AnalyticsService.trackSnoozeActivated(snoozeDuration);

    const timeToDecision = Date.now() - startTime;
    const result = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      type: 'REMINDER' as const,
      contentType: content?.type || 'SIMPLE',
      userChoice: 'SNOOZE' as const,
      timeToShowDecisionMs: timeToDecision,
      timestamp: new Date().toISOString()
    };

    onResult(result);
  };

  if (!content) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 z-[999999] flex items-center justify-center">
        <div className="text-2xl" style={{ color: 'var(--intervention-text-primary)' }}>Loading...</div>
      </div>
    );
  }

  // Get gradient colors based on content type (matching Android)
  const gradientColors = getGradientForContent(content?.type || 'SIMPLE');

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-8"
      style={{
        background: `linear-gradient(to bottom, ${gradientColors.start}, ${gradientColors.end})`
      }}
    >
      <div className="w-full max-w-2xl flex flex-col justify-between" style={{ minHeight: '80vh' }}>
        {/* Top: App name */}
        <div className="text-center">
          <h1 className="text-2xl font-medium" style={{ color: 'var(--intervention-text-primary)' }}>
            {session.siteName}
          </h1>
        </div>

        {/* Middle: Intervention Content */}
        <div className="flex items-center justify-center flex-1">
          <InterventionContent content={content} />
        </div>

        {/* Bottom: Action Buttons */}
        <div className="w-full flex flex-col items-center">
          {/* Snooze Button - 85% width */}
          <button
            onClick={handleSnooze}
            className="h-12 flex items-center justify-center gap-2 rounded-xl transition-all hover:bg-white/25 active:scale-95"
            style={{
              width: '85%',
              border: '1.5px solid rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: 'var(--intervention-text-primary)'
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-[15px]">Snooze for 30 minutes</span>
          </button>

          <div className="h-4"></div>

          {/* Action Buttons - Side by Side Row */}
          {!canProceed ? (
            <div className="text-center space-y-4">
              <p className="text-base" style={{ color: 'var(--intervention-text-primary)', opacity: 0.9 }}>Take a breath and consider...</p>
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-white/30 border-t-white animate-spin"></div>
                <span className="text-2xl font-bold" style={{ color: 'var(--intervention-text-primary)' }}>{countdown}s</span>
              </div>
            </div>
          ) : (
            <div className="w-full flex gap-4">
              {/* Go Back Button - 60% width, 64px height, with home icon */}
              <button
                onClick={handleGoBack}
                className="flex-[0.6] h-16 flex items-center justify-center gap-2 rounded-xl font-semibold text-lg transition-all active:scale-95 shadow-lg"
                style={{
                  backgroundColor: 'var(--intervention-go-back)',
                  color: '#FFFFFF'
                }}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span>Go Back</span>
              </button>

              {/* Proceed Button - 40% width, 64px height, outlined */}
              <button
                onClick={handleProceed}
                className="flex-[0.4] h-16 flex items-center justify-center rounded-xl font-medium text-base transition-all hover:bg-white/10 active:scale-95"
                style={{
                  border: '1px solid var(--intervention-proceed)',
                  backgroundColor: 'transparent',
                  color: 'var(--intervention-proceed)'
                }}
              >
                Proceed
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Gradient colors matching Android InterventionGradients.kt
function getGradientForContent(type: string): { start: string; end: string } {
  const gradients: Record<string, { start: string; end: string }> = {
    'REFLECTION': { start: '#1A237E', end: '#283593' },
    'TIME_ALTERNATIVE': { start: '#E65100', end: '#F57C00' },
    'BREATHING': { start: '#2E7D32', end: '#43A047' },
    'STATS': { start: '#455A64', end: '#607D8B' },
    'EMOTIONAL': { start: '#6A1B9A', end: '#8E24AA' },
    'QUOTE': { start: '#E65100', end: '#FF6F00' },
    'GAMIFICATION': { start: '#00695C', end: '#00897B' },
    'ACTIVITY': { start: '#D84315', end: '#E64A19' },
    'SIMPLE': { start: '#455A64', end: '#607D8B' }, // Default to stats gradient
  };

  return gradients[type] || gradients.SIMPLE;
};
