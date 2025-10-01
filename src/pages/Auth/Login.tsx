import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import StorageIcon from '@mui/icons-material/Storage';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { sendOtp } from '../../services/authApi';
import { toast } from 'react-toastify';
import Loader from '../../components/loader/Loader';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import CopyRight from '../../components/auth/CopyRight';
import VerifyUser from '../../components/auth/VerifyUser';
import VerifyOTP from '../../components/auth/VerifyOTP';
import { validateEmail } from '../../utils/validators';
import { iUser } from '../../Interfaces/iUser';

const defaultTheme = createTheme();
export default function Login() {
  const loginSteps = Object.values(LoginStep);
  const [step, setStep] = React.useState(loginSteps[0]);
  const emailState = React.useState('');
  const passwordState = React.useState('');
  const otpState = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const [authData, setAuthData] = React.useState<AuthData>();
  const { isAuthenticated, validateLogin } = useAuth();

  async function handleSendOTP() {
    const email = emailState[0];
    if (!validateEmail(email)) {
      toast.error('Invalid email');
      return;
    }
    try {
      const t = setTimeout(() => {
        setLoading(true);
        clearTimeout(t);
      }, 100);
      await sendOtp(email, 'login');
      toast.success('OTP sent successfully');
      setStep(LoginStep.VerifyOTP);
    } catch (error) {
      console.log(error);
      toast.error('Failed to resend');
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    await handleSendOTP();
  }

  async function onUserVerifiedSuccessfully(user: iUser) {
    await handleSendOTP();
    setAuthData({ user });
  }

  function onOtpVerifiedSuccessfully(token: string) {
    if (!authData) {
      toast.error('Missing token');
      return;
    }
    const { user } = authData;
    validateLogin(token, user);
    navigate('/dashboard');
    toast.success('Login Successfull');
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
                onSuccess={onUserVerifiedSuccessfully}
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

interface AuthData {
  user: any;
}
