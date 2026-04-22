/**
 * Style helpers for FloatingAiChat: only `sx` shapes with **more than 3**
 * top-level keys live here; simpler `sx` stays inline in the component.
 */
import type { SxProps, Theme } from '@mui/material/styles';
import { alpha, lighten } from '@mui/material/styles';
import { keyframes } from '@mui/system';

/**
 * Idle choreography for the roboSphere FAB. One ~14s cycle that layers:
 *  - a gentle bob (the old `fabFloat`, kept as the baseline),
 *  - a yawn (anticipatory squash → tall stretch → ease back) around the
 *    middle of the cycle,
 *  - a full 360° rotate towards the end of the cycle.
 *
 * Combining everything into a single keyframe sequence avoids layering two
 * `transform`-based animations (which conflict on the same element). The
 * rotation lands exactly on `360deg` at cycle end so the next iteration
 * starts clean without a visible snap.
 */
export const fabIdleDance = keyframes`
  /* Bob — 3 easy up-downs over the first ~45% of the cycle */
  0%   { transform: translate3d(0, 0, 0) rotate(0deg) scale(1, 1); }
  10%  { transform: translate3d(0, -7px, 0) rotate(0deg) scale(1, 1); }
  20%  { transform: translate3d(0, 0, 0) rotate(0deg) scale(1, 1); }
  30%  { transform: translate3d(0, -7px, 0) rotate(0deg) scale(1, 1); }
  40%  { transform: translate3d(0, 0, 0) rotate(0deg) scale(1, 1); }

  /* Yawn — squash-anticipation, tall-stretch peak, ease back */
  45%  { transform: translate3d(0, 0, 0) rotate(-3deg) scale(1.06, 0.92); }
  52%  { transform: translate3d(0, -10px, 0) rotate(4deg) scale(1.08, 1.18); }
  57%  { transform: translate3d(0, -5px, 0) rotate(-2deg) scale(1.04, 1.08); }
  62%  { transform: translate3d(0, 0, 0) rotate(0deg) scale(1, 1); }

  /* 360° rotate — a slow spin with a small hover, nose ends exactly where it started */
  70%  { transform: translate3d(0, -3px, 0) rotate(0deg) scale(1, 1); }
  82%  { transform: translate3d(0, -3px, 0) rotate(180deg) scale(1, 1); }
  94%  { transform: translate3d(0, -3px, 0) rotate(360deg) scale(1, 1); }
  100% { transform: translate3d(0, 0, 0) rotate(360deg) scale(1, 1); }
`;

/** Kept as a backwards-compat alias — older imports stay valid. */
export const fabFloat = fabIdleDance;

/** While the model runs — breathe + glow on the FAB (no spinner). */
export const fabGeneratingPulse = keyframes`
  0%, 100% {
    transform: scale(1);
    filter: brightness(1) saturate(1);
  }
  50% {
    transform: scale(1.07);
    filter: brightness(1.14) saturate(1.15);
  }
`;

/** Expanding ring outside the FAB */
export const fabGeneratingRipple = keyframes`
  0% {
    transform: scale(0.88);
    opacity: 0.85;
  }
  70%, 100% {
    transform: scale(1.32);
    opacity: 0;
  }
`;

function primaryFabShadowStrings(theme: Theme) {
  const { main, dark } = theme.palette.primary;
  const floatShadow = [
    `0 0 0 1px ${alpha('#000', 0.07)}`,
    `0 1px 2px ${alpha('#000', 0.16)}`,
    `0 4px 8px -2px ${alpha('#0f172a', 0.28)}`,
    `0 10px 22px -4px ${alpha('#0f172a', 0.32)}`,
    `0 22px 48px -10px ${alpha('#0f172a', 0.38)}`,
    `0 14px 36px -8px ${alpha(main, 0.48)}`,
    `inset 0 3px 6px ${alpha('#fff', 0.45)}`,
    `inset 0 -4px 12px ${alpha(dark, 0.45)}`,
    `inset 0 0 0 1px ${alpha('#fff', 0.2)}`,
  ].join(', ');
  const hoverShadow = [
    `0 0 0 1px ${alpha('#000', 0.09)}`,
    `0 2px 4px ${alpha('#000', 0.14)}`,
    `0 8px 16px -2px ${alpha('#0f172a', 0.32)}`,
    `0 16px 36px -6px ${alpha('#0f172a', 0.38)}`,
    `0 30px 64px -12px ${alpha('#0f172a', 0.44)}`,
    `0 20px 44px -10px ${alpha(main, 0.58)}`,
    `inset 0 3px 7px ${alpha('#fff', 0.52)}`,
    `inset 0 -3px 10px ${alpha(dark, 0.4)}`,
    `inset 0 0 0 1px ${alpha('#fff', 0.26)}`,
  ].join(', ');
  const pressedShadow = [
    `0 0 0 1px ${alpha('#000', 0.06)}`,
    `0 1px 2px ${alpha('#000', 0.2)}`,
    `0 3px 8px -2px ${alpha('#0f172a', 0.26)}`,
    `0 8px 18px -4px ${alpha('#0f172a', 0.24)}`,
    `0 6px 16px -6px ${alpha(main, 0.32)}`,
    `inset 0 2px 4px ${alpha('#fff', 0.28)}`,
    `inset 0 4px 14px ${alpha('#000', 0.22)}`,
  ].join(', ');
  return { floatShadow, hoverShadow, pressedShadow };
}

export function floatingChatFabSx(opts: {
  pos: { left: number; top: number };
  open: boolean;
  generating: boolean;
  fabWhenOpenZ: number;
}): SxProps<Theme> {
  const { pos, open, generating, fabWhenOpenZ } = opts;
  return (theme) => {
    const { main, dark, contrastText } = theme.palette.primary;
    const topTint = lighten(main, 0.26);
    const { floatShadow, hoverShadow, pressedShadow } =
      primaryFabShadowStrings(theme);

    return {
      position: 'fixed',
      left: pos.left,
      top: pos.top,
      overflow: 'visible',
      zIndex: open ? fabWhenOpenZ : theme.zIndex.modal + 1,
      color: contrastText,
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      cursor: 'grab',
      touchAction: 'none',
      animation: generating
        ? `${fabGeneratingPulse} 1.05s ease-in-out infinite`
        : open
          ? 'none'
          : // Idle choreography: bob → yawn → 360° spin, on a slow 14s loop
            // so the sphere feels alive without being distracting.
            `${fabIdleDance} 14s ease-in-out infinite`,
      willChange: generating || !open ? 'transform' : undefined,
      transition: theme.transitions.create(
        ['transform', 'box-shadow', 'filter'],
        { duration: theme.transitions.duration.shorter }
      ),
      ...(generating && {
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: -6,
          borderRadius: '50%',
          border: `2px solid ${alpha('#fff', 0.6)}`,
          animation: `${fabGeneratingRipple} 1.35s ease-out infinite`,
          pointerEvents: 'none',
        },
      }),
      '@media (prefers-reduced-motion: reduce)': {
        animation: 'none',
        willChange: undefined,
        '&::after': {
          display: 'none',
        },
      },
      '&:hover': {
            animation: 'none',
            willChange: 'transform',
            transform: 'translateY(-3px) scale(1.08)',
            background: 'transparent',
            boxShadow: 'none',
          },
      '&:active': {
            cursor: 'grabbing',
            transform: 'scale(0.95)',
          },
    };
  };
}

export const fabGenieWrapperSx: SxProps<Theme> = {
  position: 'relative',
  // Matches the new FAB_SIZE (70). Must stay in sync with the constant in
  // FloatingAiChat.tsx — the wrapper needs the same footprint so the sphere
  // fills the FAB without cropping.
  width: 70,
  height: 70,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  borderRadius: '50%',
};

export const fabGenieImgSx: SxProps<Theme> = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  pointerEvents: 'none',
  display: 'block',
  userSelect: 'none',
  borderRadius: '50%',
};

export const fabSessionDotSx: SxProps<Theme> = {
  position: 'absolute',
  top: 0,
  right: 0,
  // Scaled proportionally with the +25% FAB size (11 → 14).
  width: 14,
  height: 14,
  borderRadius: '50%',
  bgcolor: 'success.light',
  border: '2px solid',
  borderColor: 'primary.dark',
  boxShadow: 1,
};

export function floatingChatPaperSx(opts: {
  paperHorizontal: Record<string, unknown>;
  paperVertical: Record<string, unknown>;
  effPanelWidth: number;
  panelMaxHeight: number;
  edgePad: number;
  layerZ: number;
}): SxProps<Theme> {
  const {
    paperHorizontal,
    paperVertical,
    effPanelWidth,
    panelMaxHeight,
    edgePad,
    layerZ,
  } = opts;
  return {
    position: 'fixed',
    ...paperHorizontal,
    ...paperVertical,
    m: 0,
    width: effPanelWidth,
    maxWidth: `calc(100vw - ${edgePad * 2}px)`,
    maxHeight: panelMaxHeight,
    borderRadius: 2,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: layerZ,
    bgcolor: 'background.paper',
    outline: 0,
  };
}

export const panelDialogTitleSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'stretch',
  gap: 0,
  py: 0,
  px: 0,
  pr: 0.5,
};

export const panelHeaderDragSx: SxProps<Theme> = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  py: 1.5,
  pl: 2,
  minWidth: 0,
  cursor: 'grab',
  touchAction: 'none',
  userSelect: 'none',
  '&:active': { cursor: 'grabbing' },
};

export const panelHeaderActionsSx: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.25,
  flexShrink: 0,
  alignSelf: 'center',
};

export const panelDialogContentSx: SxProps<Theme> = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  pb: 0,
};

export const panelGeneratingOverlaySx: SxProps<Theme> = {
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: 1,
  bgcolor: (theme) =>
    theme.palette.mode === 'dark'
      ? 'rgba(0,0,0,0.55)'
      : 'rgba(255,255,255,0.72)',
  borderRadius: 1,
  pointerEvents: 'none',
};
