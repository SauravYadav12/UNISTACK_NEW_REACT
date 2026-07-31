import { useEffect, useRef, useState } from 'react';
import { listQuoActivity } from '../services/quoApi';
import { QuoActivityEvent } from '../Interfaces/quo';

/**
 * 30-second poll of `/quo/activity` scoped by phoneNumberId / range.
 *
 *  • Pauses when `document.visibilityState === 'hidden'`, resumes on
 *    return so a background tab never accrues load.
 *  • Reads only DELTAS (uses `since=<latestSeenAt>`) so payloads stay
 *    tiny — a quiet number returns an empty rows array.
 *  • Returns the id set of freshly-arrived events so the timeline can
 *    briefly outline new cards.
 */

const POLL_MS = 30_000;

function eventKey(e: QuoActivityEvent) {
  if (e.kind === 'call') return `call:${e.data._id}`;
  if (e.kind === 'voicemail') return `vm:${e.data._id}`;
  return `conv:${e.data._id}`;
}

interface Options {
  enabled: boolean;
  phoneNumberId?: string;
  from?: string;
  to?: string;
  onArrive: (events: QuoActivityEvent[]) => void;
}

export function useActivityPoll({ enabled, phoneNumberId, from, to, onArrive }: Options) {
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [live, setLive] = useState(false);
  const sinceRef = useRef<string | undefined>(undefined);
  const onArriveRef = useRef(onArrive);

  useEffect(() => {
    onArriveRef.current = onArrive;
  }, [onArrive]);

  // Reset watermark when filter set changes so we don't leak deltas
  // between different number selections.
  useEffect(() => {
    sinceRef.current = new Date().toISOString();
    setNewIds(new Set());
  }, [phoneNumberId, from, to]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        setLive(false);
        // Skip fetching but keep the loop alive so we resume on visibility change.
        timer = setTimeout(tick, POLL_MS);
        return;
      }
      setLive(true);
      try {
        const res = await listQuoActivity({
          phoneNumberId,
          since: sinceRef.current,
          from,
          to,
          limit: 50,
        });
        if (!cancelled && res.rows.length) {
          onArriveRef.current(res.rows);
          const ids = new Set(res.rows.map(eventKey));
          setNewIds(ids);
          // Bump watermark to the newest received.
          const newestAt = res.rows[0]?.at;
          if (newestAt) sinceRef.current = newestAt;
          // Clear highlight after 1.5s.
          setTimeout(() => {
            if (!cancelled) setNewIds(new Set());
          }, 1500);
        }
      } catch {
        // Ignore poll errors — the next tick will retry.
      } finally {
        if (!cancelled) timer = setTimeout(tick, POLL_MS);
      }
    };

    // First tick after 5s so we don't fight the initial page load.
    timer = setTimeout(tick, 5000);

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        if (timer) clearTimeout(timer);
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
      setLive(false);
    };
    // onArrive is stable via ref — do not include here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, phoneNumberId, from, to]);

  return { newIds, live };
}
