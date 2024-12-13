import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import StorageIcon from "@mui/icons-material/Storage";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Loader from "../../components/loader/Loader";
import { signup } from "../../services/authApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useAuth } from "../../AuthGaurd/AuthContextProvider";

function Copyright(props: any) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="https://mui.com/">
        Unicodez Inc
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

// TODO remove, this demo shouldn't need to reset the theme.
const defaultTheme = createTheme();

const initalValues: any = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  gender:"",
};

export default function SignUp() {
  const navigate = useNavigate();
  const [checked, setChecked] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [values, setValues] = React.useState(initalValues);
  const { isAuthenticated } = useAuth();
  React.useEffect((): any => {
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }
  }, []);

  const addValue = (name: string, value: string) => {
    setValues(() => ({ ...values, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    try {
      event.preventDefault();
      const checkNull = Object.values(values).filter(i=> i === "")
      if (!checkNull.length){
        const domain = values.email?.toString().split("@")[1];
        if (domain?.toLowerCase() !== "unicodez.com") {
          return toast.error("Invalid Email");
        }
        if (checked) {
          setLoading(true);
          const res: any = await signup(values);
          if (res.status === 200) {
            toast.success(res?.data?.message);
            setLoading(false);
            navigate("/");
          }
        } else {
          toast.error("Please accept the terms and condition");
        }
      } else {
        toast.error("Please fill all the fields");
      }
    } catch (error: any) {
      const message: any = error?.response?.data?.message;
      toast.error(message);
      setLoading(false);
    }
  };

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
            <Avatar
              sx={{
                m: 1,
                bgcolor: 'white',
                width: 80,
                height: 80,
                border: '1px solid #eeee',
              }}
            >
              {/* <StorageIcon /> */}
              <img
                src="src/assets/unistack_icon.png"
                alt=""
                width={'100%'}
                style={{ paddingTop: '8px' }}
              />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign up
            </Typography>
            <Box
              component="form"
              noValidate
              onSubmit={handleSubmit}
              sx={{ mt: 3 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    autoComplete="given-name"
                    name="firstName"
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    autoFocus
                    onChange={(e) => addValue('firstName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    autoComplete="family-name"
                    onChange={(e) => addValue('lastName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel required>Gender</InputLabel>
                    <Select
                      required
                      value={values.gender}
                      label="Gender"
                      onChange={(e) => addValue('gender', e.target.value)}
                    >
                      <MenuItem value={'M'}>Male</MenuItem>
                      <MenuItem value={'F'}>Female</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    onChange={(e) => addValue('email', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    onChange={(e) => addValue('password', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        color="primary"
                        value="acceptTerms"
                        checked={checked}
                        onChange={() => setChecked(!checked)}
                      />
                    }
                    label="I agree to all the terms and conditions of the platform."
                    required
                  />
                </Grid>
              </Grid>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign Up
              </Button>
              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Link href="/" variant="body2">
                    Already have an account? Sign in
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
          <Copyright sx={{ mt: 5 }} />
        </Container>
      </ThemeProvider>
    </>
  );
}
