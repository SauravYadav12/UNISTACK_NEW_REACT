import { Box, Chip, Container, Stack, Typography, alpha } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  IconArrowLeft,
  IconShieldCheck,
  IconCircleCheck,
} from '@tabler/icons-react';
import { tokens } from '../../theme/theme';
import { LIGHT, LandingNav } from '../Landing/Landing';

const MotionBox = motion.create(Box);
const MotionStack = motion.create(Stack);

/**
 * Shared shell for the legal / policy pages (Privacy, Terms, Security,
 * Status). Renders the same fixed transparent nav as the landing, a compact
 * bright hero with the page title + last-updated stamp, and a prose body
 * styled in the same brand palette.
 *
 * Intentionally plain — these pages don't need the full marketing chrome
 * (orbital, bento, personas). A reader on /privacy wants to read the
 * policy, not watch particles drift.
 */

export interface LegalSection {
  heading: string;
  /** Paragraphs rendered as body copy. Pass as an array so we get proper
   *  spacing between blocks without <br/>-soup in the source. */
  paragraphs: string[];
  /** Optional bullet list rendered below the paragraphs. */
  bullets?: string[];
}

export interface LegalPageContent {
  title: string;
  chip: string;
  intro: string;
  updatedAt: string; // "April 24, 2026"
  sections: LegalSection[];
}

export default function LegalPage({ content }: { content: LegalPageContent }) {
  const navigate = useNavigate();
  const goLogin = () => navigate('/login');

  return (
    <Box sx={{ bgcolor: LIGHT.base, color: LIGHT.ink, minHeight: '100vh' }}>
      <LandingNav onLogin={goLogin} anchorMode="route" />

      {/* Hero — soft aurora with the page title */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 12, md: 16 },
          pb: { xs: 6, md: 10 },
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -140,
            right: -80,
            width: 440,
            height: 440,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.pink, 0.2)} 0%, transparent 70%)`,
            filter: 'blur(90px)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -140,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(tokens.colors.blue, 0.16)} 0%, transparent 70%)`,
            filter: 'blur(90px)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <MotionStack
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            spacing={2}
          >
            {/* Back link */}
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                textDecoration: 'none',
                color: LIGHT.inkSoft,
                fontSize: '0.82rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                width: 'fit-content',
                transition: 'color 0.15s ease',
                '&:hover': { color: LIGHT.ink },
              }}
            >
              <IconArrowLeft size={14} />
              Back to home
            </Box>

            <Chip
              icon={<IconShieldCheck size={14} />}
              label={content.chip}
              sx={{
                alignSelf: 'flex-start',
                height: 26,
                fontSize: '0.66rem',
                fontWeight: 800,
                letterSpacing: '0.14em',
                bgcolor: '#fff',
                color: LIGHT.ink,
                border: `1px solid ${alpha(tokens.colors.pink, 0.28)}`,
                boxShadow: `0 6px 18px ${alpha(tokens.colors.pink, 0.1)}`,
                '.MuiChip-icon': { color: tokens.colors.pinkDark, ml: 0.75 },
                pr: 1.25,
              }}
            />
            <Typography
              variant="h1"
              fontWeight={900}
              sx={{
                fontSize: { xs: '2.2rem', md: '3.2rem' },
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                color: LIGHT.ink,
              }}
            >
              {content.title}
            </Typography>
            <Typography
              sx={{
                color: LIGHT.inkSoft,
                fontSize: { xs: '1rem', md: '1.1rem' },
                lineHeight: 1.65,
                maxWidth: 680,
              }}
            >
              {content.intro}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: LIGHT.inkSoft,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontSize: '0.72rem',
              }}
            >
              Last updated · {content.updatedAt}
            </Typography>
          </MotionStack>
        </Container>
      </Box>

      {/* Body */}
      <Container maxWidth="md" sx={{ pb: { xs: 10, md: 14 } }}>
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 5,
            bgcolor: LIGHT.card,
            border: `1px solid ${LIGHT.rule}`,
            boxShadow: `0 20px 48px ${alpha(tokens.colors.blue, 0.08)}`,
          }}
        >
          <Stack spacing={4}>
            {content.sections.map((section, i) => (
              <MotionBox
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4 }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: '1.2rem', md: '1.45rem' },
                    fontWeight: 800,
                    color: LIGHT.ink,
                    mb: 1.5,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {section.heading}
                </Typography>
                <Stack spacing={1.75}>
                  {section.paragraphs.map((p, j) => (
                    <Typography
                      key={j}
                      sx={{
                        color: LIGHT.ink,
                        fontSize: '0.98rem',
                        lineHeight: 1.75,
                      }}
                    >
                      {p}
                    </Typography>
                  ))}
                </Stack>
                {section.bullets && section.bullets.length > 0 && (
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    {section.bullets.map((b, k) => (
                      <Stack
                        key={k}
                        direction="row"
                        spacing={1.25}
                        alignItems="flex-start"
                      >
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: alpha(tokens.colors.pink, 0.12),
                            color: tokens.colors.pinkDark,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.25,
                          }}
                        >
                          <IconCircleCheck size={12} />
                        </Box>
                        <Typography
                          sx={{
                            color: LIGHT.ink,
                            fontSize: '0.94rem',
                            lineHeight: 1.65,
                            flex: 1,
                          }}
                        >
                          {b}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </MotionBox>
            ))}
          </Stack>
        </Box>

        {/* Footer links — cross-link between the legal pages so readers
            don't have to hop home just to reach Terms from Privacy. */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          sx={{ mt: 6, pt: 4, borderTop: `1px solid ${LIGHT.rule}` }}
        >
          <Typography
            variant="caption"
            sx={{ color: LIGHT.inkSoft, fontWeight: 600 }}
          >
            © {new Date().getFullYear()} Unicodez Softcorp · Unistack
          </Typography>
          <Stack direction="row" spacing={3}>
            {[
              { label: 'Privacy', to: '/privacy' },
              { label: 'Terms', to: '/terms' },
              { label: 'Security', to: '/security' },
              { label: 'Status', to: '/status' },
            ].map((l) => (
              <Typography
                key={l.label}
                component={RouterLink}
                to={l.to}
                variant="caption"
                sx={{
                  color: LIGHT.inkSoft,
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': { color: LIGHT.ink },
                }}
              >
                {l.label}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
