import React, { useState, useEffect } from 'react';
import { TimerOverlay } from '../overlays/TimerOverlay';
import { ReminderOverlay } from '../overlays/ReminderOverlay';

/**
 * Overlay Injector
 * Determines which overlay type to show and renders it
 * This is the entry point for intervention overlays injected into web pages
 *
 * NOTE: CSS is loaded dynamically via injectInterventionStyles() in content-script.ts
 * to prevent polluting host pages with global styles
 */

interface Props {
  data: {
    type: 'REMINDER' | 'TIMER';
    session: any;
    context: any;
  };
  onClose: () => void;
}

export const OverlayInjector: React.FC<Props> = ({ data, onClose }) => {
  const [overlayStyle, setOverlayStyle] = useState<'full' | 'compact'>('full');

  // Load user preference for overlay style
  useEffect(() => {
    chrome.storage.sync.get('settings', (result) => {
      const settings = result?.settings as { overlayStyle?: 'full' | 'compact' } | undefined;
      if (settings?.overlayStyle) {
        setOverlayStyle(settings.overlayStyle);
      }
    });
  }, []);

  const handleResult = async (result: any) => {
    // Send result to background script
    await chrome.runtime.sendMessage({
      type: 'INTERVENTION_RESULT',
      data: result
    });

    onClose();
  };

  // Show compact overlay if user prefers it
  if (overlayStyle === 'compact') {
    return <CompactOverlay type={data.type} session={data.session} context={data.context} onResult={handleResult} onClose={onClose} />;
  }

  // Show full overlays with intervention content
  if (data.type === 'TIMER') {
    return <TimerOverlay session={data.session} context={data.context} onResult={handleResult} />;
  }

  return <ReminderOverlay session={data.session} context={data.context} onResult={handleResult} />;
};

/**
 * Compact Overlay (small popup in corner)
 */
const CompactOverlay: React.FC<any> = ({ type, session, onResult, onClose }) => {
  const [startTime] = useState(Date.now());

  const handleGoBack = async () => {
    const result = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      type,
      contentType: 'COMPACT',
      userChoice: 'GO_BACK',
      timeToShowDecisionMs: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
    onResult(result);

    // Close the current tab (equivalent to Android closing the app)
    // Send message to background script since content scripts can't use chrome.tabs.remove()
    await chrome.runtime.sendMessage({ type: 'CLOSE_CURRENT_TAB' });
  };

  const handleProceed = () => {
    onClose();
  };

  return (
    <div className="fixed bottom-4 right-4 z-[999999] max-w-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border-2 border-blue-500 dark:border-blue-400">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">{type === 'TIMER' ? '⏱️' : '🎯'}</span>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
              {type === 'TIMER' ? 'Time check!' : 'Quick reminder'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {type === 'TIMER'
                ? `${Math.floor(session.totalDuration / 60000)} minutes on ${session.siteName}`
                : `You're visiting ${session.siteName}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleGoBack} className="btn btn-primary flex-1 py-2">
            Go Back
          </button>
          <button onClick={handleProceed} className="btn btn-secondary flex-1 py-2">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
