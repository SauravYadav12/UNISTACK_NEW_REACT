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
import { useNavigate } from "react-router-dom";
import { login } from "../../services/authApi";
import { toast } from "react-toastify";
import Loader from "../../components/loader/Loader";
import { useAuth } from "../../AuthGaurd/AuthContextProvider";
import { Token } from "@mui/icons-material";

function Copyright(props: any) {
  const navigate = useNavigate();

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
export default function Login() {
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const { validateLogin, isAuthenticated } = useAuth();

  React.useEffect((): any => {
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const data = new FormData(event.currentTarget);

      if (data.get("email") && data.get("password")) {
        setLoading(true);
        const res: any = await login(data);
        if (res.status === 200 && res.data?.token) {
          localStorage.setItem("token", res.data?.token);
          localStorage.setItem("user", JSON.stringify(res.data?.user));
          validateLogin(res.data?.token);
          toast.success("Login Successfull");
          setLoading(false);
          navigate("/dashboard");
        }
      } else {
        toast.error("Email or password missing");
        setLoading(false);
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
              Sign in
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
              sx={{ mt: 1 }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
              />
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Remember me"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
              <Grid container>
                <Grid item xs>
                  <Link href="#" variant="body2">
                    Forgot password?
                  </Link>
                </Grid>
                <Grid item>
                  <Link href="/signup" variant="body2">
                    {"Don't have an account? Sign Up"}
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
          <Copyright sx={{ mt: 8, mb: 4 }} />
        </Container>
      </ThemeProvider>
    </>
  );
}
