import { Grid, TextField } from "@mui/material";

export default function CustomTextField({label, placeholder}: any) {
  return (
    <div>
        <Grid item sx={{ m: 1, width: 350 }}>
          <TextField label={label} placeholder={placeholder} fullWidth />
        </Grid>
    </div>
  )
}
