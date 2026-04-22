import { Grid, TextField } from '@mui/material';

interface iProps {
  label: string;
  width?: number | string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  selectedValue: string | number;
  type?: string;
  required?: boolean;
  error?: string | boolean;
  helperText?: string;
  /** When true, takes full width of parent Grid cell instead of fixed pixel width */
  fullWidth?: boolean;
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
  fullWidth: isFullWidth = false,
}: iProps) {
  return isFullWidth ? (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
        multiline={type !== 'number'}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            backgroundColor: disabled ? '#F6F9FC' : 'transparent',
          },
          '& .MuiInputBase-input.Mui-disabled': {
            WebkitTextFillColor: '#2A3547',
          },
        }}
      />
    </Grid>
  ) : (
    <div>
      <Grid sx={{ m: 1, width: width }}>
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
          multiline={type !== 'number'}
        />
      </Grid>
    </div>
  );
}
