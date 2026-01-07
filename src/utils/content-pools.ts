/**
 * Intervention Content Pools
 * Ported from Android app with all intervention content
 */

import type {
  ReflectionContent,
  TimeAlternativeContent,
  BreathingContent,
  QuoteContent,
  ActivityContent
} from '../types/intervention';

export const ReflectionQuestions: ReflectionContent[] = [
  // Trigger-based reflections
  { id: 'ref1', question: 'What triggered this impulse to browse?', category: 'trigger' },
  { id: 'ref2', question: 'Am I avoiding something right now?', category: 'trigger' },
  { id: 'ref3', question: 'What feeling am I trying to escape?', category: 'trigger' },

  // Priority reflections
  { id: 'ref4', question: 'Is this the most important thing right now?', category: 'priority' },
  { id: 'ref5', question: 'What matters most to me today?', category: 'priority' },
  { id: 'ref6', question: 'What would I rather be doing?', category: 'priority' },

  // Emotional reflections
  { id: 'ref7', question: 'How will I feel after spending time here?', category: 'emotional' },
  { id: 'ref8', question: 'What do I actually need right now?', category: 'emotional' },
  { id: 'ref9', question: 'Am I scrolling out of boredom or genuine interest?', category: 'emotional' },

  // Pattern reflections
  { id: 'ref10', question: 'What pattern am I repeating?', category: 'pattern' },
  { id: 'ref11', question: 'Have I been here before today?', category: 'pattern' },
  { id: 'ref12', question: 'Is this becoming a habit I want?', category: 'pattern' },

  // Future-focused reflections
  { id: 'ref13', question: 'What would my future self thank me for doing instead?', category: 'future' },
  { id: 'ref14', question: 'Will this matter tomorrow?', category: 'future' },
  { id: 'ref15', question: 'What am I building with my time?', category: 'future' }
];

export const TimeAlternatives: TimeAlternativeContent[] = [
  {
    id: 'alt1',
    duration: '2 minutes',
    alternatives: [
      'Drink a glass of water 💧',
      'Do 10 pushups 💪',
      'Write down one thing you\'re grateful for ✍️',
      'Take 3 deep breaths 🌬️'
    ]
  },
  {
    id: 'alt2',
    duration: '5 minutes',
    alternatives: [
      'Take a short walk outside 🚶',
      'Call a friend or family member 📞',
      'Meditate or practice mindfulness 🧘',
      'Stretch your body 🤸',
      'Read a few pages of a book 📖'
    ]
  },
  {
    id: 'alt3',
    duration: '10 minutes',
    alternatives: [
      'Go for a walk around the block 🏃',
      'Journal about your day 📝',
      'Practice a hobby or skill 🎨',
      'Listen to music or a podcast 🎵',
      'Organize your space 🧹'
    ]
  },
  {
    id: 'alt4',
    duration: '30 minutes',
    alternatives: [
      'Exercise or go to the gym 🏋️',
      'Cook a healthy meal 🍳',
      'Work on a personal project 🛠️',
      'Learn something new online 📚',
      'Connect with loved ones 💕'
    ]
  }
];

export const BreathingExercises: BreathingContent[] = [
  {
    id: 'breath1',
    variant: '4-7-8',
    name: '4-7-8 Breathing',
    duration: 19000 // 4s inhale + 7s hold + 8s exhale
  },
  {
    id: 'breath2',
    variant: 'box',
    name: 'Box Breathing',
    duration: 16000 // 4s x 4 phases
  },
  {
    id: 'breath3',
    variant: 'calm',
    name: 'Calm Breathing',
    duration: 20000 // 5s inhale + 5s exhale x 2
  }
];

export const Quotes: QuoteContent[] = [
  {
    id: 'quote1',
    text: 'The way we spend our days is the way we spend our lives.',
    author: 'Annie Dillard'
  },
  {
    id: 'quote2',
    text: 'You will never find time for anything. If you want time, you must make it.',
    author: 'Charles Buxton'
  },
  {
    id: 'quote3',
    text: 'Time is what we want most, but what we use worst.',
    author: 'William Penn'
  },
  {
    id: 'quote4',
    text: 'The bad news is time flies. The good news is you\'re the pilot.',
    author: 'Michael Altshuler'
  },
  {
    id: 'quote5',
    text: 'Your time is limited, don\'t waste it living someone else\'s life.',
    author: 'Steve Jobs'
  },
  {
    id: 'quote6',
    text: 'Lost time is never found again.',
    author: 'Benjamin Franklin'
  },
  {
    id: 'quote7',
    text: 'The key is not to prioritize what\'s on your schedule, but to schedule your priorities.',
    author: 'Stephen Covey'
  },
  {
    id: 'quote8',
    text: 'You can\'t have a better tomorrow if you\'re still thinking about yesterday.',
    author: 'Charles Kettering'
  }
];

export const Activities: ActivityContent[] = [
  // Morning activities
  {
    id: 'act1',
    timeOfDay: 'morning',
    suggestion: 'Go outside for 5 minutes of sunlight ☀️',
    benefit: 'Boost your energy and mood for the day'
  },
  {
    id: 'act2',
    timeOfDay: 'morning',
    suggestion: 'Make your bed 🛏️',
    benefit: 'Start the day with a small win'
  },

  // Afternoon activities
  {
    id: 'act3',
    timeOfDay: 'afternoon',
    suggestion: 'Take a 10-minute walk 🚶',
    benefit: 'Refresh your mind and boost creativity'
  },
  {
    id: 'act4',
    timeOfDay: 'afternoon',
    suggestion: 'Drink a glass of water 💧',
    benefit: 'Stay hydrated and maintain focus'
  },

  // Evening activities
  {
    id: 'act5',
    timeOfDay: 'evening',
    suggestion: 'Journal about your day 📝',
    benefit: 'Process your thoughts and emotions'
  },
  {
    id: 'act6',
    timeOfDay: 'evening',
    suggestion: 'Call a friend or family member 📞',
    benefit: 'Strengthen your relationships'
  },

  // Night activities
  {
    id: 'act7',
    timeOfDay: 'night',
    suggestion: 'Practice gratitude - write 3 things you\'re thankful for ✍️',
    benefit: 'End the day on a positive note'
  },
  {
    id: 'act8',
    timeOfDay: 'night',
    suggestion: 'Prepare for tomorrow 📅',
    benefit: 'Reduce anxiety and sleep better'
  },

  // Anytime activities
  {
    id: 'act9',
    timeOfDay: 'any',
    suggestion: 'Do 10 pushups or squats 💪',
    benefit: 'Get your blood flowing'
  },
  {
    id: 'act10',
    timeOfDay: 'any',
    suggestion: 'Read a chapter of a book 📖',
    benefit: 'Feed your mind with knowledge'
  }
];

export const ContentPools = {
  REFLECTION: ReflectionQuestions,
  TIME_ALTERNATIVE: TimeAlternatives,
  BREATHING: BreathingExercises,
  QUOTE: Quotes,
  ACTIVITY: Activities
};
