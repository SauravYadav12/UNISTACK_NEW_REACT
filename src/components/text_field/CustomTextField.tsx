import { Grid, TextField } from "@mui/material";

export default function CustomTextField({label, placeholder, width = 350, rows, selectedValue, onChange}: any) {
  return (
    <div>
        <Grid item sx={{ m: 1, width: width }}>
          <TextField label={label} placeholder={placeholder} value={selectedValue} onChange={onChange} fullWidth size="small" sx={{'& .MuiOutlinedInput-root':{ borderRadius: '10px' }}} rows={rows} multiline/>
        </Grid>
    </div>
  )
}
