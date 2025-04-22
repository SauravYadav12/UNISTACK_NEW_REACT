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
import { login, sendOtp } from '../../services/authApi';
import { toast } from 'react-toastify';
import Loader from '../../components/loader/Loader';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import CopyRight from '../../components/auth/CopyRight';
import VerifyUser from '../../components/auth/VerifyUser';
import VerifyOTP from '../../components/auth/VerifyOTP';
import { validateEmail } from '../../utils/validators';
import { jUser } from '../../Interfaces/iUser';

const defaultTheme = createTheme();
export default function Login() {
  const loginSteps = Object.values(LoginStep);
  const [step, setStep] = React.useState(loginSteps[0]);
  const emailState = React.useState('');
  const passwordState = React.useState('');
  const otpState = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const { isAuthenticated ,validateLogin} = useAuth();

  async function sendOTP() {
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

  async function resendOtp() {
    await sendOTP();
  }

  function onOtpVerifiedSuccessfully() {
    toast.success('Login Successfull');
    navigate('/dashboard');
  }
  function onUserVerifiedSuccessfully(token:string,user:jUser) {
    validateLogin(token, user);
  }

  React.useEffect((): any => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
  }, []);

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

            {step === LoginStep.VerifyUser && (
              <VerifyUser
                emailState={emailState}
                passwordState={passwordState}
                loadingState={[loading, setLoading]}
                onSuccess={() => setStep(LoginStep.VerifyOTP)}
              />
            )}

            {step === LoginStep.VerifyOTP && (
              <VerifyOTP
                email={emailState[0]}
                loadingState={[loading, setLoading]}
                otpState={otpState}
                onChangeEmail={() => setStep(LoginStep.VerifyUser)}
                onResendOtp={resendOtp}
                onSuccess={onOtpVerifiedSuccessfully}
              />
            )}
          </Box>
          <CopyRight />
        </Container>
      </ThemeProvider>
    </>
  );
}

enum LoginStep {
  VerifyUser = 'VerifyUser',
  VerifyOTP = 'VerifyOTP',
}
