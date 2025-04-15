import { Box, TextField, Button, Typography } from '@mui/material';
import React, { ChangeEvent, FormEvent, useState } from 'react';
import { sendOtp } from '../../services/authApi';
import { validateEmail } from '../../utils/validators';
interface iProps {
  loadingState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  emailState: [string, React.Dispatch<React.SetStateAction<string>>];
  onSuccess: () => void;
}
const SendOTP = ({ loadingState, emailState, onSuccess }: iProps) => {
  const [loading, setLoading] = loadingState;
  const [email, setEmail] = emailState;
  const [error, setError] = useState('');
  async function HandleSendOTP(e: FormEvent) {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Invalid email');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(email);
      onSuccess();
    } catch (error: any) {
      console.log(error);
      if (error.response.data.error) {
        setError(error.response.data.error);
      }
    } finally {
      setLoading(false);
    }
  }

  function onChange(e: ChangeEvent) {
    const v = (e.target as any).value;
    if (validateEmail(v)) {
      setError('');
    }
    setEmail(v);
  }

  return (
    <>
      <Typography component="h1" variant="h5">
        Forgot your password?
      </Typography>
      <Box component="form" onSubmit={HandleSendOTP} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          autoFocus
          error={!!error}
          helperText={error}
          onChange={onChange}
          value={email}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          Send OTP
        </Button>
      </Box>
    </>
  );
};

export default SendOTP;
