/**
 * Public /download route — full-page version of the desktop-download
 * content. Kept alive so shareable external links continue to work
 * (e.g. an admin emails "https://www.unistack.in/download" to a new
 * hire). In-app affordances open the modal version via
 * DesktopDownloadContext, not this page.
 *
 * The body content is shared with the modal via DesktopDownloadContent
 * — one place to edit copy / install warnings / fetch behavior.
 */
import { Box, Container, alpha } from '@mui/material';
import { tokens } from '../../theme/theme';
import DesktopDownloadContent from '../../components/desktop/DesktopDownloadContent';

export default function DesktopDownloadPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `radial-gradient(circle at 20% -10%, ${alpha(
          tokens.colors.pink,
          0.18,
        )}, transparent 60%), radial-gradient(circle at 80% 0%, ${alpha(
          tokens.colors.blue,
          0.18,
        )}, transparent 60%), ${tokens.colors.lightBg}`,
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="md">
        <DesktopDownloadContent />
      </Container>
    </Box>
  );
}
