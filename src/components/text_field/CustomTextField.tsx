import { Grid, TextField } from '@mui/material';

export default function CustomTextField({
  label,
  width = 350,
  onChange,
  disabled,
  selectedValue,
  type,
  required,
  error = false,
  helperText = '',
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
          error={Boolean(error)}
          helperText={helperText}
          required={required}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              backgroundColor: disabled ? '#f0f0f0' : 'transparent',
            },
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: 'black',
              backgroundColor: '#f0f0f0',
            },
          }}
          multiline={type === 'number' ? false : true}
        />
      </Grid>
    </div>
  );
}
