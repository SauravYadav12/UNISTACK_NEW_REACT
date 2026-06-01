import * as React from 'react';
import { Box } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sendOtp } from '../../services/authApi';
import { toast } from 'react-toastify';
import Loader from '../../components/loader/Loader';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import VerifyUser from '../../components/auth/VerifyUser';
import VerifyOTP from '../../components/auth/VerifyOTP';
import { validateEmail } from '../../utils/validators';
import { iUser } from '../../Interfaces/iUser';
import AuthLayout from '../../components/auth/AuthLayout';
import { AnimatePresence, motion } from 'framer-motion';

const MotionBox = motion.create(Box);

export default function Login() {
  const loginSteps = Object.values(LoginStep);
  const [step, setStep] = React.useState(loginSteps[0]);
  const emailState = React.useState('');
  const passwordState = React.useState('');
  const otpState = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [authData, setAuthData] = React.useState<AuthData>();
  const { isAuthenticated, validateLogin } = useAuth();

  // Resolve the post-login destination once. Email deep-links land here
  // with ?redirect=<encoded path+query> when ProtectedRoute intercepts
  // them; falls back to /dashboard for direct visits.
  //
  // Sanity-check the redirect target: must be a relative in-app path
  // starting with `/`, must not be `/login` itself (would loop), and
  // must not be a `//` scheme-relative URL that browsers treat as
  // external — basic open-redirect mitigation.
  const rawRedirect = searchParams.get('redirect');
  const redirectTo = React.useMemo(() => {
    if (!rawRedirect) return '/dashboard';
    if (!rawRedirect.startsWith('/')) return '/dashboard';
    if (rawRedirect.startsWith('//')) return '/dashboard';
    if (rawRedirect.startsWith('/login')) return '/dashboard';
    return rawRedirect;
  }, [rawRedirect]);

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

  async function onUserVerifiedSuccessfully(user: iUser, token?: string) {
    if (token) {
      validateLogin(token, user);
      navigate(redirectTo, { replace: true });
      toast.success('Login Successful');
      return;
    }
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
    navigate(redirectTo, { replace: true });
    toast.success('Login Successful');
  }

  React.useEffect(() => {
    // Already authenticated (same browser session, valid token in
    // localStorage) — skip the login form and forward to the intended
    // destination. This is the "I'm already logged in, why am I
    // seeing the login page?" case for email deep-links: even if
    // ProtectedRoute briefly bounced through /login during boot, the
    // useEffect catches up and forwards.
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
      return;
    }
  }, [isAuthenticated, navigate, redirectTo]);

  return (
    <>
      {loading && <Loader />}
      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to your account to continue"
      >
        <AnimatePresence mode="wait">
          {step === LoginStep.VerifyUser && (
            <MotionBox
              key="verify-user"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <VerifyUser
                emailState={emailState}
                passwordState={passwordState}
                loadingState={[loading, setLoading]}
                onSuccess={onUserVerifiedSuccessfully}
              />
            </MotionBox>
          )}

          {step === LoginStep.VerifyOTP && (
            <MotionBox
              key="verify-otp"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <VerifyOTP
                email={emailState[0]}
                loadingState={[loading, setLoading]}
                otpState={otpState}
                onChangeEmail={() => setStep(LoginStep.VerifyUser)}
                onResendOtp={resendOtp}
                onSuccess={onOtpVerifiedSuccessfully}
              />
            </MotionBox>
          )}
        </AnimatePresence>
      </AuthLayout>
    </>
  );
}

enum LoginStep {
  VerifyUser = 'VerifyUser',
  VerifyOTP = 'VerifyOTP',
}

interface AuthData {
  user: iUser;
}
