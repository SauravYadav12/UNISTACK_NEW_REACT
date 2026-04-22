import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import React, { FormEvent, useState } from 'react';
import { resetPassword } from '../../services/authApi';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
interface iProps {
  otp: string;
  email: string;
  passwordState: [string, React.Dispatch<React.SetStateAction<string>>];
  loadingState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
  onSuccess: () => void;
}
const ResetPassword = ({
  email,
  otp,
  passwordState,
  loadingState,
  onSuccess,
}: iProps) => {
  const [loading, setLoading] = loadingState;
  const [password, setPassword] = passwordState;
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState({
    password: '',
    confirmPassword: '',
  });

  function validatePassword(pass: string) {
    return pass.length >= 6;
  }
  function validateConfirmPassword(pass: string) {
    return password === pass;
  }

  function validateForm() {
    let res = true;
    if (!validatePassword(password)) {
      res = false;
      setError((pre) => ({
        ...pre,
        password: 'Minimum 6 characters are required',
      }));
    }

    if (!validateConfirmPassword(confirmPassword)) {
      res = false;
      setError((pre) => ({
        ...pre,
        confirmPassword: 'Should be same as password',
      }));
    }
    return res;
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      await resetPassword(password, email, otp);
      onSuccess();
    } catch (error) {
      console.log(error);
    } finally {
      // setLoading(false);
    }
  }

  function onChangePassword(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (validatePassword(v)) {
      setError((pre) => ({ ...pre, password: '' }));
    }
    setPassword(v);
  }
  function onChangeConfirmPassword(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (validateConfirmPassword(v)) {
      setError((pre) => ({ ...pre, confirmPassword: '' }));
    }
    setConfirmPassword(v);
  }

  return (
    <>
      <Typography component="h1" variant="h5">
        Set new password
      </Typography>
      <Box
        component="form"
        onSubmit={handleResetPassword}
        noValidate
        sx={{ mt: 1 }}
      >
        <TextField
          margin="normal"
          fullWidth
          id="new-password"
          label="New password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoFocus
          autoComplete="new-password"
          error={!!error.password}
          helperText={error.password}
          onChange={onChangePassword}
          value={password}
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
        <TextField
          margin="normal"
          fullWidth
          id="confirm-new-password"
          label="Confirm new password"
          name="new-password"
          type={showConfirm ? 'text' : 'password'}
          autoComplete="new-password"
          error={!!error.confirmPassword}
          helperText={error.confirmPassword}
          onChange={onChangeConfirmPassword}
          value={confirmPassword}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={showConfirm ? 'Hide password' : 'Show password'}>
                    <IconButton
                      onClick={() => setShowConfirm((v) => !v)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      size="small"
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <IconEyeOff size={18} /> : <IconEye size={18} />}
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
          Reset password
        </Button>
      </Box>
    </>
  );
};

export default ResetPassword;
