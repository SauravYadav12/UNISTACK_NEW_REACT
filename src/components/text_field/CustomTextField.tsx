import { Grid, TextField } from '@mui/material';

export default function CustomTextField({
  label,
  width = 350,
  onChange,
  disabled,
  selectedValue,
  type,
  required,
  error,
  helperText,
}: any) {
  return (
    <div>
      <Grid item sx={{ m: 1, width: width }}>
        <TextField
          label={label}
          type={type}
          value={selectedValue}
          onChange={onChange}
          disabled={disabled}
          fullWidth
          error={error}
          helperText={helperText}
          required={required}
          size="small"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          multiline={type === 'number' ? false : true}
        />
      </Grid>
    </div>
  );
}
