import { Grid, TextField } from '@mui/material';


interface iProps{
  label: string;
  width?: number|string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  selectedValue: string | number;
  type?: string;
  required?: boolean;
  error?: string | boolean;
  helperText?: string;
}

export default function CustomTextField({
  label,
  width = 350,
  onChange,
  onBlur,
  disabled,
  selectedValue,
  type,
  required,
  error = false,
  helperText = '',
}: iProps) {
  return (
    <div>
      <Grid item sx={{ m: 1, width: width }}>
        <TextField
          label={label}
          type={type}
          value={selectedValue}
          onChange={onChange}
          onBlur={onBlur}
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
