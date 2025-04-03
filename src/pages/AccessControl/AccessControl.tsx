import {
  Box,
  Tabs,
  Tab,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  useTheme,
  CircularProgress,
  IconButton,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { UserRole } from '../../Interfaces/iUser';
import {
  iAccessControl,
  ArchiveModule,
  EmployeeModule,
  HomeModule,
  MarketingModule,
  moduleKey,
  SuperAdminModule,
  ModuleGroup,
} from '../../utils/accessControlUtil';
import { useFetchData } from '../../hooks/fetchDataHook';
import {
  getAccessControl,
  updateAccessControl,
} from '../../services/accessControlApi';
import { Sync } from '@mui/icons-material';
import { toast } from 'react-toastify';

const AccessControl = () => {
  const theme = useTheme();
  const tabs = Object.values(UserRole).filter(
    (r) => r !== UserRole['super-admin']
  );
  const moduleGroups: { [key in ModuleGroup]: string[] } = useMemo(
    () => ({
      [ModuleGroup.Home]: Object.values(HomeModule),
      [ModuleGroup.Marketing]: Object.values(MarketingModule),
      [ModuleGroup.Archive]: Object.values(ArchiveModule),
      [ModuleGroup['Presence & Leave']]: Object.values(EmployeeModule),
      [ModuleGroup['Super Admin Modules']]: Object.values(SuperAdminModule),
    }),
    []
  );
  const [value, setValue] = useState(0);
  const {
    loading,
    error,
    data: accessControl,
    setData: setAccessControl,
    loadData,
  } = useFetchData<iAccessControl>(async () => {
    const { data } = await getAccessControl();
    return data.data!;
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleModuleToggle = async (
    role: UserRole,
    moduleGroup: ModuleGroup,
    module: string,
    checked: boolean
  ) => {
    if (!accessControl) return;
    const key = moduleKey(moduleGroup, module);

    const pre = { ...accessControl };
    try {
      const updatedAccess = { ...accessControl };
      if (checked) {
        if (!updatedAccess[role]?.includes(key)) {
          updatedAccess[role] = [...(updatedAccess[role] || []), key];
        }
      } else {
        updatedAccess[role] =
          updatedAccess[role]?.filter((item) => item !== key) || [];
      }
      setAccessControl(updatedAccess);
      await updateAccessControl(accessControl._id, updatedAccess);
    } catch (error) {
      setAccessControl(pre);
      console.log(pre);
      toast.error('Failed to update');
      console.log(error);
    }
  };

  const isModuleAllowed = (
    role: UserRole,
    moduleGroup: ModuleGroup,
    module: string
  ): boolean => {
    const key = moduleKey(moduleGroup, module);
    if (accessControl && Array.isArray(accessControl[role])) {
      return accessControl[role].includes(key);
    }
    return false;
  };

  if (loading || !accessControl)
    return (
      <Box height={100} className="loader" sx={{ py: 10 }}>
        <CircularProgress />
      </Box>
    );

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Typography color="error">{error}</Typography>
        <IconButton onClick={loadData}>
          <Sync color="primary" />
        </IconButton>
      </div>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleTabChange}
          aria-label="access control tabs"
        >
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab} {...a11yProps(index)} />
          ))}
        </Tabs>
      </Box>
      {tabs.map((role, index) => (
        <TabPanel key={index} value={value} index={index}>
          <Typography variant="h6" gutterBottom>
            <span style={{ textTransform: 'capitalize' }}>{role}</span> Access
            Control
          </Typography>
          {(Object.keys(moduleGroups) as ModuleGroup[]).map(
            (moduleGroup, i) => (
              <Box
                key={i}
                sx={{
                  my: 1,
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2 }}
                  color="textSecondary"
                >
                  {moduleGroup}
                </Typography>
                <FormGroup
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    flexDirection: 'row',
                  }}
                >
                  {moduleGroups[moduleGroup].map((module, j) => (
                    <FormControlLabel
                      sx={{ width: 'fit-content', minWidth: '200px' }}
                      key={j}
                      control={
                        <Switch
                          checked={isModuleAllowed(role, moduleGroup, module)}
                          onChange={(e) =>
                            handleModuleToggle(
                              role,
                              moduleGroup,
                              module,
                              e.target.checked
                            )
                          }
                          name={`${role}-${moduleGroup}-${module}`}
                        />
                      }
                      label={module}
                    />
                  ))}
                </FormGroup>
              </Box>
            )
          )}
        </TabPanel>
      ))}
    </Box>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`access-control-tabpanel-${index}`}
      aria-labelledby={`access-control-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `access-control-tab-${index}`,
    'aria-controls': `access-control-tabpanel-${index}`,
  };
}

export default AccessControl;
