import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import StorageIcon from '@mui/icons-material/Storage';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/authApi';
import { toast } from 'react-toastify';
import Loader from '../../components/loader/Loader';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import CopyRight from '../../components/auth/CopyRight';

function Copyright(props: any) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {'Copyright © '}
      <Link color="inherit" target="_blank" href="https://www.unicodez.com/">
        Unicodez Inc
      </Link>
      {' 2025.'}
    </Typography>
  );
}

// TODO remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme();
export default function Login() {
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const { validateLogin, isAuthenticated } = useAuth();

  React.useEffect((): any => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const data = new FormData(event.currentTarget);
      const email = data.get('email')?.toString();
      const pass = data.get('password')?.toString();
      if (email && pass) {
        setLoading(true);
        const { data } = await login(email, pass);
        validateLogin(data.token, data.user);
        toast.success('Login Successfull');
        navigate('/dashboard');
      } else {
        toast.error('Email or password missing');
      }
    } catch (error: any) {
      const message: any = error?.response?.data?.message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader />}
      <ThemeProvider theme={defaultTheme}>
        <Container component="main" maxWidth="xs">
          <CssBaseline />
          <Box
            sx={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: '#EC4599', width: 56, height: 56 }}>
              <StorageIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign in
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
              />
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
              <Grid container>
                <Grid item xs>
                  <Link
                    onClick={() => navigate('/forgot-password')}
                    variant="body2"
                    sx={{ cursor: 'pointer' }}
                  >
                    Forgot password?
                  </Link>
                </Grid>
                <Grid item>
                  <Link
                    onClick={() => navigate('/signup')}
                    sx={{ cursor: 'pointer' }}
                    variant="body2"
                  >
                    {"Don't have an account? Sign Up"}
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
          <CopyRight />
        </Container>
      </ThemeProvider>
    </>
  );
}
