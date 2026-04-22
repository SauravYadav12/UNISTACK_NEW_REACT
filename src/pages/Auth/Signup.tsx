import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Loader from '../../components/loader/Loader';
import { signup } from '../../services/authApi';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import { allowdDomains, useAuth } from '../../AuthGaurd/AuthContextProvider';
import { parseError } from '../../utils/utils';
import AuthLayout from '../../components/auth/AuthLayout';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

const initalValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  gender: '',
};

export default function SignUp() {
  const navigate = useNavigate();
  const [checked, setChecked] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [values, setValues] = React.useState(initalValues);
  const [showPassword, setShowPassword] = React.useState(false);
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
  }, []);

  const addValue = (name: string, value: string) => {
    setValues(() => ({ ...values, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      event.preventDefault();
      const checkNull = Object.values(values).filter((i) => i === '');
      if (!checkNull.length) {
        const domain = values.email?.toString().split('@')[1];
        if (!domain || !allowdDomains.includes(domain.toLowerCase())) {
          return toast.error('Invalid Email');
        }
        if (checked) {
          setLoading(true);
          const res = await signup(values);
          if (res.status === 200) {
            toast.success(res?.data?.message);
            setLoading(false);
            navigate('/');
          }
        } else {
          toast.error('Please accept the terms and conditions');
        }
      } else {
        toast.error('Please fill all the fields');
      }
    } catch (error) {
      toast.error(parseError(error));
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader />}
      <AuthLayout
        title="Create account"
        subtitle="Join the UNISTACK platform"
        chip="SIGN UP"
        eyebrow="NEW USER · PROVISIONING ACCOUNT"
        tagline={
          <>
            Let's get you set up.
            <br />
            A few quick details and you'll be ready to launch your first mission.
          </>
        }
      >
        <Box component="form" noValidate onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  autoComplete="given-name"
                  name="firstName"
                  required
                  fullWidth
                  label="First Name"
                  autoFocus
                  onChange={(e) => addValue('firstName', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  required
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  autoComplete="family-name"
                  onChange={(e) => addValue('lastName', e.target.value)}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth size="small">
              <InputLabel required>Gender</InputLabel>
              <Select
                required
                value={values.gender}
                label="Gender"
                onChange={(e) => addValue('gender', e.target.value)}
                sx={{ borderRadius: 2.5 }}
              >
                <MenuItem value="M">Male</MenuItem>
                <MenuItem value="F">Female</MenuItem>
              </Select>
            </FormControl>

            <TextField
              required
              fullWidth
              label="Email Address"
              name="email"
              autoComplete="email"
              onChange={(e) => addValue('email', e.target.value)}
            />

            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              onChange={(e) => addValue('password', e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={showPassword ? 'Hide password' : 'Show password'}>
                        <IconButton
                          onClick={() => setShowPassword((v) => !v)}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                          size="small"
                          tabIndex={-1}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  color="primary"
                  checked={checked}
                  onChange={() => setChecked(!checked)}
                  sx={{ borderRadius: 1 }}
                />
              }
              label="I agree to all the terms and conditions"
              sx={{ '& .MuiTypography-root': { fontSize: '0.8125rem' } }}
            />
          </Stack>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 2, mb: 2 }}
          >
            Sign Up
          </Button>

          <Box textAlign="center">
            <Link
              component="button"
              type="button"
              onClick={() => navigate('/')}
              variant="body2"
              underline="hover"
            >
              Already have an account? Sign in
            </Link>
          </Box>
        </Box>
      </AuthLayout>
    </>
  );
}
