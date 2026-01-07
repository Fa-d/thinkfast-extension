import React from 'react';
import type { InterventionContent as InterventionContentType } from '../types/intervention';

interface Props {
  content: InterventionContentType;
}

export const InterventionContent: React.FC<Props> = ({ content }) => {
  switch (content.type) {
    case 'REFLECTION':
      return <ReflectionContent data={content.data} />;
    case 'QUOTE':
      return <QuoteContent data={content.data} />;
    case 'TIME_ALTERNATIVE':
      return <TimeAlternativeContent data={content.data} />;
    case 'BREATHING':
      return <BreathingContent data={content.data} />;
    case 'ACTIVITY':
      return <ActivityContent data={content.data} />;
    case 'STATS':
      return <StatsContent data={content.data} />;
    case 'GAMIFICATION':
      return <GamificationContent data={content.data} />;
    default:
      return <DefaultContent />;
  }
};

/**
 * Reflection Question Content
 */
const ReflectionContent: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="text-center px-8">
      <div className="text-5xl mb-6">🤔</div>
      <p className="text-3xl font-serif leading-relaxed italic" style={{ color: 'var(--intervention-text-primary)' }}>
        "{data.question}"
      </p>
    </div>
  );
};

/**
 * Quote Content
 */
const QuoteContent: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="text-center px-8">
      <div className="text-5xl mb-6">💭</div>
      <blockquote className="text-2xl leading-relaxed italic mb-4 font-serif" style={{ color: 'var(--intervention-text-primary)' }}>
        "{data.text}"
      </blockquote>
      <p className="font-medium" style={{ color: 'var(--intervention-text-secondary)' }}>— {data.author}</p>
    </div>
  );
};

/**
 * Time Alternative Content
 */
const TimeAlternativeContent: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="px-4">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">⏰</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--intervention-text-primary)' }}>In {data.duration}, you could...</h2>
      </div>
      <div className="space-y-3">
        {data.alternatives.map((alt: string, index: number) => (
          <div
            key={index}
            className="flex items-center gap-3 p-4 bg-white/15 rounded-xl border border-white/30"
          >
            <span className="text-2xl">•</span>
            <span className="text-lg" style={{ color: 'var(--intervention-text-primary)' }}>{alt}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Breathing Exercise Content
 * Matches Android BreathingExercise.kt with proper phase states
 */
const BreathingContent: React.FC<{ data: any }> = () => {
  const [phaseIndex, setPhaseIndex] = React.useState(0);

  // Box Breathing: INHALE (4s) -> HOLD (4s) -> EXHALE (4s) -> HOLD (4s)
  const phases = [
    { name: 'Breathe In', duration: 4000, targetScale: 1.4 },
    { name: 'Hold', duration: 4000, targetScale: 1.4 },
    { name: 'Breathe Out', duration: 4000, targetScale: 1.0 },
    { name: 'Hold', duration: 4000, targetScale: 1.0 }
  ];

  const currentPhase = phases[phaseIndex];

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPhaseIndex(prev => (prev + 1) % phases.length);
    }, currentPhase.duration);

    return () => clearTimeout(timer);
  }, [phaseIndex, currentPhase.duration, phases.length]);

  return (
    <div className="text-center py-8">
      <div className="relative flex items-center justify-center h-48 mb-8">
        <div
          className="w-32 h-32 rounded-full bg-white/30 shadow-2xl ease-in-out"
          style={{
            transform: `scale(${currentPhase.targetScale})`,
            transition: `transform ${currentPhase.duration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`
          }}
        />
      </div>

      <p className="text-3xl font-medium" style={{ color: 'var(--intervention-text-primary)' }}>
        {currentPhase.name}
      </p>
      <p className="text-base mt-4" style={{ color: 'var(--intervention-text-secondary)' }}>
        Follow the circle. Breathe deeply.
      </p>
    </div>
  );
};

/**
 * Activity Suggestion Content
 */
const ActivityContent: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="text-center px-6">
      <div className="text-5xl mb-6">✨</div>
      <div className="bg-white/15 border border-white/30 rounded-xl p-6 mb-4">
        <p className="text-2xl font-medium mb-2" style={{ color: 'var(--intervention-text-primary)' }}>{data.suggestion}</p>
      </div>
      <p className="italic text-lg" style={{ color: 'var(--intervention-text-secondary)' }}>{data.benefit}</p>
    </div>
  );
};

/**
 * Stats Visualization Content
 */
const StatsContent: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="px-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">📊</div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--intervention-text-primary)' }}>Your Progress Today</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon="⏱️"
          label="Time Today"
          value={`${Math.round(data.todayUsage)}m`}
        />
        <StatCard
          icon="🎯"
          label="Goal Progress"
          value={`${Math.round(data.goalProgress)}%`}
        />
        {data.streakDays > 0 && (
          <>
            <StatCard
              icon="🔥"
              label="Streak"
              value={`${data.streakDays} days`}
            />
            <StatCard
              icon="📈"
              label="Weekly Avg"
              value={`${Math.round(data.weeklyAverage)}m`}
            />
          </>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value
}) => {
  return (
    <div className="bg-white/15 border border-white/30 rounded-xl p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm mb-1" style={{ color: 'var(--intervention-text-secondary)' }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color: 'var(--intervention-text-primary)' }}>{value}</div>
    </div>
  );
};

/**
 * Gamification Content
 */
const GamificationContent: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="text-center px-6">
      <div className="text-6xl mb-6">🏆</div>
      <p className="text-2xl leading-relaxed mb-6" style={{ color: 'var(--intervention-text-primary)' }}>
        {data.message}
      </p>
      {data.streakDays >= 7 && (
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 border border-white/40 rounded-full">
          <span className="text-2xl">🔥</span>
          <span className="font-bold" style={{ color: 'var(--intervention-text-primary)' }}>
            {data.streakDays} Day Streak!
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Default/Fallback Content
 */
const DefaultContent: React.FC = () => {
  return (
    <div className="text-center px-6">
      <div className="text-5xl mb-6">🎯</div>
      <p className="text-2xl font-medium mb-4" style={{ color: 'var(--intervention-text-primary)' }}>Take a mindful moment</p>
      <p className="text-lg" style={{ color: 'var(--intervention-text-secondary)' }}>
        Is this where you want to spend your time right now?
      </p>
    </div>
  );
};
