import { useMemo } from 'react';
import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import {
  IconHistory,
  IconShieldCheck,
  IconUserPlus,
} from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProbationApprovals from './ProbationApprovals';
import OnboardingPanel from './OnboardingPanel';
import BackdatedOnboardingPanel from './BackdatedOnboardingPanel';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../Interfaces/iUser';

/**
 * Employee Management
 *
 * Shell page with a tab strip. Today only "Probation" lives here.
 * Future tabs (onboarding paperwork, confirmation, document checklist,
 * etc.) drop into `TAB_DEFS` and the switch in the renderer below.
 *
 * The active tab is mirrored to the URL via `?tab=…`, so a bell-click
 * deep link or browser-back/refresh lands on the right tab.
 */

type TabKey = 'probation' | 'onboarding' | 'backdated';

interface TabDef {
  key: TabKey;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ReactElement<any>;
  /** Tab is hidden unless the viewer has at least one of these roles.
   *  Undefined → visible to everyone who can already see Employee
   *  Management at all. */
  superAdminOnly?: boolean;
}

const TAB_DEFS: TabDef[] = [
  {
    key: 'probation',
    label: 'Probation',
    icon: <IconShieldCheck size={16} />,
  },
  {
    key: 'onboarding',
    label: 'Onboarding',
    icon: <IconUserPlus size={16} />,
  },
  {
    key: 'backdated',
    label: 'Backdated Onboarding',
    icon: <IconHistory size={16} />,
    superAdminOnly: true,
  },
];

export default function EmployeeManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { iUser } = useAuth();
  const isSuperAdmin = Boolean(iUser?.role?.includes(UserRole['super-admin']));

  // Tabs the current viewer is allowed to see. Backdated Onboarding
  // is super-admin only — hidden from admin / HR so they can't even
  // attempt a 403 from the server.
  const visibleTabs = useMemo(
    () => TAB_DEFS.filter((t) => !t.superAdminOnly || isSuperAdmin),
    [isSuperAdmin],
  );

  // Resolve the active tab from the URL. Unknown / missing values fall
  // back to the first tab so a stale link can't render a blank pane.
  const activeTab: TabKey = useMemo(() => {
    const raw = searchParams.get('tab');
    const found = visibleTabs.find((t) => t.key === raw);
    return found ? found.key : visibleTabs[0].key;
  }, [searchParams, visibleTabs]);

  const handleChange = (_: React.SyntheticEvent, next: TabKey) => {
    // Use replace so the back button doesn't fill up with tab-switches.
    setSearchParams({ tab: next }, { replace: true });
    // navigate is just here to satisfy lint when the import is unused;
    // setSearchParams handles the URL update.
    void navigate;
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={800}>
          Employee Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage the employee lifecycle — probation approvals today;
          onboarding, confirmation, and paperwork coming next.
        </Typography>
      </Box>

      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {visibleTabs.map((t) => (
            <Tab
              key={t.key}
              value={t.key}
              icon={t.icon}
              iconPosition="start"
              label={t.label}
              sx={{ minHeight: 44, textTransform: 'none', fontWeight: 600 }}
            />
          ))}
        </Tabs>
      </Box>

      <Stack>
        {activeTab === 'probation' && <ProbationApprovals />}
        {activeTab === 'onboarding' && <OnboardingPanel />}
        {activeTab === 'backdated' && isSuperAdmin && <BackdatedOnboardingPanel />}
        {/* Future tabs render here. Keep each as a self-contained
            sub-component fetching its own data so this shell stays
            zero-state-y and instant to render. */}
      </Stack>
    </Box>
  );
}
