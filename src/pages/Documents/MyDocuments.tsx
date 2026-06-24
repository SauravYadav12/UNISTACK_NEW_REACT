import { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import {
  IconFileDollar,
  IconUserPlus,
  IconReceiptTax,
} from '@tabler/icons-react';

import { tokens } from '../../theme/theme';
import PaySlipPanel from './PaySlipPanel';
import OnboardingDocsPanel from './OnboardingDocsPanel';
import Form16Panel from './Form16Panel';

const MotionBox = motion.create(Box);

type DocTab = 'payslip' | 'onboarding' | 'taxCenter';

export default function MyDocuments() {
  const [tab, setTab] = useState<DocTab>('payslip');

  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{ mb: 3 }}
      >
        <Typography variant="h1" fontWeight={700} sx={{ mb: 0.5 }}>
          My{' '}
          <Box component="span" sx={{
            background: tokens.gradients.pinkBlue,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Documents
          </Box>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Payslips, onboarding paperwork, Form-16, and anything else HR sends you
        </Typography>
      </MotionBox>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as DocTab)}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
          '& .Mui-selected': { color: tokens.colors.pink },
          '& .MuiTabs-indicator': { bgcolor: tokens.colors.pink },
        }}
      >
        <Tab
          value="payslip"
          label="Pay Slip"
          icon={<IconFileDollar size={16} />}
          iconPosition="start"
        />
        <Tab
          value="onboarding"
          label="Onboarding"
          icon={<IconUserPlus size={16} />}
          iconPosition="start"
        />
        <Tab
          value="taxCenter"
          label="Tax Center"
          icon={<IconReceiptTax size={16} />}
          iconPosition="start"
        />
      </Tabs>

      {tab === 'payslip' && <PaySlipPanel />}
      {tab === 'onboarding' && <OnboardingDocsPanel />}
      {tab === 'taxCenter' && <Form16Panel />}
    </Box>
  );
}
