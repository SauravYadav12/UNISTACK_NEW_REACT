import { Box, TextField, Button, Typography, Grid, Link } from '@mui/material';
import React, { FormEvent, useState } from 'react';
import { verifyOtp } from '../../services/authApi';
import { toast } from 'react-toastify';
interface iProps {
  email: string;
  loadingState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  otpState: [string, React.Dispatch<React.SetStateAction<string>>];
  onChangeEmail: () => void;
  onResendOtp: () => void;
  onSuccess: (token: string) => void;
}
const VerifyOTP = ({
  email,
  loadingState,
  otpState,
  onSuccess,
  onChangeEmail,
  onResendOtp,
}: iProps) => {
  const [loading, setLoading] = loadingState;
  const [otp, setOtp] = otpState;
  const [error, setError] = useState('');

  function validateOtp(otp: string) {
    return otp.length === 6;
  }

  async function handleVerifyOTP(e: FormEvent) {
    e.preventDefault();
    if (!validateOtp(otp)) {
      setError('OTP should be 6 digits.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await verifyOtp(email, otp);
      onSuccess(data.token);
    } catch (error: any) {
      console.log(error);
      if (error?.response?.data?.error) {
        setError(error?.response?.data?.error);
        setOtp('');
      } else {
        toast.error('Failed to verify');
      }
    } finally {
      setLoading(false);
    }
  }

  function onChange(e: any) {
    const v = (e.target as any).value;
    if (validateOtp(v)) {
      setError('');
    }
    setOtp(v);
  }
  const onClickResend = () => {
    onResendOtp();
    setOtp('');
    setError('');
  };
  return (
    <>
      <Typography component="h1" variant="h5">
        Enter OTP sent to your email
      </Typography>
      <Box
        component="form"
        onSubmit={handleVerifyOTP}
        noValidate
        sx={{ mt: 1 }}
      >
        <TextField
          margin="normal"
          fullWidth
          id="otp"
          label="OTP"
          name="otp"
          autoFocus
          type="number"
          error={!!error}
          helperText={error}
          onChange={onChange}
          value={otp}
          sx={{
            '& .MuiInputBase-input': {
              textAlign: 'center',
            },
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          Verify OTP
        </Button>
        <Grid container>
          <Grid item xs>
            <Link
              onClick={onChangeEmail}
              variant="body2"
              sx={{ cursor: 'pointer' }}
            >
              Change email
            </Link>
          </Grid>
          <Grid item>
            <Link
              onClick={onClickResend}
              sx={{ cursor: 'pointer' }}
              variant="body2"
            >
              Resend OTP
            </Link>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default VerifyOTP;
