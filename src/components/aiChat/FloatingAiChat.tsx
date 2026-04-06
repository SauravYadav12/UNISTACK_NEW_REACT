import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Zoom from '@mui/material/Zoom';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import CloseRounded from '@mui/icons-material/CloseRounded';
import RemoveRounded from '@mui/icons-material/RemoveRounded';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import SmartToyOutlined from '@mui/icons-material/SmartToyOutlined';
import { useRequirementAiChat } from '../../context/RequirementAiChatContext';
import genni from '../../assets/genie-lamp.png';
import {
  fabGenieImgSx,
  fabGenieWrapperSx,
  fabSessionDotSx,
  floatingChatFabSx,
  floatingChatPaperSx,
  panelDialogContentSx,
  panelDialogTitleSx,
  panelGeneratingOverlaySx,
  panelHeaderActionsSx,
  panelHeaderDragSx,
} from './floatingAiChatStyles';

const STORAGE_KEY = 'unistack.floatingAiChat.pos';

const ENTER_MS = 400;
const EXIT_MS = 280;
/** MUI Fab size="large" is 56px; default medium is also 56 for padding calc */
const FAB_SIZE = 56;
const EDGE_PAD = 8;
const PANEL_GAP = 12;
const PANEL_WIDTH_SM = 520;
/** High enough to sit above MUI Drawer (`zIndex.drawer`); avoids Modal stacking issues (panel is not a Dialog). */
const FLOATING_CHAT_LAYER_Z = 14000;
const FLOATING_CHAT_FAB_WHEN_OPEN_Z = FLOATING_CHAT_LAYER_Z - 1;

function defaultFabPosition(vw: number, vh: number) {
  return {
    left: vw - EDGE_PAD * 3 - FAB_SIZE,
    top: vh - EDGE_PAD * 3 - FAB_SIZE,
  };
}

function clampFabPosition(
  left: number,
  top: number,
  vw: number,
  vh: number
): { left: number; top: number } {
  const maxLeft = Math.max(EDGE_PAD, vw - FAB_SIZE - EDGE_PAD);
  const maxTop = Math.max(EDGE_PAD, vh - FAB_SIZE - EDGE_PAD);
  return {
    left: Math.min(maxLeft, Math.max(EDGE_PAD, left)),
    top: Math.min(maxTop, Math.max(EDGE_PAD, top)),
  };
}

function loadSavedPosition(): { left: number; top: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { left?: unknown; top?: unknown };
    if (typeof p.left === 'number' && typeof p.top === 'number') {
      return { left: p.left, top: p.top };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function savePosition(left: number, top: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ left, top }));
  } catch {
    /* ignore */
  }
}

const FLOATING_AI_CHAT_FAB_ID = 'floating-ai-chat-fab';

/** Zoom origin at FAB center (viewport coords → paper-local px) so open/close grows/shrinks from the button */
function alignPanelTransformOriginToFab(panel: HTMLElement) {
  const fab = document.getElementById(FLOATING_AI_CHAT_FAB_ID);
  if (!fab) return;
  const fr = fab.getBoundingClientRect();
  const pr = panel.getBoundingClientRect();
  const ox = fr.left + fr.width / 2 - pr.left;
  const oy = fr.top + fr.height / 2 - pr.top;
  panel.style.transformOrigin = `${ox.toFixed(2)}px ${oy.toFixed(2)}px`;
}

function FloatingAiChat() {
  const {
    jobDescription,
    setJobDescription,
    instruction,
    setInstruction,
    generating,
    hasGenerated,
    pendingAiPrefill,
    generateRequirement,
    resetRequirementAiChatForm,
    clearPendingAiPrefill,
  } = useRequirementAiChat();

  const sessionAvailable =
    hasGenerated ||
    pendingAiPrefill != null ||
    jobDescription.trim().length > 0 ||
    instruction.trim().length > 0;
  const [open, setOpen] = useState(false);
  const [viewport, setViewport] = useState(() =>
    typeof window !== 'undefined'
      ? { w: window.innerWidth, h: window.innerHeight }
      : { w: 1200, h: 800 }
  );

  const [pos, setPos] = useState(() => {
    if (typeof window === 'undefined') {
      return { left: 24, top: 24 };
    }
    const { w, h } = {
      w: window.innerWidth,
      h: window.innerHeight,
    };
    const saved = loadSavedPosition();
    if (saved) return clampFabPosition(saved.left, saved.top, w, h);
    return defaultFabPosition(w, h);
  });

  const dragRef = useRef({
    active: false,
    pointerId: 0 as number | null,
    startClientX: 0,
    startClientY: 0,
    originLeft: 0,
    originTop: 0,
    dragged: false,
  });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({ w, h });
      setPos((p) => clampFabPosition(p.left, p.top, w, h));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleToggle = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  const handleMinimize = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleMinimize();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, handleMinimize]);

  const handleCloseAndClear = useCallback(() => {
    setOpen(false);
    resetRequirementAiChatForm();
    clearPendingAiPrefill();
  }, [resetRequirementAiChatForm, clearPendingAiPrefill]);

  const effPanelWidth = Math.min(PANEL_WIDTH_SM, viewport.w - EDGE_PAD * 2);
  const fabRight = pos.left + FAB_SIZE;
  const anchorPanelToFabRight = fabRight - effPanelWidth >= EDGE_PAD;
  const paperHorizontal = anchorPanelToFabRight
    ? { right: viewport.w - fabRight, left: 'auto' as const }
    : {
      left: Math.max(
        EDGE_PAD,
        Math.min(pos.left, viewport.w - effPanelWidth - EDGE_PAD)
      ),
      right: 'auto' as const,
    };

  const fabTop = pos.top;
  const fabBottom = pos.top + FAB_SIZE;
  const panelHeightCap = 680;
  const panelMaxH = Math.min(panelHeightCap, viewport.h - EDGE_PAD * 2);
  const roomAbove = Math.max(0, fabTop - EDGE_PAD - PANEL_GAP);
  const roomBelow = Math.max(0, viewport.h - fabBottom - EDGE_PAD - PANEL_GAP);
  let openPanelAboveFab = roomAbove >= roomBelow;
  let panelAvailable = openPanelAboveFab ? roomAbove : roomBelow;
  if (panelAvailable < 100) {
    const other = openPanelAboveFab ? roomBelow : roomAbove;
    if (other > panelAvailable) {
      openPanelAboveFab = !openPanelAboveFab;
      panelAvailable = other;
    }
  }
  const panelMaxHeight = Math.min(panelMaxH, Math.max(panelAvailable, 1));
  const paperVertical = openPanelAboveFab
    ? {
      bottom: viewport.h - fabTop + PANEL_GAP,
      top: 'auto' as const,
    }
    : {
      top: fabBottom + PANEL_GAP,
      bottom: 'auto' as const,
    };

  const onFabPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        active: true,
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originLeft: pos.left,
        originTop: pos.top,
        dragged: false,
      };
    },
    [pos.left, pos.top]
  );

  const onDragPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startClientX;
    const dy = e.clientY - d.startClientY;
    if (!d.dragged && Math.hypot(dx, dy) > 8) {
      d.dragged = true;
    }
    if (d.dragged) {
      setPos(
        clampFabPosition(d.originLeft + dx, d.originTop + dy, viewport.w, viewport.h)
      );
    }
  }, [viewport.h, viewport.w]);

  const endFabPointer = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d.active || d.pointerId !== e.pointerId) return;
      d.active = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      if (d.dragged) {
        setPos((p) => {
          const next = clampFabPosition(p.left, p.top, viewport.w, viewport.h);
          savePosition(next.left, next.top);
          return next;
        });
      }
      d.pointerId = null;
    },
    [viewport.h, viewport.w]
  );

  const onHeaderPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        active: true,
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originLeft: pos.left,
        originTop: pos.top,
        dragged: false,
      };
    },
    [pos.left, pos.top]
  );

  const onHeaderPointerUp = useCallback(
    (e: React.PointerEvent) => {
      endFabPointer(e);
      dragRef.current.dragged = false;
    },
    [endFabPointer]
  );

  const onHeaderPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      endFabPointer(e);
      dragRef.current.dragged = false;
    },
    [endFabPointer]
  );

  const onFabPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      const wasDrag = d.dragged;
      endFabPointer(e);
      if (!wasDrag) {
        handleToggle();
      }
      dragRef.current.dragged = false;
    },
    [endFabPointer, handleToggle]
  );

  const onFabPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      endFabPointer(e);
      dragRef.current.dragged = false;
    },
    [endFabPointer]
  );

  const onFabClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const fabAriaLabel = open
    ? 'Close AI assistant panel'
    : generating
      ? 'AI assistant — generating requirement'
      : sessionAvailable
        ? 'Open AI assistant — session in progress'
        : 'Open AI assistant';

  const fabTitle = open
    ? 'Click to close the panel. Drag to move the button.'
    : generating
      ? 'Generating requirement… Drag to move.'
      : sessionAvailable
        ? 'Session has draft or generated data. Click to open. Drag to move.'
        : 'Drag to move on screen. Click to open the assistant.';

  const floatingUi = (
    <>
      <Fab
        id={FLOATING_AI_CHAT_FAB_ID}
        color="primary"
        aria-label={fabAriaLabel}
        title={fabTitle}
        onPointerDown={onFabPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onFabPointerUp}
        onPointerCancel={onFabPointerCancel}
        onClick={onFabClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        sx={floatingChatFabSx({
          pos,
          open,
          generating,
          fabWhenOpenZ: FLOATING_CHAT_FAB_WHEN_OPEN_Z,
        })}
      >
        <Box sx={fabGenieWrapperSx}>
          <Box
            component="img"
            src={genni}
            alt=""
            aria-hidden
            sx={fabGenieImgSx}
          />
          {!generating && sessionAvailable && (
            <Box sx={fabSessionDotSx} aria-hidden />
          )}
        </Box>
      </Fab>

      <Zoom
        in={open}
        appear
        unmountOnExit
        timeout={{ enter: ENTER_MS, exit: EXIT_MS }}
        easing={{
          enter: 'cubic-bezier(0.22, 1, 0.36, 1)',
          exit: 'cubic-bezier(0.4, 0, 1, 1)',
        }}
        onEnter={(node) => {
          alignPanelTransformOriginToFab(node as HTMLElement);
        }}
        onExit={(node) => {
          alignPanelTransformOriginToFab(node as HTMLElement);
        }}
      >
        <Paper
          elevation={12}
          role="dialog"
          aria-modal={false}
          aria-labelledby="floating-ai-chat-title"
          sx={floatingChatPaperSx({
            paperHorizontal,
            paperVertical,
            effPanelWidth,
            panelMaxHeight,
            edgePad: EDGE_PAD,
            layerZ: FLOATING_CHAT_LAYER_Z,
          })}
        >
        <DialogTitle id="floating-ai-chat-title" sx={panelDialogTitleSx}>
          <Box
            sx={panelHeaderDragSx}
            onPointerDown={onHeaderPointerDown}
            onPointerMove={onDragPointerMove}
            onPointerUp={onHeaderPointerUp}
            onPointerCancel={onHeaderPointerCancel}
          >
            <SmartToyOutlined
              color="primary"
              fontSize="small"
              sx={{ flexShrink: 0 }}
            />
            <Typography component="span" variant="subtitle1" fontWeight={600} noWrap>
              AI assistant
            </Typography>
          </Box>
          <Box sx={panelHeaderActionsSx}>
            <IconButton
              aria-label="Minimize — close panel but keep your draft"
              title="Minimize — close panel but keep your draft"
              onClick={handleMinimize}
              size="small"
              edge="end"
              sx={{ cursor: 'pointer' }}
            >
              <RemoveRounded fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="Close and clear — reset assistant and discard draft"
              title="Close and clear"
              onClick={handleCloseAndClear}
              size="small"
              edge="end"
              sx={{ cursor: 'pointer' }}
            >
              <CloseRounded fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={panelDialogContentSx}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Paste the job description and add any extra instructions (tone,
            fields to emphasize, client naming, etc.). We will extract fields and
            open the add-requirement form with those values.
          </Typography>
          <Stack spacing={1.5} sx={{ position: 'relative', flex: 1 }}>
            {generating && (
              <Box sx={panelGeneratingOverlaySx}>
                <CircularProgress size={36} />
                <Typography variant="caption" color="text.secondary">
                  Generating requirement fields…
                </Typography>
              </Box>
            )}
            <TextField
              label="Job description (JD)"
              placeholder="Paste the full JD here…"
              multiline
              minRows={5}
              fullWidth
              size="small"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={generating}
            />
            <TextField
              label="Instructions (optional)"
              placeholder="e.g. Map Acme Corp as client, default status New Working…"
              multiline
              minRows={2}
              fullWidth
              size="small"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={generating}
            />

          </Stack>
        </DialogContent>
        <DialogActions sx={{ pr: '36px', py: '12px' }}>
          {!hasGenerated ? (
            <Button
              variant="contained"
              size="small"
              startIcon={
                generating ? (
                  <CircularProgress color="inherit" size={16} />
                ) : (
                  <AutoAwesome />
                )
              }
              onClick={() => void generateRequirement()}
              disabled={generating || !jobDescription.trim()}
              sx={{ borderRadius: '10px' }}
            >
              Generate
            </Button>
          ) : (
            <Button
              variant="contained"
              size="small"
              startIcon={
                generating ? (
                  <CircularProgress color="inherit" size={16} />
                ) : (
                  <RefreshRounded />
                )
              }
              onClick={() => void generateRequirement()}
              disabled={generating || !jobDescription.trim()}
              sx={{ borderRadius: '10px' }}
            >
              Regenerate
            </Button>
          )}
        </DialogActions>
        </Paper>
      </Zoom>
    </>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(floatingUi, document.body);
}

export default FloatingAiChat;
