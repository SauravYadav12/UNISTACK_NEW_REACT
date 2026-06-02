import { useEffect, useRef, useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { IconEraser } from '@tabler/icons-react';
import { tokens } from '../../theme';

/**
 * Lightweight HTML5 signature canvas. No external dependency.
 *
 * - Tracks mouse + touch input via pointer events (works on mobile).
 * - Exposes `getDataUrl()` and `clear()` via the `onChange` callback,
 *   which fires with the latest PNG data URL whenever the signature
 *   changes (debounced via requestAnimationFrame).
 * - Renders a guide line + light placeholder text so the signing
 *   surface feels intentional rather than a blank box.
 *
 * Used by both the onboarding form (candidate signs at the bottom of
 * the long form) and the offer-letter page (candidate signs the
 * accepted offer). Both flows accept a PNG data URL and ship it to
 * the server.
 */

interface Props {
  /** Fires with the latest PNG data URL whenever the signature
   *  changes. Empty string when the canvas has been cleared. */
  onChange: (dataUrl: string) => void;
  /** Optional preset (e.g. when re-rendering an already-signed offer
   *  for download). Drawing on top resets to the new strokes. */
  initial?: string;
  width?: number;
  height?: number;
  disabled?: boolean;
}

export default function SignatureCanvas({
  onChange,
  initial,
  width = 460,
  height = 140,
  disabled = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Initial paint: clear + render placeholder + the initial PNG if
  // provided. Re-runs only when the canvas size changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Respect device pixel ratio for crisp strokes on retina.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Guide line — light dashed line near the bottom so the signer
    // knows where to draw.
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(16, height - 28);
    ctx.lineTo(width - 16, height - 28);
    ctx.stroke();
    ctx.setLineDash([]);

    if (initial) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        setIsEmpty(false);
      };
      img.src = initial;
    }

    ctx.strokeStyle = tokens.colors.lightText;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function emit() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL('image/png'));
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    lastPos.current = point(e);
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const p = point(e);
    const last = lastPos.current;
    if (last) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    lastPos.current = p;
    setIsEmpty(false);
  }

  function onUp() {
    drawing.current = false;
    lastPos.current = null;
    // Use rAF so consecutive strokes coalesce — toDataURL on every
    // pixel would tank the framerate.
    requestAnimationFrame(emit);
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Re-paint background + guide
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(16, height - 28);
    ctx.lineTo(width - 16, height - 28);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    setIsEmpty(true);
    onChange('');
  }

  return (
    <Stack spacing={1}>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          background: '#fff',
          width: 'fit-content',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          style={{
            display: 'block',
            cursor: disabled ? 'default' : 'crosshair',
            touchAction: 'none',
          }}
        />
        {isEmpty && (
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              left: 18,
              bottom: 8,
              color: 'text.disabled',
              pointerEvents: 'none',
              fontSize: 11,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            Sign above the dotted line
          </Typography>
        )}
      </Box>
      <Stack direction="row" justifyContent="flex-end">
        <Button
          size="small"
          startIcon={<IconEraser size={14} />}
          onClick={clear}
          disabled={isEmpty || disabled}
        >
          Clear
        </Button>
      </Stack>
    </Stack>
  );
}
