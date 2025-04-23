import { Box, TextField, Button, Typography } from '@mui/material';
import React, { ChangeEvent, FormEvent, useState } from 'react';
import { validateEmail } from '../../utils/validators';
interface iProps {
  emailState: [string, React.Dispatch<React.SetStateAction<string>>];
  onClickSendOtp: () => void;
}
const SendOTP = ({ emailState, onClickSendOtp }: iProps) => {
  const [email, setEmail] = emailState;
  const [error, setError] = useState('');

  async function HandleSendOTP(e: FormEvent) {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError('Invalid email');
      return;
    }

    onClickSendOtp();
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
