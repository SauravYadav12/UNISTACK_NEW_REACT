import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Grid,
  useTheme,
} from '@mui/material';
import { LockOutlined, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function RestrictedAccess() {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          background: theme.palette.background.paper,
          textAlign: 'center',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <LockOutlined
            sx={{
              fontSize: 64,
              color: theme.palette.error.main,
              mb: 2,
            }}
          />
        </Box>

        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          Access Restricted
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 3,
            color: theme.palette.text.secondary,
          }}
        >
          Your current permissions don't allow access to this resource.
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mb: 4,
            color: theme.palette.text.secondary,
          }}
        >
          Please contact your administrator to request access privileges.
        </Typography>

        <Grid container justifyContent="center">
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard')}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: theme.shadows[2],
                '&:hover': {
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              Return to Dashboard
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
