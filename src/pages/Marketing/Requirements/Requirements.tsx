import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import moment from 'moment';
import { toast } from 'react-toastify';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  GridCallbackDetails,
  GridColDef,
  GridFilterModel,
} from '@mui/x-data-grid';
import { Sync } from '@mui/icons-material';
import SyncIcon from '@mui/icons-material/Sync';
import {
  IconBriefcase,
  IconBuilding,
  IconChevronDown,
  IconChevronRight,
  IconClipboardCheck,
  IconCopy,
  IconEye,
  IconRefresh,
  IconStar,
  IconStarFilled,
  IconTrash,
  IconUsersPlus,
} from '@tabler/icons-react';

import CustomDataGrid from '../../../components/datagrid/DataGrid';
import CustomDrawer from '../../../components/drawer/CustomDrawer';
import { filterOperatorsForDateField } from '../../../components/datagrid/CustomToolbar';
import RequirementDrawer from '../../../components/requirement/RequirementDrawer';
import RequirementMeta from '../../../components/requirement/RequirementMeta';
import AssignRequirementDrawer, {
  MutateInfo as AssignMutateInfo,
} from '../../../components/requirement/AssignRequirementDrawer';
import PipelineSnapshot, { ASSIGNED_VIEW_KEY } from '../../../components/requirement/PipelineSnapshot';
import PersonPill from '../../../components/ui/PersonPill';
import { dateFormate2 } from '../../../components/constants';

import RequirementsForm from './RequirementsForm';
import {
  reqirementStatusColors,
  requirementFormInitialValues,
} from './requirementsValues';

import {
  listChildAssignments,
  requirementCounts,
  requirementsList,
  updateRequirementStar,
  createRequirementLog,
  RequirementStarColor,
} from '../../../services/requirementApi';
import { archiveRequirementsList } from '../../../services/archivesApi';
import { usersList } from '../../../services/authApi';
import { consultantsList } from '../../../services/consultantApi';

import {
  initialPaginationModel,
  initialSearchModel,
  usePagination,
} from '../../../hooks/paginationHook';
import { useFetchData } from '../../../hooks/fetchDataHook';

import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import {
  ArchiveModule,
  ModuleGroup,
  moduleKey,
} from '../../../utils/accessControlUtil';
import { syncDataById } from '../../../utils/syncDataById';
import { separateByDates } from '../../../utils/dataGrid.util';
import { useRequirementAiChat } from '../../../context/RequirementAiChatContext';

import { iUser, UserRole } from '../../../Interfaces/iUser';
import { IRequirement, RequirementStatus } from '../../../Interfaces/types';
import type { CreateRequirementLogPayload } from '../../../Interfaces/requirement';

const MotionBox = motion.create(Box);

// ── Shape used for grid rows (mirrors IRequirement, plus display flags) ──
type Row = IRequirement & {
  dateSeparator?: boolean;
  count?: number;
  fromDate?: string;
  isChildRow?: boolean;
};

export default function Requirements() {
  const { isModuleAllowed, iUser } = useAuth();
  const { pendingAiPrefill, clearPendingAiPrefill } = useRequirementAiChat();
  const [searchParams, setSearchParams] = useSearchParams();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [viewData, setViewData] = useState<IRequirement>();
  const [reqToCopy, setReqToCopy] = useState<Partial<IRequirement>>();
  const [mode, setMode] = useState<FormMode>('view');
  const [duplicateReqDrawer, setDuplicateReqDrawer] = useState<string>();
  const [archive, setArchive] = useState(false);
  const [snapshotRefreshKey, setSnapshotRefreshKey] = useState(0);
  // Tracks whether the currently-open drawer triggered a real mutation
  // (create or edit save). On drawer close we only bump the pipeline
  // snapshot when this is true — view-only opens no longer fire the 1
  // aggregated `pipeline-counts` call (and previously, 10 separate calls).
  // Reset to false every time a drawer opens (see handleViewDetails /
  // handleCopy / add-mode handlers below) and on close.
  const mutatedDuringDrawerRef = useRef(false);
  const [childReqDrawer, setChildReqDrawer] = useState<string>();
  // Deep-link drawer driven by `?openReqID=...` — used by notification
  // clicks so the bell can route a marketer straight into a requirement.
  const [deepLinkReqID, setDeepLinkReqID] = useState<string | undefined>(
    searchParams.get('openReqID') || undefined,
  );
  useEffect(() => {
    const fromUrl = searchParams.get('openReqID') || undefined;
    setDeepLinkReqID(fromUrl);
  }, [searchParams]);

  // ── Parent/child expansion state ──
  // Persisted in sessionStorage so a refresh, a route bounce, or the deep
  // -link flow from a notification doesn't collapse every parent the user
  // had open. Scoped to the current tab so concurrent sessions stay
  // independent. Cleared when the user toggles between Live ↔ Archive
  // (the two have disjoint requirement universes — see onChangeArchiveButton).
  const EXPANDED_PARENTS_KEY = 'requirements:expandedParents';
  const [expandedParents, setExpandedParents] = useState<Set<string>>(() => {
    try {
      const raw = sessionStorage.getItem(EXPANDED_PARENTS_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  });
  // Mirror to sessionStorage whenever the set changes — small payload, the
  // page only re-hydrates when the user re-enters this route. Deferred via
  // `requestIdleCallback` when available (with a `setTimeout(_, 0)` fallback
  // for Safari) so the storage write doesn't share a frame with the toggle's
  // React render. Without this, JSON.stringify on each expand/collapse
  // sat on the critical path; perceived expand/collapse latency drops
  // measurably with the deferral.
  useEffect(() => {
    const persist = () => {
      try {
        sessionStorage.setItem(
          EXPANDED_PARENTS_KEY,
          JSON.stringify([...expandedParents]),
        );
      } catch {
        // Quota / private-mode fall-through — non-fatal.
      }
    };
    const ric = (
      window as unknown as {
        requestIdleCallback?: (cb: () => void) => number;
      }
    ).requestIdleCallback;
    if (typeof ric === 'function') {
      const id = ric(persist);
      return () => {
        const cic = (
          window as unknown as {
            cancelIdleCallback?: (h: number) => void;
          }
        ).cancelIdleCallback;
        if (typeof cic === 'function') cic(id);
      };
    }
    const id = window.setTimeout(persist, 0);
    return () => clearTimeout(id);
  }, [expandedParents]);
  /**
   * Children are stored as `Row[]` — pre-sorted by `childSuffix` and pre-
   * stamped with `isChildRow: true` at insertion time. Why: `displayRows`
   * used to spread each child (`{ ...kid, isChildRow: true }`) on every
   * recompute, which created brand-new object identities for every child
   * on every toggle. MUI X DataGrid then re-ran every cell's `renderCell`
   * for every visible row, causing the ~1s hitch you'd see when expanding
   * or collapsing. With pre-stamped storage, displayRows just pushes the
   * same references back into the row array on every toggle → DataGrid
   * diff is now "these N rows appeared / disappeared" instead of "all rows
   * changed".
   */
  const [childrenMap, setChildrenMap] = useState<Map<string, Row[]>>(
    new Map(),
  );

  // Sort + stamp once at insertion so render-path code can rely on stable
  // child references. The `_source` tag preserves the original array
  // reference for callers (e.g. the assign drawer) that may still want
  // the raw IRequirement[] view.
  const stampChildren = (kids: IRequirement[]): Row[] =>
    [...kids]
      .sort((a, b) =>
        (a.childSuffix || '').localeCompare(b.childSuffix || ''),
      )
      .map((k) => ({ ...k, isChildRow: true as const }));
  const [loadingChildrenFor, setLoadingChildrenFor] = useState<Set<string>>(
    new Set()
  );

  // ── Assign drawer state ──
  const [assignFor, setAssignFor] = useState<IRequirement | null>(null);

  const accountsState = useFetchData<iUser[]>(getAccountList, []);
  const { data: accounts } = accountsState;
  const consultantsState = useFetchData(getConsultantsList, []);
  const { data: consultants } = consultantsState;
  const formStateLoading = accountsState.loading || consultantsState.loading;
  const formStateError = accountsState.error || consultantsState.error;

  const isArchiveRequirementModuleAllowed = isModuleAllowed(
    moduleKey(ModuleGroup.Archive, ArchiveModule.Requirements)
  );

  const userRoles = iUser?.role || [];
  const isParentEditor =
    userRoles.includes(UserRole['super-admin']) ||
    userRoles.includes(UserRole.admin) ||
    userRoles.includes(UserRole.support);

  // ── Pipeline snapshot active status from URL search params ──
  // Two views can be "active": a status filter (`reqStatus=…`) or the
  // children-only view (`onlyChildren=true`). They're mutually exclusive
  // — clicking a real status clears `onlyChildren` and vice versa.
  const onlyChildrenActive = searchParams.get('onlyChildren') === 'true';
  const activeReqStatus = onlyChildrenActive
    ? ASSIGNED_VIEW_KEY
    : searchParams.get('reqStatus') || '';

  const handlePipelineStatusChange = (status: string) => {
    setSearchParams(
      (prev) => {
        if (status === ASSIGNED_VIEW_KEY) {
          // All Assigned → server filter for child rows only.
          prev.delete('reqStatus');
          prev.set('onlyChildren', 'true');
        } else if (!status) {
          // All → clear both filters.
          prev.delete('reqStatus');
          prev.delete('onlyChildren');
        } else {
          // Real status filter — drop the children-only override.
          prev.set('reqStatus', status);
          prev.delete('onlyChildren');
        }
        return prev;
      },
      { replace: true }
    );
  };

  // Fetch children for one parent and stash into the map. Extracted so both
  // the toggle handler AND the rehydration effect below share the logic.
  const fetchChildrenFor = async (reqID: string) => {
    setLoadingChildrenFor((prev) => new Set(prev).add(reqID));
    try {
      const res = await listChildAssignments(reqID);
      const results =
        (res.data.data?.results as IRequirement[] | undefined) || [];
      setChildrenMap((prev) => {
        const next = new Map(prev);
        next.set(reqID, stampChildren(results));
        return next;
      });
    } catch (e) {
      console.error('Failed to load child assignments for', reqID, e);
      setChildrenMap((prev) => {
        const next = new Map(prev);
        next.set(reqID, []);
        return next;
      });
    } finally {
      setLoadingChildrenFor((prev) => {
        const next = new Set(prev);
        next.delete(reqID);
        return next;
      });
    }
  };

  // ── Child expand helpers ──
  const toggleExpandParent = async (row: IRequirement) => {
    const reqID = row.reqID;
    if (!reqID) return;

    const isExpanded = expandedParents.has(reqID);
    // Collapse — just drop from the set.
    if (isExpanded) {
      setExpandedParents((prev) => {
        const next = new Set(prev);
        next.delete(reqID);
        return next;
      });
      return;
    }

    // Expand — fetch if we haven't loaded before.
    if (!childrenMap.has(reqID)) {
      await fetchChildrenFor(reqID);
    }
    setExpandedParents((prev) => new Set(prev).add(reqID));
  };

  // ── Grid pagination ──
  const {
    gridData,
    paginationModel,
    error,
    loading,
    setSearchModel,
    setPaginationModel,
    setGridData,
    reload,
    setResults,
  } = usePagination(
    {
      queryFunction: archive ? getArchiveRequirements : getRequirements,
      queryParams: searchParams.toString(),
    },
    [archive]
  );

  // `usePagination` now watches `queryParams` (== searchParams.toString())
  // internally, so we no longer need a manual `reload()` on URL change.
  // Removing this effect saves one redundant `get-requirements` per
  // filter / status change.

  // Rehydrate children for any parent whose expansion state was restored
  // from sessionStorage. Without this, restoring "expanded" looks broken
  // because childrenMap is fresh on mount. We only fetch for parents that
  // are actually visible in the current grid so we don't burn requests
  // on rows that aren't on this page.
  useEffect(() => {
    const visibleParents = new Set(
      (gridData?.results as IRequirement[] | undefined)
        ?.filter((r) => r.reqID && !r.parentReqID)
        .map((r) => r.reqID as string) || [],
    );
    for (const reqID of expandedParents) {
      if (!visibleParents.has(reqID)) continue;
      if (childrenMap.has(reqID)) continue;
      if (loadingChildrenFor.has(reqID)) continue;
      void fetchChildrenFor(reqID);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridData?.results]);

  /**
   * Unified row-patch for the page's grid AND its expanded children. The
   * RequirementsForm submits create / edit through `setResults(callback)`.
   * Without this wrapper:
   *   - Edits to a child requirement (status change, status text, etc.)
   *     update the top-level grid only — child rows under an expanded
   *     parent stay stale until the user re-expands.
   *   - Creating a parent already inserts at the top via the form's own
   *     callback; we additionally queue a silent reload so date separators
   *     / sort buckets settle correctly.
   *
   * Strategy: run the form's callback against every cached source. If the
   * resulting array has the same length AND at least one item swapped
   * (heuristic for an in-place edit, e.g. `pre.map(d => d._id === id ? upd : d)`),
   * commit it back. Length change means "create" or "delete" — we don't
   * propagate that across children buckets (would erroneously add a parent
   * row to every child list).
   */
  const patchRowEverywhere: typeof setResults = (action) => {
    // The form only calls setResults on successful save (create or edit).
    // Flip the mutated flag so handleDrawerClose knows to bump the
    // pipeline snapshot — view-only opens won't reach this code path.
    mutatedDuringDrawerRef.current = true;

    let observedNewLength = -1;
    let observedOldLength = -1;
    setResults((prev) => {
      const arr = prev || [];
      const nextArr =
        typeof action === 'function'
          ? (action as (p: IRequirement[]) => IRequirement[])(arr)
          : action;
      observedOldLength = arr.length;
      observedNewLength = nextArr.length;
      return nextArr;
    });

    // Patch the cached children for any expanded parent whose array also
    // contains an entry the callback touched. Only run for in-place edits.
    setChildrenMap((prev) => {
      const next = new Map(prev);
      let changed = false;
      for (const [parentReqID, kids] of prev.entries()) {
        const patched =
          typeof action === 'function'
            ? (action as (p: IRequirement[]) => IRequirement[])(kids)
            : action;
        // Skip if the form's callback changed the length on this array (a
        // create-flow path leaking into the children bucket).
        if (patched.length !== kids.length) continue;
        // Walk parallel and rebuild: unchanged entries retain their pre-
        // stamped `Row` (preserving identity so DataGrid's diff sees no
        // change), and changed entries get re-stamped with `isChildRow`.
        // Without this re-stamp, the form's `.map(d => d._id === id ? upd : d)`
        // path would drop the stamp for the edited entry and downstream
        // renderCells that branch on `row.isChildRow` would mis-render.
        let any = false;
        const finalRows: Row[] = new Array(kids.length);
        for (let i = 0; i < kids.length; i++) {
          if ((patched[i] as IRequirement) !== (kids[i] as IRequirement)) {
            any = true;
            finalRows[i] = {
              ...(patched[i] as IRequirement),
              isChildRow: true as const,
            } as Row;
          } else {
            finalRows[i] = kids[i];
          }
        }
        if (!any) continue;
        next.set(parentReqID, finalRows);
        changed = true;
      }
      return changed ? next : prev;
    });

    // Create case (output is longer than input by 1): the optimistic insert
    // is already done. Trigger a silent reload so the new row settles into
    // the correct date-separator / sort bucket without the user having to
    // hit refresh. The optimistic row stays visible during the round-trip.
    if (
      observedOldLength !== -1 &&
      observedNewLength === observedOldLength + 1
    ) {
      // Defer to next tick so reload() doesn't race the setResults flush.
      Promise.resolve().then(() => reload());
    }
  };

  // ── pendingAiPrefill: open drawer in Add mode with merged values ──
  useEffect(() => {
    if (!pendingAiPrefill) return;

    const merged: Partial<IRequirement> = {
      ...requirementFormInitialValues,
      ...pendingAiPrefill,
      reqEnteredBy: `${iUser?.firstName ?? ''} ${iUser?.lastName ?? ''}`.trim(),
      reqEnteredByRef: `${iUser?.id ?? ''}`,
    };

    delete (merged as Partial<IRequirement & { _id?: string }>)._id;
    delete merged.reqID;
    delete merged.createdAt;
    delete merged.updatedAt;

    setViewData(undefined);
    setFormTitle('Add New Requirement');
    setMode('add');
    setReqToCopy(merged);
    setDrawerOpen(true);
    clearPendingAiPrefill();
  }, [pendingAiPrefill, iUser, clearPendingAiPrefill]);

  /**
   * Shared handler for the two `AssignRequirementDrawer` mount points: the
   * page-level one (admin / parent-editor path, opened via the grid's
   * Assign button) AND the one mounted inside `RequirementsForm` (the path
   * marketers use when they self-assign from the parent's view drawer).
   *
   * Both need to:
   *   1. Splice the freshly-refetched children into the page-level
   *      `childrenMap` so the grid renders the new child without a refresh.
   *   2. Auto-expand the parent so the new child is visible inline.
   *   3. Bump the pipeline-snapshot refresh key.
   *   4. On `kind === 'add'`, close any open assign drawer (page-level
   *      `setAssignFor(null)` — the form-level one is closed inside
   *      `RequirementsForm` since the page can't reach its state).
   *   5. On self-assign, open the new child's `RequirementDrawer` so the
   *      marketer lands directly on their working record.
   */
  const handleAssignMutated = (info: AssignMutateInfo) => {
    const { parentReqID, children: fresh, created, isSelfAssign, kind } = info;

    setChildrenMap((prev) => {
      const next = new Map(prev);
      next.set(parentReqID, stampChildren(fresh));
      return next;
    });
    setExpandedParents((prev) =>
      prev.has(parentReqID) ? prev : new Set(prev).add(parentReqID),
    );
    setSnapshotRefreshKey((k) => k + 1);

    if (kind === 'add') setAssignFor(null);

    if (isSelfAssign && created.length > 0 && created[0]?.reqID) {
      setChildReqDrawer(created[0].reqID);
    }
  };

  // ── Data fetching (same as legacy, with counts for date separators) ──
  async function fetchRequirementsData(
    isArchive: boolean,
    query?: string,
    signal?: AbortSignal
  ) {
    const apiFunction = isArchive ? archiveRequirementsList : requirementsList;
    const res = await apiFunction(query, signal);

    let result = separateByDates(res.data.data?.results || []);
    const formate = (d: string) => moment(d).format('YYYY-MM-DD');
    const dates = result
      .filter((r) => !!r.dateSeparator)
      .map((d) => d.fromDate)
      .map((d) => formate(d));

    const counts = await requirementCounts(dates, query, isArchive, signal);

    result = result.map((r) => {
      if (r.dateSeparator) {
        const countObj = counts.data?.find(
          (c) => c.date === formate(r.fromDate)
        );
        return { ...r, count: countObj ? countObj.count : 0 };
      }
      return r;
    });

    if (res.data.data) {
      res.data.data.results = result;
    }

    setArchive(isArchive);
    return res;
  }

  async function getRequirements(query?: string, signal?: AbortSignal) {
    return fetchRequirementsData(false, query, signal);
  }

  async function getArchiveRequirements(query?: string, signal?: AbortSignal) {
    return fetchRequirementsData(true, query, signal);
  }

  async function getAccountList() {
    const { data } = await usersList('active=true');
    const { users } = data;
    return users;
  }

  async function getConsultantsList() {
    const { data } = await consultantsList(
      `consultantStatus=Active&limit=5000`
    );
    return data.data?.results || [];
  }

  const onChangeArchiveButton = (status: boolean) => {
    setArchive(status);
    setGridData(undefined);
    // Reset expansion state — the children under archive vs live are disjoint.
    setExpandedParents(new Set());
    setChildrenMap(new Map());
  };

  const handleViewDetails = (row: IRequirement) => {
    // Use the row passed in by DataGrid directly — `displayRows` only ever
    // contains full server-fetched documents (from `gridData.results` or
    // the stamped children in `childrenMap`), so there's no need to look
    // it up by `reqID` against cached state.
    //
    // The previous lookup pattern silently failed in three real-world
    // scenarios:
    //   1. Stale closure on column-memo dep mismatch — `gridData?.results`
    //      was undefined at memo capture time, the find returned undefined
    //      for parents, and the drawer never opened.
    //   2. Role-scoped server fetches — when a role sees a different set
    //      of rows than another, the lookup against `gridData.results`
    //      could miss rows that came from a different page or filter run.
    //   3. Grid filters changing `gridData` between render and click —
    //      the captured handler's `gridData` was a different page's data
    //      than what the user was looking at.
    //
    // Passing the click's `row` straight through removes the closure
    // dependency entirely. `syncDataById` still refreshes from the
    // server so any field that drifted since the last fetch is updated.
    if (!row) return;
    setViewData(row);
    setFormTitle(`Requirement ID: ${row.reqID}`);
    setMode('view');
    setDrawerOpen(true);
    if (!archive) {
      syncDataById(row, {
        queryFunction: requirementsList,
        setViewData,
        setResults,
      });
    }
  };

  const handleEdit = (editMode: boolean) => {
    setMode(editMode ? 'edit' : 'view');
  };

  const handleAddNew = () => {
    setFormTitle('Add New Requirement');
    setViewData(undefined);
    setMode('add');
    setDrawerOpen(true);
  };

  const handleCopy = () => {
    if (!viewData) return;
    setMode('add');
    setFormTitle('Add New Requirement');

    const copy: Partial<IRequirement & { __v?: string }> = {
      ...viewData,
      reqEnteredBy: `${iUser?.firstName} ${iUser?.lastName}`,
      reqEnteredByRef: `${iUser?.id}`,
      isDuplicate: 'true',
      duplicateWith: viewData.reqID,
      rate: [],
      taxType: [],
      remote: [],
      duration: [],
      mComment: [],
      resumeUpload: '',
    };
    delete copy.createdAt;
    delete copy.reqID;
    delete copy._id;
    delete copy.__v;
    delete copy.parentReqID;
    delete copy.childSuffix;
    setReqToCopy({ ...copy });
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setReqToCopy(undefined);
    setDuplicateReqDrawer(undefined);
    setViewData(undefined);
    // Only refresh the pipeline snapshot when the drawer actually mutated
    // data. View-only opens skip this — previously every drawer close fired
    // an unconditional 10-call burst (now 1 call) for no reason.
    if (mutatedDuringDrawerRef.current) {
      setSnapshotRefreshKey((k) => k + 1);
      mutatedDuringDrawerRef.current = false;
    }
  };

  const handleChangeFilterModel = (
    model: GridFilterModel,
    _: GridCallbackDetails<'filter'>
  ) => {
    const iModel =
      model.items[0]?.value || model.quickFilterValues?.length
        ? model
        : initialSearchModel;
    setSearchModel(iModel);
  };

  const handleRefreshAll = () => {
    setGridData(undefined);
    reload();
    setSnapshotRefreshKey((k) => k + 1);
    // Clear cached children so next expand is fresh.
    setChildrenMap(new Map());
    setExpandedParents(new Set());
  };

  // ── Star colour cycle ──
  // Anyone on the team can click the star to mark a parent requirement
  // with a colour. Cycle order: none → green → yellow → orange → none.
  // Optimistic: local row mutates immediately, server PATCH fires in
  // the background, errors silently revert.
  const STAR_CYCLE: RequirementStarColor[] = ['none', 'green', 'yellow', 'orange'];
  const nextStarColor = (cur?: string): RequirementStarColor => {
    const i = STAR_CYCLE.indexOf((cur || 'none') as RequirementStarColor);
    return STAR_CYCLE[(i + 1) % STAR_CYCLE.length];
  };

  // The displayed star colour: 'none' renders as a transparent outline
  // with a faint grey stroke; the rest as a filled icon in that hex.
  const STAR_HEX: Record<RequirementStarColor, string> = {
    none: 'transparent',
    green: '#16A34A',
    yellow: '#FACC15',
    orange: '#F97316',
  };

  // ── Debounced audit log for star cycles ──
  // A click cycles colour by ONE step. If HR wants orange they may
  // click 3× in a row (none → green → yellow → orange). We don't want
  // to log every intermediate stop — only the eventual settled colour,
  // and only ONE entry per "burst" of clicks. Per-row debounce:
  //
  //   • First click in a window: capture `cur` as the original colour.
  //   • Each subsequent click: update `finalColor`, reset the 2.5s timer.
  //   • Timer fires → POST one log entry of original → final.
  //   • If original === final (cycled all the way back), skip the log.
  //
  // The user identity + requirement id are stashed on the timer entry
  // so the unmount cleanup can flush pending logs (user clicked then
  // navigated away — the action still happened).
  const STAR_LOG_DEBOUNCE_MS = 2500;
  type PendingStarLog = {
    originalColor: RequirementStarColor;
    finalColor: RequirementStarColor;
    userName: string;
    userRef: string;
    requirementRef: string;
    timer: ReturnType<typeof setTimeout>;
  };
  const starLogTimersRef = useRef<Map<string, PendingStarLog>>(new Map());

  const flushPendingStarLog = (id: string) => {
    const entry = starLogTimersRef.current.get(id);
    if (!entry) return;
    starLogTimersRef.current.delete(id);
    // Net-zero cycle (e.g. user cycled all the way back to where they
    // started) — nothing meaningful to log.
    if (entry.originalColor === entry.finalColor) return;
    // Server stores requirementRef + userRef as ObjectIds — the TS
    // type is Mongoose's branded ObjectId, but every existing call site
    // (e.g. RequirementsForm.tsx → createLog) passes plain string IDs
    // and the cast collapses at runtime. Match that convention.
    const payload: CreateRequirementLogPayload = {
      requirementRef: entry.requirementRef as any,
      userName: entry.userName,
      userRef: entry.userRef as any,
      operation: 'update',
      oldData: { starColor: entry.originalColor },
      newData: { starColor: entry.finalColor },
    };
    // Diagnostic — keeps a paper trail in the browser console so a
    // silent timing / payload bug becomes traceable. The colour itself
    // is already on disk by this point (PATCH ran inside handleCycleStar).
    console.debug('[requirements] star log POST', {
      requirementRef: entry.requirementRef,
      from: entry.originalColor,
      to: entry.finalColor,
    });
    void createRequirementLog(payload)
      .then(() => {
        console.debug(
          '[requirements] star log saved',
          entry.requirementRef,
        );
      })
      .catch((err) => {
        // Surface to the user so a 4xx/network drop doesn't disappear.
        console.warn('[requirements] star log failed', err);
        toast.error('Failed to save star audit log');
      });
  };

  // Cleanup on unmount: flush every pending entry IMMEDIATELY rather
  // than dropping them silently. If the user cycled to orange then
  // navigated away within the debounce window, the audit log still
  // gets that entry.
  useEffect(() => {
    return () => {
      const timers = starLogTimersRef.current;
      const ids = Array.from(timers.keys());
      for (const id of ids) {
        const entry = timers.get(id);
        if (entry) clearTimeout(entry.timer);
        flushPendingStarLog(id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCycleStar = async (row: Row) => {
    const cur = (row.starColor as RequirementStarColor | undefined) || 'none';
    const next = nextStarColor(cur);

    // Optimistic patch — we deliberately DO NOT use patchRowEverywhere /
    // setResults here, because the pagination hook's setResults helper
    // overwrites `totalDocuments` to the current page-length, which
    // visibly empties the grid (MUI X treats it as "page out of range").
    // Updating `gridData` directly preserves the full PaginationResult
    // shape so the row count + pagination state stay intact.
    const patchRow = (color: RequirementStarColor) => {
      setGridData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          results: (prev.results || []).map((r) =>
            r._id === row._id ? { ...r, starColor: color } : r,
          ),
        };
      });
      // Also patch any cached children buckets so a star on a child row
      // (if we ever add it there) would also reflect immediately.
      setChildrenMap((prev) => {
        let touched = false;
        const out = new Map(prev);
        for (const [k, kids] of prev.entries()) {
          let any = false;
          const updated = kids.map((kid) => {
            if (kid._id === row._id) {
              any = true;
              return { ...kid, starColor: color, isChildRow: true as const };
            }
            return kid;
          });
          if (any) {
            out.set(k, updated);
            touched = true;
          }
        }
        return touched ? out : prev;
      });
    };

    patchRow(next);
    try {
      await updateRequirementStar(row._id, next);
      // Schedule the debounced audit log entry. We do this only on
      // success — if the star save itself failed (rare, the catch
      // below reverts the UI), there's nothing to log.
      // Resolve the actor's id from whichever shape the auth context
      // populated. In practice iUser exposes both `_id` and `id` (see
      // server's extractIUser → returns both). Falling back to either
      // keeps the audit log honest even if one channel goes stale.
      const actorId = iUser
        ? String(iUser._id || iUser.id || '')
        : '';
      if (iUser && actorId) {
        const existing = starLogTimersRef.current.get(row._id);
        if (existing) clearTimeout(existing.timer);
        // First click in a window snapshots `cur` (the colour BEFORE
        // this click) as the audit-log "from" value. Subsequent clicks
        // preserve that original — only `finalColor` updates each time.
        const originalColor = existing ? existing.originalColor : cur;
        const userName =
          `${iUser.firstName ?? ''} ${iUser.lastName ?? ''}`.trim() ||
          iUser.email ||
          'User';
        const timer = setTimeout(
          () => flushPendingStarLog(row._id),
          STAR_LOG_DEBOUNCE_MS,
        );
        starLogTimersRef.current.set(row._id, {
          originalColor,
          finalColor: next,
          userName,
          userRef: actorId,
          requirementRef: row._id,
          timer,
        });
        console.debug('[requirements] star log scheduled', {
          row: row._id,
          from: originalColor,
          to: next,
          inMs: STAR_LOG_DEBOUNCE_MS,
        });
      } else {
        // If we ever land here in practice the audit trail is
        // incomplete — surface it so we know to investigate the auth
        // context rather than silently dropping log entries.
        console.warn(
          '[requirements] star log skipped — no authenticated user',
          { iUser },
        );
      }
    } catch {
      // Revert on failure — keep local state honest. Also drop any
      // pending log entry for this row since the action didn't take.
      patchRow(cur);
      const existing = starLogTimersRef.current.get(row._id);
      if (existing) {
        clearTimeout(existing.timer);
        starLogTimersRef.current.delete(row._id);
      }
    }
  };

  // ── Star colour filter (URL-synced) ──
  // We piggyback on `searchParams` so the pagination hook auto-refetches
  // whenever the filter changes. Empty string = no filter (show all).
  // CRITICAL: don't put `page` into searchParams — the pagination hook
  // appends its own `page=X` in createQueryString, and a duplicate
  // `page=…&page=…` URL makes the server's filter parser fall over and
  // the request 400s, which the hook catches by clearing gridData and
  // emptying the grid. Use setPaginationModel() instead to reset to
  // page 1 when the filter changes.
  const activeStarFilter =
    (searchParams.get('starColor') as RequirementStarColor | null) || '';
  const setStarFilter = (color: RequirementStarColor | '') => {
    const next = new URLSearchParams(searchParams);
    if (color) next.set('starColor', color);
    else next.delete('starColor');
    setSearchParams(next, { replace: true });
    // Reset to page 1 so we don't land on an empty page from the
    // previous filter (handled via the pagination model, not the URL).
    setPaginationModel(initialPaginationModel);
  };

  // ── Row synthesis: splice cached children in right after their expanded parent ──
  // Children are stored pre-stamped + pre-sorted (see `stampChildren`), so
  // this loop just pushes the references back in. Each toggle therefore
  // produces a row array where unchanged parents AND unchanged children
  // keep their object identity — MUI X DataGrid's row diff turns into a
  // small insert/remove instead of a "every cell changed" full re-render.
  const displayRows = useMemo<Row[]>(() => {
    const src = (gridData?.results as Row[] | undefined) || [];
    const out: Row[] = [];
    for (const r of src) {
      out.push(r);
      if (r.dateSeparator) continue;
      if (r.parentReqID) continue; // child rows can surface in filtered lists — don't re-splice
      if (!r.reqID) continue;
      if (!expandedParents.has(r.reqID)) continue;
      const kids = childrenMap.get(r.reqID);
      if (!kids) continue;
      for (const kid of kids) out.push(kid);
    }
    return out;
  }, [gridData?.results, expandedParents, childrenMap]);

  /**
   * Source-of-truth for "does this parent currently have child assignments?".
   *
   * Rule: if we have a cached children array (we've expanded or refetched at
   * least once), trust the cache as the latest truth. Otherwise fall back to
   * the server's `hasChildren` stamp from the initial grid fetch.
   *
   * Why not just `row.hasChildren || cached.length > 0`? When the user
   * removes the last child via the assign drawer, the cache correctly drops
   * to `[]` but `row.hasChildren` is still stale-true from the original
   * fetch (we haven't reloaded the top-level grid). That stale-true used to
   * leave a chevron behind that opened an empty list, plus kept three
   * aggregated columns showing the now-removed child's data.
   */
  const hasLiveChildren = (row: Row): boolean => {
    if (!row.reqID) return false;
    const cached = childrenMap.get(row.reqID);
    if (cached) return cached.length > 0;
    return !!row.hasChildren;
  };

  // ── Columns ──
  // Memoized so we don't ship a fresh `columns` prop into MUI X DataGrid
  // on every render. Without this memo, even an unrelated state change
  // (drawer open/close, hover, focus) rebuilt the array and DataGrid
  // re-rendered every cell — which dominated the perceived expand /
  // collapse lag. Deps cover everything the renderCells read directly
  // from page state; handlers defined inline (`toggleExpandParent`,
  // `handleViewDetails`, etc.) are recreated on every render but only
  // become stale-captured if a dep here doesn't trigger a refresh —
  // we include the upstream state they read so the memo invalidates
  // in lockstep with their state-reads.
  const columns: GridColDef<Row>[] = useMemo<GridColDef<Row>[]>(() => [
    {
      field: 'expand',
      headerName: '',
      width: 50,
      filterable: false,
      sortable: false,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        if (row.isChildRow) return null;
        if (row.parentReqID) return null; // child surfaced by filter — no chevron
        // Use the live-children helper so removing the last child via the
        // assign drawer immediately drops the chevron (was previously stuck
        // on because `row.hasChildren` from the original grid fetch went stale).
        if (!hasLiveChildren(row)) return null;
        const cached = childrenMap.get(row.reqID || '');
        const count = cached?.length ?? 0;
        const isLoading = loadingChildrenFor.has(row.reqID || '');
        const isOpen = expandedParents.has(row.reqID || '');
        return (
          <Stack direction="row" alignItems="center" spacing={0.25}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpandParent(row);
              }}
              sx={{
                color: tokensAwareIconColor(isOpen),
                '&:hover': { bgcolor: 'rgba(55, 183, 234, 0.08)' },
              }}
            >
              {isLoading ? (
                <CircularProgress size={14} />
              ) : isOpen ? (
                <IconChevronDown size={18} />
              ) : (
                <IconChevronRight size={18} />
              )}
            </IconButton>
            {count > 0 && !isOpen && (
              <Chip
                label={`+${count}`}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(236, 69, 153, 0.12)',
                  color: '#DB2777',
                }}
              />
            )}
          </Stack>
        );
      },
    },
    {
      field: 'view',
      headerName: '',
      // Bumped from 90 → 130 to fit the star toggle on parent rows
      // alongside the existing View button.
      width: 130,
      filterable: false,
      sortable: false,
      // Span every column to the right when this row is a date separator
      // so the date+count label has the full grid width to render in
      // (instead of being clipped to the 90px View column, where it was
      // truncating "MAY 04 2026" to "MAY 04 20"). Numbers count from
      // this column inclusive — view + reqID + reqStatus + assignedTo +
      // appliedFor + jobTitle + clientCompany + primeVendorCompany +
      // vendorCompany + reqEnteredBy + createdAt + actions = 12.
      // Note: MUI's `colSpan` callback receives positional args
      // `(value, row, column, apiRef)` — destructuring `{ row }` here
      // would crash with "Cannot destructure 'row' of 'undefined'".
      colSpan: (_value, row) =>
        (row as Row | undefined)?.dateSeparator ? 12 : 1,
      renderCell: ({ row }) => {
        if (row.dateSeparator) {
          const { count = 0, fromDate } = row;
          const countLabel = count <= 9 ? `0${count}` : `${count}`;
          return (
            <Box
              display="flex"
              alignItems="center"
              height="25px"
              sx={{ gap: 0.75 }}
            >
              <Typography
                sx={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#1A9FD4',
                  whiteSpace: 'nowrap',
                }}
              >
                {fromDate ? moment(fromDate).format(dateFormate2) : ''}
              </Typography>
              <Typography
                component="span"
                sx={{
                  fontSize: '0.78rem',
                  color: 'text.disabled',
                  fontWeight: 600,
                }}
              >
                -
              </Typography>
              {/* Count — dark orange so the daily total stands out
                  against the blue date as its own scannable accent. */}
              <Typography
                component="span"
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 900,
                  color: '#EA580C',
                  whiteSpace: 'nowrap',
                }}
              >
                {countLabel}
              </Typography>
            </Box>
          );
        }
        // Parent rows get the star toggle to the LEFT of the View
        // button. Child rows skip it (the star is a parent-only flag).
        const showStar = !row.isChildRow;
        const cur = (row.starColor as RequirementStarColor | undefined) || 'none';
        const filled = cur !== 'none';
        const starColor = STAR_HEX[cur];
        return (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {showStar && (
              <Tooltip
                title={
                  cur === 'none'
                    ? 'Click to flag · cycles green → yellow → orange'
                    : `Star: ${cur}. Click to cycle.`
                }
                arrow
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCycleStar(row);
                  }}
                  sx={{
                    width: 28,
                    height: 28,
                    color: filled ? starColor : '#94A3B8',
                  }}
                >
                  {filled ? (
                    <IconStarFilled size={16} color={starColor} />
                  ) : (
                    <IconStar size={16} />
                  )}
                </IconButton>
              </Tooltip>
            )}
            <Button
              size="small"
              variant="contained"
              startIcon={<IconEye size={14} />}
              onClick={() => handleViewDetails(row)}
              sx={{
                background: 'linear-gradient(135deg, #032840 0%, #0A3555 100%)',
                color: '#fff',
                px: 1.5,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'none',
                minWidth: 'auto',
                borderRadius: '8px',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0A3555 0%, #032840 100%)',
                  boxShadow: `0 4px 12px ${alpha('#032840', 0.25)}`,
                },
              }}
            >
              View
            </Button>
          </Stack>
        );
      },
    },
    {
      field: 'reqID',
      headerName: 'ID',
      width: 150,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        const isChild = !!row.isChildRow;
        const suffix = row.childSuffix ? `-${row.childSuffix}` : '';
        if (isChild) {
          return (
            <Box
              sx={{ display: 'inline-flex', alignItems: 'center', pl: '28px' }}
            >
              <Typography
                component="span"
                sx={{
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#94A3B8',
                  mr: 0.5,
                }}
              >
                └─
              </Typography>
              <Typography
                component="span"
                variant="body2"
                fontWeight={700}
                onClick={() => handleViewDetails(row)}
                sx={{
                  cursor: 'pointer',
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  color: '#0A3555',
                  '&:hover': {
                    color: '#032840',
                    textDecoration: 'underline',
                  },
                }}
              >
                {row.parentReqID || row.reqID?.replace(suffix, '') || ''}
                <Box
                  component="span"
                  sx={{
                    color: '#DB2777',
                    background: 'rgba(236, 69, 153, 0.12)',
                    px: 0.5,
                    borderRadius: 0.75,
                    ml: 0.25,
                  }}
                >
                  {suffix || row.reqID}
                </Box>
              </Typography>
            </Box>
          );
        }
        return (
          <Typography
            variant="body2"
            fontWeight={700}
            onClick={() => handleViewDetails(row)}
            sx={{
              cursor: 'pointer',
              fontFamily: 'ui-monospace, Menlo, monospace',
              color: '#0A3555',
              '&:hover': { color: '#032840', textDecoration: 'underline' },
            }}
          >
            {row.reqID}
          </Typography>
        );
      },
    },
    {
      field: 'reqStatus',
      headerName: 'Status',
      width: 160,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        // Parent-with-children: no status (rollup belongs to children).
        // Uses `hasLiveChildren` so removing the last assignment immediately
        // restores the parent's own status — the cache is the latest truth,
        // not the stale `row.hasChildren` from the original grid fetch.
        if (
          !row.isChildRow &&
          !row.parentReqID &&
          hasLiveChildren(row)
        ) {
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        }
        const statusKey = (row.reqStatus || '') as RequirementStatus;
        const color = reqirementStatusColors[statusKey] || '#94A3B8';
        if (!row.reqStatus) {
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        }
        return (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1,
              py: 0.375,
              borderRadius: '6px',
              bgcolor: alpha(color, 0.12),
              color,
              border: `1px solid ${alpha(color, 0.25)}`,
              height: 26,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ fontSize: '0.72rem' }}
            >
              {row.reqStatus}
            </Typography>
          </Box>
        );
      },
    },
    // Assigned-to + Applied-for sit next to Status so a child row's three
    // key workpoints (state, owner, consultant) line up as a scannable
    // left-anchored block before the wider job/client columns.
    // Parents-with-children render em-dashes here for the same reason they
    // render em-dash in Status — those fields roll up to the children.
    {
      field: 'assignedTo',
      headerName: 'Assigned To',
      width: 170,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        // Same em-dash rollup gate as the Status column; cache-first so
        // unassign-last-child drops the dash and restores the parent's
        // own `assignedTo`.
        if (
          !row.isChildRow &&
          !row.parentReqID &&
          hasLiveChildren(row)
        ) {
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        }
        return <PersonPill name={row.assignedTo} />;
      },
    },
    {
      field: 'appliedFor',
      headerName: 'Applied For',
      width: 170,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        // Same em-dash rollup gate as the Status / Assigned-To columns;
        // cache-first so unassign-last-child restores the parent's own
        // `appliedFor`.
        if (
          !row.isChildRow &&
          !row.parentReqID &&
          hasLiveChildren(row)
        ) {
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        }
        return <PersonPill name={row.appliedFor} />;
      },
    },
    {
      field: 'jobTitle',
      headerName: 'Job Title',
      width: 220,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        if (!row.jobTitle)
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        return (
          <Typography
            noWrap
            sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#2A3547' }}
          >
            {row.jobTitle}
          </Typography>
        );
      },
    },
    {
      field: 'clientCompany',
      headerName: 'Client',
      width: 160,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        if (!row.clientCompany)
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        return (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(55, 183, 234, 0.08)',
                color: '#1A9FD4',
                flexShrink: 0,
              }}
            >
              <IconBuilding size={14} />
            </Box>
            <Typography
              noWrap
              sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0A3555' }}
            >
              {row.clientCompany}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: 'primeVendorCompany',
      headerName: 'Prime Vendor',
      width: 160,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        if (!row.primeVendorCompany)
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        return (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(236, 69, 153, 0.08)',
                color: '#DB2777',
                flexShrink: 0,
              }}
            >
              <IconBuilding size={14} />
            </Box>
            <Typography
              noWrap
              sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0A3555' }}
            >
              {row.primeVendorCompany}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: 'vendorCompany',
      headerName: 'Vendor',
      width: 160,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        if (!row.vendorCompany)
          return (
            <Typography variant="caption" color="text.disabled">
              —
            </Typography>
          );
        return (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1.25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(252, 228, 65, 0.18)',
                color: '#A07F00',
                flexShrink: 0,
              }}
            >
              <IconBuilding size={14} />
            </Box>
            <Typography
              noWrap
              sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0A3555' }}
            >
              {row.vendorCompany}
            </Typography>
          </Stack>
        );
      },
    },
    // NOTE: the old `assignedTo` column that used to live here was moved
    // to right after Status (see above) — kept an em-dash parent behaviour
    // intact, just repositioned. A new `appliedFor` column was added
    // beside it so the child-row scan-line now reads: ID · Status ·
    // Owner · Consultant · Job · Company.
    {
      field: 'reqEnteredBy',
      headerName: 'Created By',
      width: 170,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        return <PersonPill name={row.reqEnteredBy} />;
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 140,
      valueGetter: (val: string, row) => {
        if ((row as Row).dateSeparator) return '';
        return val ? moment(val).format(dateFormate2) : '';
      },
      filterOperators: filterOperatorsForDateField,
    },
    {
      field: 'actions',
      headerName: '',
      width: 140,
      filterable: false,
      sortable: false,
      renderCell: ({ row }) => {
        if (row.dateSeparator) return null;
        const canAssign =
          isParentEditor && !archive && !row.isChildRow && !row.parentReqID;
        return (
          <Stack direction="row" spacing={0.25} alignItems="center">
            {/* Copy IconButton intentionally hidden for all roles. The
                underlying handleCopyRow / handleCopy / reqToCopy plumbing
                stays in place so this is a one-block JSX restore if we
                want to expose copy again. */}
            {canAssign && (
              <Tooltip title="Assign marketers">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignFor(row);
                  }}
                  sx={{
                    color: '#DB2777',
                    '&:hover': { bgcolor: 'rgba(236, 69, 153, 0.08)' },
                  }}
                >
                  <IconUsersPlus size={16} />
                </IconButton>
              </Tooltip>
            )}
            {!archive &&
              userRoles.includes(UserRole['super-admin']) &&
              !row.isChildRow && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(row);
                      // let the form handle the actual delete confirmation.
                    }}
                    sx={{
                      color: '#EF4444',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' },
                    }}
                  >
                    <IconTrash size={16} />
                  </IconButton>
                </Tooltip>
              )}
          </Stack>
        );
      },
    },
  ],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [
    // State the renderCells actually read. Functions captured in the
    // memo (toggle, view, etc.) close over these — they're recreated
    // each Requirements render, so the memo recaptures the latest
    // bindings whenever any of these deps move. Other state changes
    // (drawer open, form mode, etc.) don't invalidate this memo, so
    // DataGrid keeps the same columns reference and skips re-rendering
    // every cell on every keystroke.
    //
    // `gridData?.results` is intentionally NOT in here — the row click
    // handler now uses the row passed by DataGrid directly, so it has
    // no dependency on the latest results array. Keeping it out
    // preserves the memo across pagination / filter changes.
    childrenMap,
    expandedParents,
    loadingChildrenFor,
    archive,
    isParentEditor,
    userRoles,
  ]);

  // Copy directly from a row without first opening view mode.
  const handleCopyRow = (row: IRequirement) => {
    setMode('add');
    setFormTitle('Add New Requirement');

    const copy: Partial<IRequirement & { __v?: string }> = {
      ...row,
      reqEnteredBy: `${iUser?.firstName} ${iUser?.lastName}`,
      reqEnteredByRef: `${iUser?.id}`,
      isDuplicate: 'true',
      duplicateWith: row.reqID,
      rate: [],
      taxType: [],
      remote: [],
      duration: [],
      mComment: [],
      resumeUpload: '',
    };
    delete copy.createdAt;
    delete copy.reqID;
    delete copy._id;
    delete copy.__v;
    delete copy.parentReqID;
    delete copy.childSuffix;
    setReqToCopy({ ...copy });
    setDrawerOpen(true);
  };

  // ── Hero banner ──
  const dataGridHeader = (
    <Box sx={{ width: '100%' }}>
      <MotionBox
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #032840 0%, #0A3555 100%)',
          color: '#fff',
          p: { xs: 2.5, sm: 3 },
          mb: 2.5,
        }}
      >
        {/* Pink radial orb top-right */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -30,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(
              '#EC4599',
              0.3
            )} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        {/* Blue radial orb bottom-left */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            left: '25%',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(
              '#37B7EA',
              0.22
            )} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        {/* Brand gradient top stripe */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background:
              'linear-gradient(135deg, #EC4599 0%, #37B7EA 50%, #FCE441 100%)',
          }}
        />

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
          sx={{ position: 'relative', zIndex: 1 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.75}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #EC4599 0%, #37B7EA 100%)',
                color: '#fff',
                boxShadow:
                  '0 0 20px rgba(236, 69, 153, 0.3), 0 0 40px rgba(55, 183, 234, 0.15)',
              }}
            >
              <IconBriefcase size={24} />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: alpha('#fff', 0.7),
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                }}
              >
                MARKETING RADAR ·{' '}
                {archive ? 'ARCHIVE' : (activeReqStatus || 'LIVE').toUpperCase()}
              </Typography>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: '#fff', lineHeight: 1.15 }}
              >
                Requirement{' '}
                <Box
                  component="span"
                  sx={{
                    background:
                      'linear-gradient(135deg, #EC4599 0%, #37B7EA 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  pipeline
                </Box>
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: alpha('#fff', 0.65), mt: 0.25 }}
              >
                {gridData?.totalDocuments ?? 0} shown · multi-assign marketers,
                track per-child status
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.25}>
            {!archive && (
              <Button
                variant="contained"
                startIcon={<IconClipboardCheck size={18} />}
                onClick={handleAddNew}
                size="medium"
                sx={{
                  background:
                    'linear-gradient(135deg, #EC4599 0%, #37B7EA 100%)',
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  px: 2.5,
                  py: 0.9,
                  boxShadow: `0 6px 16px ${alpha('#EC4599', 0.35)}`,
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #DB2777 0%, #1A9FD4 100%)',
                    boxShadow: `0 8px 20px ${alpha('#EC4599', 0.45)}`,
                  },
                }}
              >
                Add new
              </Button>
            )}
            {/* Star colour filter — chips for All / Green / Yellow /
                Orange. Clicking a colour pins the grid to parent rows
                with that star; clicking it again (or "All") clears
                the filter. Lives in the header strip alongside the
                Refresh button so it sits with the other view-level
                controls. */}
            <Tooltip title="Filter by star colour" arrow>
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  bgcolor: alpha('#fff', 0.1),
                  borderRadius: 2,
                  px: 0.5,
                  py: 0.25,
                  alignItems: 'center',
                }}
              >
                {(['', 'green', 'yellow', 'orange'] as const).map((c) => {
                  const active = activeStarFilter === c;
                  const hex = c === ''
                    ? '#FFFFFF'
                    : STAR_HEX[c as RequirementStarColor];
                  return (
                    <IconButton
                      key={c || 'all'}
                      size="small"
                      onClick={() =>
                        setStarFilter(c as RequirementStarColor | '')
                      }
                      sx={{
                        width: 28,
                        height: 28,
                        color: hex,
                        bgcolor: active ? alpha(hex, 0.3) : 'transparent',
                        border: active
                          ? `1px solid ${alpha(hex, 0.7)}`
                          : '1px solid transparent',
                        '&:hover': { bgcolor: alpha(hex, 0.2) },
                      }}
                    >
                      {c === '' ? (
                        <IconStar size={14} />
                      ) : (
                        <IconStarFilled size={14} color={hex} />
                      )}
                    </IconButton>
                  );
                })}
              </Stack>
            </Tooltip>
            <Tooltip title="Refresh all">
              <IconButton
                onClick={handleRefreshAll}
                disabled={loading}
                sx={{
                  bgcolor: alpha('#fff', 0.1),
                  color: '#fff',
                  borderRadius: 2,
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: alpha('#fff', 0.18) },
                }}
              >
                <IconRefresh size={18} className={loading ? 'sync-icon-loading' : ''} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </MotionBox>

      {/* Pipeline snapshot row */}
      {!archive && (
        <MotionBox
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          sx={{ mb: 2 }}
        >
          <PipelineSnapshot
            activeStatus={activeReqStatus}
            onStatusChange={handlePipelineStatusChange}
            archive={archive}
            refreshKey={snapshotRefreshKey}
          />
        </MotionBox>
      )}
    </Box>
  );

  // ── Form body (deferred behind loading / error) ──
  const MyForm = (
    <>
      {formStateLoading ? (
        <Box className="loader" sx={{ py: 10, height: '300px', pr: 0, m: 0 }}>
          <CircularProgress />
        </Box>
      ) : formStateError ? (
        <Box textAlign="center">
          <Typography color="error">{formStateError}</Typography>
          <IconButton
            onClick={() => {
              accountsState.loadData();
              consultantsState.loadData();
            }}
          >
            <Sync color="primary" />
          </IconButton>
        </Box>
      ) : (
        <RequirementsForm
          showLogs
          setResults={patchRowEverywhere}
          hideButtons={archive}
          accounts={accounts || []}
          consultants={consultants || []}
          viewData={viewData}
          mode={mode}
          onDrawerClose={handleDrawerClose}
          isEditing={mode !== 'view'}
          onEdit={handleEdit}
          onCopy={handleCopy}
          reqToCopy={reqToCopy}
          onOpenChild={(reqID) => setChildReqDrawer(reqID)}
          onAssignMutated={handleAssignMutated}
        />
      )}
    </>
  );

  return (
    <>
      <CustomDataGrid
        paginateState={{
          totalRows: gridData?.totalDocuments || 0,
          model: paginationModel,
          onChange: setPaginationModel,
        }}
        onFilterModelChange={handleChangeFilterModel}
        archiveState={
          isArchiveRequirementModuleAllowed
            ? [archive, onChangeArchiveButton]
            : undefined
        }
        error={error}
        retry={reload}
        header={dataGridHeader}
        rows={displayRows as unknown as any[]}
        columns={columns as unknown as GridColDef[]}
        loading={loading}
      />

      <CustomDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        title={formTitle}
        closeOnOutSideClick={mode === 'view'}
        subTitle={
          <RequirementMeta
            hideInterviews={mode !== 'view'}
            requirement={viewData}
            archive={archive}
            onOpenDuplicateReq={() =>
              setDuplicateReqDrawer(viewData?.duplicateWith)
            }
          />
        }
      >
        {MyForm}
      </CustomDrawer>

      {viewData?.duplicateWith && (
        <RequirementDrawer
          archive={archive}
          open={Boolean(duplicateReqDrawer)}
          reqID={viewData?.duplicateWith}
          onClose={() => setDuplicateReqDrawer(undefined)}
        />
      )}

      {childReqDrawer && (
        <RequirementDrawer
          archive={archive}
          open={Boolean(childReqDrawer)}
          reqID={childReqDrawer}
          onClose={() => setChildReqDrawer(undefined)}
          // Route saves done inside this focused drawer through the page's
          // shared row-patcher so the expanded children list under the
          // parent updates live. Without this, an "Applied For" edit
          // (or any other field) inside the child drawer would only
          // refresh the drawer's local view — the grid stayed stale
          // until the user manually reloaded.
          onPatch={(updated) => {
            patchRowEverywhere((prev) =>
              (prev || []).map((r) => (r._id === updated._id ? updated : r)),
            );
          }}
        />
      )}

      {deepLinkReqID && (
        <RequirementDrawer
          open={Boolean(deepLinkReqID)}
          reqID={deepLinkReqID}
          onPatch={(updated) => {
            // Same sync — a notification deep-link can land you on a
            // requirement; if you edit it, the grid should reflect the
            // change immediately.
            patchRowEverywhere((prev) =>
              (prev || []).map((r) => (r._id === updated._id ? updated : r)),
            );
          }}
          onClose={() => {
            setDeepLinkReqID(undefined);
            // Strip the URL param so closing + re-clicking the bell works.
            setSearchParams(
              (prev) => {
                prev.delete('openReqID');
                return prev;
              },
              { replace: true },
            );
          }}
        />
      )}

      <AssignRequirementDrawer
        open={!!assignFor}
        onClose={() => setAssignFor(null)}
        parent={assignFor || undefined}
        accounts={accounts || []}
        onMutate={handleAssignMutated}
      />
    </>
  );
}

// Small helper used by the expand chevron; keeps the colour logic off the JSX.
function tokensAwareIconColor(active: boolean) {
  return active ? '#DB2777' : '#5A6A85';
}

export type FormMode = 'view' | 'edit' | 'add';
