import {
  Box,
  TextField,
  Button,
  Grid,
  Link,
  Typography,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/authApi';
import { toast } from 'react-toastify';
import { iUser } from '../../Interfaces/iUser';
import { parseError } from '../../utils/utils';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
interface iProps {
  emailState: [string, React.Dispatch<React.SetStateAction<string>>];
  passwordState: [string, React.Dispatch<React.SetStateAction<string>>];
  loadingState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  onSuccess: (user: iUser, token?: string) => void;
}
const VerifyUser = ({
  emailState,
  passwordState,
  loadingState,
  onSuccess,
}: iProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = loadingState;
  const [email, setEmail] = emailState;
  const [pass, setPass] = passwordState;
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (email && pass) {
        setLoading(true);
        const { data } = await login(email, pass);
        onSuccess(data.user, data.token);
      } else {
        toast.error('Email or password missing');
      }
    } catch (error) {
      const message = parseError(error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography component="h1" variant="h5">
        Sign in
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="current-password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
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

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          Sign In
        </Button>
        <Grid container>
          <Grid size="grow">
            <Link
              onClick={() => navigate('/forgot-password')}
              variant="body2"
              sx={{ cursor: 'pointer' }}
            >
              Forgot password?
            </Link>
          </Grid>
          <Grid>
            <Link
              onClick={() => navigate('/signup')}
              sx={{ cursor: 'pointer' }}
              variant="body2"
            >
              {"Don't have an account? Sign Up"}
            </Link>
          </Grid>
        </Grid>
      </Box>{' '}
    </>
  );
};

export default VerifyUser;
