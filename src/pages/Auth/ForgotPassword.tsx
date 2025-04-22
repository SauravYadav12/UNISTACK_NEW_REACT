import {
  Avatar,
  Box,
  Container,
  createTheme,
  CssBaseline,
  ThemeProvider,
} from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import StorageIcon from '@mui/icons-material/Storage';
import Loader from '../../components/loader/Loader';
import CopyRight from '../../components/auth/CopyRight';
import SendOTP from '../../components/auth/SendOTP';
import VerifyOTP from '../../components/auth/VerifyOTP';
import ResetPassword from '../../components/auth/ResetPassword';
import { login, sendOtp } from '../../services/authApi';
import { toast } from 'react-toastify';
import { validateEmail } from '../../utils/validators';
const defaultTheme = createTheme();

enum ForgotPasswordStep {
  SendOTP = 'SendOTP',
  VerifyOTP = 'VerifyOTP',
  ResetPassword = 'ResetPassword',
}

const ForgotPassword = () => {
  const steps = [
    ForgotPasswordStep.SendOTP,
    ForgotPasswordStep.VerifyOTP,
    ForgotPasswordStep.ResetPassword,
  ];
  const [loading, setLoading] = React.useState(false);
  const emailState = React.useState('');
  const otpState = React.useState('');
  const passwordState = React.useState('');
  const [step, setStep] = React.useState(steps[0]);
  const navigate = useNavigate();
  const { validateLogin } = useAuth();

  async function handleResendOTP() {
    const email = emailState[0];
    if (!validateEmail(email)) {
      toast.error('Invalid email');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(email);
      toast.success('OTP sent successfully');
    } catch (error) {
      console.log(error);
      toast.error('Failed to resend');
    } finally {
      setLoading(false);
    }
  }

  async function onPasswordResetSuccessfull() {
    try {
      setLoading(true);
      const { data } = await login(emailState[0], passwordState[0]);
      validateLogin(data.token, data.user);
      toast.success('Login Successfull');
      navigate('/dashboard');
    } catch (error: any) {
      const message: any = error?.response?.data?.message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function onOtpSentSuccessfully() {
    setStep(ForgotPasswordStep.VerifyOTP);
  }
  function onOtpVerifiedSuccessfully() {
    setStep(ForgotPasswordStep.ResetPassword);
  }

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

            {step === ForgotPasswordStep.SendOTP && (
              <SendOTP
                emailState={emailState}
                loadingState={[loading, setLoading]}
                onSuccess={onOtpSentSuccessfully}
              />
            )}
            {step === ForgotPasswordStep.VerifyOTP && (
              <VerifyOTP
                email={emailState[0]}
                onChangeEmail={() => setStep(ForgotPasswordStep.SendOTP)}
                onResendOtp={handleResendOTP}
                otpState={otpState}
                loadingState={[loading, setLoading]}
                onSuccess={onOtpVerifiedSuccessfully}
              />
            )}
            {step === ForgotPasswordStep.ResetPassword && (
              <ResetPassword
                email={emailState[0]}
                otp={otpState[0]}
                passwordState={passwordState}
                loadingState={[loading, setLoading]}
                onSuccess={onPasswordResetSuccessfull}
              />
            )}
          </Box>

          <CopyRight />
        </Container>
      </ThemeProvider>
    </>
  );
};

export default ForgotPassword;
