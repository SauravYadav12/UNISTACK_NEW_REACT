import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Autocomplete,
  TextField,
  Chip,
  Avatar,
  Tooltip,
  CircularProgress,
  alpha,
  Divider,
} from '@mui/material';
import {
  IconUsersPlus,
  IconTrash,
  IconX,
  IconUserCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import CustomDrawer from '../drawer/CustomDrawer';
import {
  assignMarketers as assignMarketersApi,
  listChildAssignments,
  unassignMarketer as unassignMarketerApi,
} from '../../services/requirementApi';
import { IRequirement } from '../../Interfaces/types';
import { iUser, UserRole } from '../../Interfaces/iUser';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { tokens } from '../../theme/theme';
import { getInitials } from '../ui/PersonPill';
import { reqirementStatusColors } from '../../pages/Marketing/Requirements/requirementsValues';
import { RequirementStatus } from '../../Interfaces/reports';

export interface MutateInfo {
  parentReqID: string;
  /** Children list after the mutation (already-refetched by the drawer). */
  children: IRequirement[];
  /** Children created by *this* action specifically. Empty for removal. */
  created: IRequirement[];
  /** True when a marketer assigned themselves — the caller may want to open
   *  the new child drawer automatically so the marketer can start working. */
  isSelfAssign: boolean;
  /** Distinguishes a save from a remove so the caller can pick the right
   *  close behaviour without sniffing array lengths. */
  kind: 'add' | 'remove';
}

interface Props {
  open: boolean;
  onClose: () => void;
  parent?: IRequirement;
  /** Pool of candidates — the drawer filters down to users with the `marketing` role. */
  accounts: iUser[];
  /** Fired after a successful assignment or removal so the caller can refetch the grid. */
  onMutate?: (info: MutateInfo) => void;
}

/**
 * Two modes:
 *
 *  - Parent-editor mode (support / admin / super-admin): full multi-select
 *    picker over all marketers + remove buttons on every existing assignment.
 *  - Self-assign mode (marketer): one primary "Assign myself" button — and
 *    only if they're not already assigned. Existing assignments still
 *    render but without any remove affordance.
 */

export default function AssignRequirementDrawer({
  open,
  onClose,
  parent,
  accounts,
  onMutate,
}: Props) {
  const { iUser: currentUser } = useAuth();
  const userRoles = currentUser?.role || [];
  const isParentEditor =
    userRoles.includes(UserRole['super-admin']) ||
    userRoles.includes(UserRole.admin) ||
    userRoles.includes(UserRole.support);
  const isMarketer = userRoles.includes(UserRole.marketing);
  // Removing a child assignment == hard-deleting a child requirement
  // row (server does `findByIdAndDelete`), which wipes attribution
  // history. Gate the remove affordance to super-admin only — matches
  // the server-side guard in `unassignMarketer` / `deleteRequirement`.
  const canRemoveChild = userRoles.includes(UserRole['super-admin']);

  const [children, setChildren] = useState<IRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState<iUser[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const marketers = useMemo(
    () => accounts.filter((u) => u.role?.includes(UserRole.marketing)),
    [accounts]
  );

  const loadChildren = async () => {
    if (!parent?.reqID) return;
    setLoading(true);
    try {
      const res = await listChildAssignments(parent.reqID);
      setChildren((res.data.data?.results as IRequirement[]) || []);
    } catch (e) {
      console.error('AssignRequirementDrawer loadChildren error', e);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && parent?.reqID) {
      setPicked([]);
      loadChildren();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parent?.reqID]);

  const alreadyAssignedIds = useMemo(
    () => new Set(children.map((c) => String(c.assignedToRef || ''))),
    [children]
  );

  // Filter out marketers who are already assigned to this parent.
  const available = useMemo(
    () => marketers.filter((u) => !alreadyAssignedIds.has(String(u._id))),
    [marketers, alreadyAssignedIds]
  );

  const currentUserId = String(currentUser?._id || '');
  const selfAlreadyAssigned = alreadyAssignedIds.has(currentUserId);

  // Refetch this parent's children and return the fresh list, so callers can
  // both update local state AND hand the list off to the page.
  const refetchAndReturn = async (): Promise<IRequirement[]> => {
    if (!parent?.reqID) return [];
    try {
      const res = await listChildAssignments(parent.reqID);
      const list = (res.data.data?.results as IRequirement[]) || [];
      setChildren(list);
      return list;
    } catch (e) {
      console.error('refetchAndReturn error', e);
      return children;
    }
  };

  const handleAssign = async () => {
    if (!parent?.reqID || picked.length === 0) return;
    setSaving(true);
    try {
      const payload = picked.map((u) => ({
        marketerRef: String(u._id),
        marketerName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      }));
      const res = await assignMarketersApi(parent.reqID, payload);
      const created = ((res.data?.data as unknown) as IRequirement[]) || [];
      toast.success(`Assigned ${picked.length} marketer${picked.length === 1 ? '' : 's'}`);
      setPicked([]);
      const fresh = await refetchAndReturn();
      onMutate?.({
        parentReqID: parent.reqID,
        children: fresh,
        created,
        isSelfAssign: false,
        kind: 'add',
      });
    } catch (e: any) {
      console.error('assignMarketers error', e);
      toast.error(e?.response?.data?.message || 'Failed to assign marketers');
    } finally {
      setSaving(false);
    }
  };

  const handleSelfAssign = async () => {
    if (!parent?.reqID || !currentUser) return;
    setSaving(true);
    try {
      const res = await assignMarketersApi(parent.reqID, [
        {
          marketerRef: String(currentUser._id),
          marketerName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
        },
      ]);
      const created = ((res.data?.data as unknown) as IRequirement[]) || [];
      toast.success('You are now assigned to this requirement');
      const fresh = await refetchAndReturn();
      onMutate?.({
        parentReqID: parent.reqID,
        children: fresh,
        created,
        isSelfAssign: true,
        kind: 'add',
      });
    } catch (e: any) {
      console.error('handleSelfAssign error', e);
      toast.error(e?.response?.data?.message || 'Failed to assign yourself');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (child: IRequirement) => {
    if (!parent?.reqID) return;
    setRemovingId(child._id);
    try {
      await unassignMarketerApi(child._id);
      toast.success(`Removed assignment ${child.reqID}`);
      const fresh = await refetchAndReturn();
      onMutate?.({
        parentReqID: parent.reqID,
        children: fresh,
        created: [],
        isSelfAssign: false,
        kind: 'remove',
      });
    } catch (e: any) {
      console.error('unassignMarketer error', e);
      toast.error(
        e?.response?.data?.message ||
          'Failed to remove assignment (it may have interviews)'
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <CustomDrawer
      title={parent ? `Assign · ${parent.reqID}` : 'Assign requirement'}
      open={open}
      onClose={onClose}
      closeOnOutSideClick
    >
      {!parent ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No parent requirement selected.</Typography>
        </Box>
      ) : (
        <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Parent summary */}
          <Box
            sx={{
              position: 'relative',
              p: 2,
              borderRadius: 3,
              background: tokens.gradients.pinkBlue,
              color: '#fff',
              overflow: 'hidden',
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 700, letterSpacing: '0.06em' }}>
              PARENT REQUIREMENT
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, mt: 0.25 }}>
              {parent.reqID}{parent.jobTitle ? ` · ${parent.jobTitle}` : ''}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {[parent.clientCompany, parent.primaryTech].filter(Boolean).join(' · ') || '—'}
            </Typography>
          </Box>

          {/* Existing assignments */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
              <IconUserCheck size={16} color={tokens.colors.blueDark} />
              <Typography variant="subtitle2" fontWeight={800}>
                Current assignments
                <Box
                  component="span"
                  sx={{
                    ml: 1,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: tokens.colors.pinkDark,
                  }}
                >
                  {loading ? '—' : children.length}
                </Box>
              </Typography>
            </Stack>

            {loading ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <CircularProgress size={22} />
              </Box>
            ) : children.length === 0 ? (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: alpha(tokens.colors.blue, 0.3),
                  bgcolor: alpha(tokens.colors.blue, 0.03),
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No marketers assigned yet. Pick one or more below.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {children.map((c) => {
                  const status = (c.reqStatus || 'New Working') as RequirementStatus;
                  const color = reqirementStatusColors[status] || '#94A3B8';
                  return (
                    <Box
                      key={c._id}
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: tokens.gradients.pinkBlue,
                          color: '#fff',
                        }}
                      >
                        {getInitials(c.assignedTo || '?')}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'ui-monospace, Menlo, monospace',
                              fontWeight: 700,
                              color: tokens.colors.blueDark,
                            }}
                          >
                            {c.reqID}
                          </Typography>
                          <Chip
                            label={status}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              bgcolor: alpha(color, 0.12),
                              color,
                              border: `1px solid ${alpha(color, 0.25)}`,
                            }}
                          />
                        </Stack>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {c.assignedTo || 'Unknown'}
                        </Typography>
                      </Box>
                      {canRemoveChild && (
                        <Tooltip title="Remove assignment (super-admin only; blocked if interviews exist)">
                          <span>
                            <IconButton
                              size="small"
                              disabled={removingId === c._id}
                              onClick={() => handleRemove(c)}
                              sx={{
                                color: '#EF4444',
                                '&:hover': { bgcolor: alpha('#EF4444', 0.08) },
                              }}
                            >
                              {removingId === c._id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <IconTrash size={16} />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          <Divider />

          {/* Add new assignments — branches by role. */}
          {isParentEditor ? (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
                <IconUsersPlus size={16} color={tokens.colors.pinkDark} />
                <Typography variant="subtitle2" fontWeight={800}>
                  Add marketers
                </Typography>
              </Stack>
              <Autocomplete
                multiple
                options={available}
                value={picked}
                disabled={saving || loading}
                onChange={(_, v) => setPicked(v)}
                getOptionLabel={(u) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || ''}
                isOptionEqualToValue={(a, b) => a._id === b._id}
                renderOption={(props, u) => (
                  <li {...props} key={u._id}>
                    <Avatar
                      sx={{
                        width: 26,
                        height: 26,
                        mr: 1.25,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        background: tokens.gradients.pinkBlue,
                        color: '#fff',
                      }}
                    >
                      {getInitials(`${u.firstName || ''} ${u.lastName || ''}`.trim() || '?')}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>
                        {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                      </Typography>
                      {u.email && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {u.email}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((u, i) => (
                    <Chip
                      {...getTagProps({ index: i })}
                      key={u._id}
                      label={`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                      avatar={
                        <Avatar
                          sx={{
                            background: tokens.gradients.pinkBlue,
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '0.58rem',
                          }}
                        >
                          {getInitials(`${u.firstName || ''} ${u.lastName || ''}`.trim() || '?')}
                        </Avatar>
                      }
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={picked.length === 0 ? 'Search marketer by name…' : ''}
                    size="small"
                  />
                )}
              />
              {available.length === 0 && !loading && marketers.length > 0 && (
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1 }}>
                  <IconAlertTriangle size={14} color="#F59E0B" />
                  <Typography variant="caption" color="text.secondary">
                    All active marketers are already assigned to this requirement.
                  </Typography>
                </Stack>
              )}
              {marketers.length === 0 && !loading && (
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1 }}>
                  <IconAlertTriangle size={14} color="#F59E0B" />
                  <Typography variant="caption" color="text.secondary">
                    No one with the Marketing role is active. Ask HR to tag marketers in User Management.
                  </Typography>
                </Stack>
              )}
            </Box>
          ) : (
            // Marketer self-assign mode — they can add themselves and only
            // themselves. The rest of the drawer still shows existing
            // sibling assignments but without a picker.
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                border: `1px solid ${alpha(tokens.colors.pink, 0.2)}`,
                bgcolor: alpha(tokens.colors.pink, 0.04),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
                <IconUserCheck size={16} color={tokens.colors.pinkDark} />
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: tokens.colors.pinkDark }}>
                  Pick up this requirement
                </Typography>
              </Stack>
              {selfAlreadyAssigned ? (
                <Typography variant="body2" color="text.secondary">
                  You're already assigned to this requirement — your record is in the list above.
                </Typography>
              ) : !isMarketer ? (
                <Typography variant="body2" color="text.secondary">
                  Only users with the Marketing role can self-assign. Ask Support or an admin to assign you.
                </Typography>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Add yourself to the marketers working on this position. You'll get your own
                    assignment record with per-marketer rate, tax, duration and comments.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleSelfAssign}
                    disabled={saving || loading}
                    startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <IconUsersPlus size={16} />}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 2,
                      fontWeight: 700,
                      background: tokens.gradients.pinkBlue,
                      '&:hover': { background: tokens.gradients.pinkBlue, filter: 'brightness(1.08)' },
                    }}
                  >
                    Assign myself
                  </Button>
                </>
              )}
            </Box>
          )}

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={onClose}
              startIcon={<IconX size={16} />}
              sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
            >
              Close
            </Button>
            {isParentEditor && (
              <Button
                variant="contained"
                onClick={handleAssign}
                disabled={saving || picked.length === 0}
                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <IconUsersPlus size={16} />}
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  fontWeight: 700,
                  background: tokens.gradients.pinkBlue,
                  '&:hover': { background: tokens.gradients.pinkBlue, filter: 'brightness(1.08)' },
                }}
              >
                Assign {picked.length > 0 ? `(${picked.length})` : ''}
              </Button>
            )}
          </Stack>
        </Box>
      )}
    </CustomDrawer>
  );
}
