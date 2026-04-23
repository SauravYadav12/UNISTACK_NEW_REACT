import { Box, Stepper, Step, StepLabel, Link, Divider } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import Loader from '../../components/loader/Loader';
import SendOTP from '../../components/auth/SendOTP';
import VerifyOTP from '../../components/auth/VerifyOTP';
import ResetPassword from '../../components/auth/ResetPassword';
import { login, sendOtp } from '../../services/authApi';
import { toast } from 'react-toastify';
import { validateEmail } from '../../utils/validators';
import { parseError } from '../../utils/utils';
import AuthLayout from '../../components/auth/AuthLayout';
import { AnimatePresence, motion } from 'framer-motion';

const MotionBox = motion.create(Box);

enum ForgotPasswordStep {
  SendOTP = 'SendOTP',
  VerifyOTP = 'VerifyOTP',
  ResetPassword = 'ResetPassword',
}

const stepLabels = ['Email', 'Verify', 'Reset'];

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

  const activeStep = steps.indexOf(step);

  async function handleSendOTP() {
    const email = emailState[0];
    if (!validateEmail(email)) {
      toast.error('Invalid email');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(email, 'reset-password');
      toast.success('OTP sent successfully');
      setStep(ForgotPasswordStep.VerifyOTP);
    } catch (error) {
      const message: string = parseError(error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function reSendOTP() {
    await handleSendOTP();
  }

  async function onPasswordResetSuccessfull() {
    try {
      setLoading(true);
      const { data } = await login(emailState[0], passwordState[0]);
      validateLogin(data.token, data.user);
      toast.success('Login Successful');
      navigate('/dashboard');
    } catch (error) {
      const message: string = parseError(error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function onOtpVerifiedSuccessfully() {
    setStep(ForgotPasswordStep.ResetPassword);
  }

  return (
    <>
      {loading && <Loader />}
      <AuthLayout
        title="Reset password"
        subtitle="We'll help you get back in"
        chip="RECOVERY"
        eyebrow="RECOVERY MODE · VERIFYING IDENTITY"
        tagline={
          <>
            Locked out? No worries.
            <br />
            We'll send a secure code to your email and get you back in quickly.
          </>
        }
      >
        {/* Step indicator */}
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            mb: 3,
            '& .MuiStepLabel-label': { fontSize: '0.75rem' },
            '& .MuiStepIcon-root': { fontSize: '1.25rem' },
            '& .MuiStepIcon-root.Mui-active': { color: 'primary.main' },
            '& .MuiStepIcon-root.Mui-completed': { color: 'success.main' },
          }}
        >
          {stepLabels.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <AnimatePresence mode="wait">
          {step === ForgotPasswordStep.SendOTP && (
            <MotionBox
              key="send-otp"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <SendOTP emailState={emailState} onClickSendOtp={handleSendOTP} />
            </MotionBox>
          )}
          {step === ForgotPasswordStep.VerifyOTP && (
            <MotionBox
              key="verify-otp"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <VerifyOTP
                email={emailState[0]}
                onChangeEmail={() => setStep(ForgotPasswordStep.SendOTP)}
                onResendOtp={reSendOTP}
                otpState={otpState}
                loadingState={[loading, setLoading]}
                onSuccess={onOtpVerifiedSuccessfully}
              />
            </MotionBox>
          )}
          {step === ForgotPasswordStep.ResetPassword && (
            <MotionBox
              key="reset-password"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
            >
              <ResetPassword
                email={emailState[0]}
                otp={otpState[0]}
                passwordState={passwordState}
                loadingState={[loading, setLoading]}
                onSuccess={onPasswordResetSuccessfull}
              />
            </MotionBox>
          )}
        </AnimatePresence>

        {/* Back-to-login footer */}
        <Divider sx={{ mt: 3, mb: 1.5 }} />
        <Box sx={{ textAlign: 'center' }}>
          <Link
            component="button"
            type="button"
            onClick={() => navigate('/login')}
            underline="hover"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'text.secondary',
              cursor: 'pointer',
              transition: 'color 0.15s ease',
              '&:hover': { color: 'primary.main' },
            }}
          >
            <IconArrowLeft size={14} />
            Back to login
          </Link>
        </Box>
      </AuthLayout>
    </>
  );
};

export default ForgotPassword;
