import type { Variants, Transition } from 'framer-motion';

// Shared transition presets
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1],
};

export const gentleTransition: Transition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1],
};

// Page transition variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// Fade in from bottom
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
};

// Fade in scale
export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: smoothTransition,
  },
};

// Stagger container for child animation
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

// Stagger child items
export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 16,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Sidebar collapse/expand
export const sidebarVariants: Variants = {
  expanded: {
    width: 240,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  collapsed: {
    width: 72,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Sidebar label fade
export const sidebarLabelVariants: Variants = {
  expanded: {
    opacity: 1,
    width: 'auto',
    display: 'block',
    transition: { duration: 0.2, delay: 0.1 },
  },
  collapsed: {
    opacity: 0,
    width: 0,
    transitionEnd: { display: 'none' },
    transition: { duration: 0.15 },
  },
};

// AI sparkle pulse
export const aiPulse: Variants = {
  initial: {
    scale: 1,
    opacity: 0.7,
  },
  animate: {
    scale: [1, 1.15, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// AI shimmer effect
export const aiShimmer: Variants = {
  initial: {
    backgroundPosition: '-200% center',
  },
  animate: {
    backgroundPosition: '200% center',
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Card hover lift
export const cardHover = {
  rest: {
    y: 0,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  hover: {
    y: -3,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

// Modal/drawer enter
export const slideInRight: Variants = {
  initial: {
    x: '100%',
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: gentleTransition,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// Command palette overlay
export const overlayVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: { duration: 0.15 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

export const commandPaletteVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: -10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -10,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// Number counter spring
export const counterSpring: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
  mass: 0.5,
};

// Status badge pulse
export const statusPulse: Variants = {
  initial: {
    scale: 1,
  },
  animate: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
