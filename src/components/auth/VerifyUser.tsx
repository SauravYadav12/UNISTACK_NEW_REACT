import { Box, TextField, Button, Grid, Link, Typography } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/authApi';
import { toast } from 'react-toastify';
import { iUser } from '../../Interfaces/iUser';
interface iProps {
  emailState: [string, React.Dispatch<React.SetStateAction<string>>];
  passwordState: [string, React.Dispatch<React.SetStateAction<string>>];
  loadingState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  onSuccess: (user: iUser) => void;
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
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (email && pass) {
        setLoading(true);
        const { data } = await login(email, pass);
        onSuccess(data.user);
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
          type="password"
          id="password"
          autoComplete="current-password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
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
      </Box>{' '}
    </>
  );
};

export default VerifyUser;
