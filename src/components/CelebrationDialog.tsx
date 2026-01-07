import React, { useEffect, useState } from 'react';

interface Props {
  type: 'streak' | 'goal' | 'quest' | 'milestone';
  title: string;
  message: string;
  reward?: {
    gems?: number;
    badge?: string;
  };
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

/**
 * Celebration Dialog Component
 * Shows animated celebrations for achievements, streaks, and milestones
 */
export const CelebrationDialog: React.FC<Props> = ({
  type,
  title,
  message,
  reward,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; x: number; delay: number; duration: number; rotation: number }>>([]);

  useEffect(() => {
    // Entrance animation
    setTimeout(() => setIsVisible(true), 10);

    // Generate confetti
    const pieces = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1,
      rotation: Math.random() * 360
    }));
    setConfettiPieces(pieces);

    // Auto close
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'streak':
        return '🔥';
      case 'goal':
        return '🎯';
      case 'quest':
        return '✨';
      case 'milestone':
        return '🏆';
      default:
        return '🎉';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'streak':
        return 'from-orange-400 to-red-500';
      case 'goal':
        return 'from-green-400 to-emerald-500';
      case 'quest':
        return 'from-blue-400 to-purple-500';
      case 'milestone':
        return 'from-yellow-400 to-amber-500';
      default:
        return 'from-blue-400 to-purple-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiPieces.map(piece => (
          <div
            key={piece.id}
            className="absolute top-0 w-2 h-2 bg-gradient-to-br from-yellow-400 to-pink-500 rounded-sm"
            style={{
              left: `${piece.x}%`,
              animation: `confettiFall ${piece.duration}s linear ${piece.delay}s infinite`,
              transform: `rotate(${piece.rotation}deg)`,
              opacity: 0.8
            }}
          />
        ))}
      </div>

      {/* Dialog */}
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
      >
        {/* Icon */}
        <div className="mb-6">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${getColor()} shadow-lg animate-bounce`}>
            <span className="text-5xl">{getIcon()}</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {title}
        </h2>

        {/* Message */}
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>

        {/* Reward */}
        {reward && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-4 mb-6 border-2 border-yellow-200 dark:border-yellow-800">
            {reward.gems !== undefined && (
              <div className="flex items-center justify-center gap-2 text-xl font-semibold">
                <span className="text-3xl">💎</span>
                <span className={`bg-gradient-to-r ${getColor()} bg-clip-text text-transparent`}>
                  +{reward.gems} Gems
                </span>
              </div>
            )}
            {reward.badge && (
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {reward.badge}
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        {!autoClose && (
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className={`w-full bg-gradient-to-r ${getColor()} text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
          >
            Awesome!
          </button>
        )}

        {/* Auto-close indicator */}
        {autoClose && (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Closing in {Math.ceil(autoCloseDelay / 1000)}s...
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Streak Celebration
 * Specialized celebration for streak milestones
 */
interface StreakCelebrationProps {
  days: number;
  onClose: () => void;
}

export const StreakCelebration: React.FC<StreakCelebrationProps> = ({ days, onClose }) => {
  const getTier = () => {
    if (days >= 30) return { name: 'Platinum', emoji: '💎', gems: 20 };
    if (days >= 14) return { name: 'Gold', emoji: '🥇', gems: 15 };
    if (days >= 7) return { name: 'Silver', emoji: '🥈', gems: 10 };
    return { name: 'Bronze', emoji: '🥉', gems: 5 };
  };

  const tier = getTier();

  return (
    <CelebrationDialog
      type="streak"
      title={`${days} Day Streak!`}
      message={`You've maintained ${tier.name} tier for ${days} consecutive days of mindful browsing!`}
      reward={{
        gems: tier.gems,
        badge: `${tier.emoji} ${tier.name} Streak`
      }}
      onClose={onClose}
      autoClose={false}
    />
  );
};

/**
 * Goal Achievement Celebration
 * Specialized celebration for meeting daily goals
 */
interface GoalCelebrationProps {
  siteName: string;
  onClose: () => void;
}

export const GoalCelebration: React.FC<GoalCelebrationProps> = ({ siteName, onClose }) => {
  return (
    <CelebrationDialog
      type="goal"
      title="Goal Met!"
      message={`You stayed within your limit on ${siteName} today. Great self-control!`}
      reward={{ gems: 3 }}
      onClose={onClose}
      autoClose={true}
      autoCloseDelay={2500}
    />
  );
};

/**
 * Quest Completion Celebration
 * Specialized celebration for completing quests
 */
interface QuestCelebrationProps {
  questName: string;
  gems: number;
  onClose: () => void;
}

export const QuestCelebration: React.FC<QuestCelebrationProps> = ({ questName, gems, onClose }) => {
  return (
    <CelebrationDialog
      type="quest"
      title="Quest Complete!"
      message={questName}
      reward={{ gems }}
      onClose={onClose}
      autoClose={true}
      autoCloseDelay={2500}
    />
  );
};

/**
 * Milestone Celebration
 * Specialized celebration for major milestones
 */
interface MilestoneCelebrationProps {
  milestone: string;
  description: string;
  onClose: () => void;
}

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
  milestone,
  description,
  onClose
}) => {
  return (
    <CelebrationDialog
      type="milestone"
      title={milestone}
      message={description}
      reward={{ gems: 25, badge: '🏆 Special Achievement' }}
      onClose={onClose}
      autoClose={false}
    />
  );
};
