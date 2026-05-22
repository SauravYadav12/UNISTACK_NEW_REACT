import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { searchJobs } from '../services/jobBoardApi';
import {
  JobSearchRequest,
  JobSearchResponse,
} from '../Interfaces/jobBoard';

/**
 * Single source of truth for the Job Boards search.
 *
 * Everything the page renders (search bar inputs, result cards, the
 * per-board drawer, the job detail dialog) reads from this context. As
 * long as the page sits beneath the provider, navigating between drawer
 * and dialog never causes a refetch — we just toggle local UI state.
 *
 * Persistence
 * ───────────
 * On mount we hydrate from `sessionStorage` so a tab refresh restores
 * the last search; every successful write mirrors back to storage. The
 * scope is intentionally per-tab — opening Job Boards in a second tab
 * gives the user a fresh canvas (and the shared server cache means a
 * repeat search there is still free).
 *
 * Reset
 * ─────
 * `reset()` wipes the in-memory state AND `sessionStorage`. It does NOT
 * trigger an automatic refetch — the page goes back to the empty state
 * until the user submits a new search. That's the contract recruiters
 * asked for.
 */

const STORAGE_KEY = 'jobBoardSearch.v1';

interface PersistedState {
  lastRequest: JobSearchRequest | null;
  response: JobSearchResponse | null;
}

interface JobBoardSearchValue {
  lastRequest: JobSearchRequest | null;
  response: JobSearchResponse | null;
  isLoading: boolean;
  error: string;
  search: (req: JobSearchRequest) => Promise<void>;
  reset: () => void;
}

const JobBoardSearchContext = createContext<JobBoardSearchValue | null>(null);

function readStorage(): PersistedState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { lastRequest: null, response: null };
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      lastRequest: parsed.lastRequest ?? null,
      response: parsed.response ?? null,
    };
  } catch {
    return { lastRequest: null, response: null };
  }
}

function writeStorage(state: PersistedState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota/serialization failures — the cache is a nicety, not
    // a hard requirement.
  }
}

function clearStorage(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // No-op — see writeStorage().
  }
}

interface JobBoardSearchProviderProps {
  children: ReactNode;
}

export function JobBoardSearchProvider({
  children,
}: JobBoardSearchProviderProps) {
  const initial = useMemo(readStorage, []);
  const [lastRequest, setLastRequest] = useState<JobSearchRequest | null>(
    initial.lastRequest,
  );
  const [response, setResponse] = useState<JobSearchResponse | null>(
    initial.response,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Track the currently-in-flight request so a fast second submit cancels
  // the first — prevents a stale response overwriting a newer one.
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    writeStorage({ lastRequest, response });
  }, [lastRequest, response]);

  const search = useCallback(async (req: JobSearchRequest) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError('');
    try {
      const { data } = await searchJobs(req, controller.signal);
      setLastRequest(req);
      setResponse(data);
    } catch (err) {
      if (controller.signal.aborted) return;
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (err as Error)?.message ||
        'Search failed';
      setError(message);
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = null;
    setLastRequest(null);
    setResponse(null);
    setError('');
    setIsLoading(false);
    clearStorage();
  }, []);

  const value = useMemo<JobBoardSearchValue>(
    () => ({ lastRequest, response, isLoading, error, search, reset }),
    [lastRequest, response, isLoading, error, search, reset],
  );

  return (
    <JobBoardSearchContext.Provider value={value}>
      {children}
    </JobBoardSearchContext.Provider>
  );
}

export function useJobBoardSearch(): JobBoardSearchValue {
  const ctx = useContext(JobBoardSearchContext);
  if (!ctx) {
    throw new Error(
      'useJobBoardSearch must be used inside <JobBoardSearchProvider>.',
    );
  }
  return ctx;
}
