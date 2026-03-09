import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';


interface iProps{
  label: string;
  valueOptions: string[];
  selectedValue: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  width?: number;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

export default function CustomSelectField({
  label,
  valueOptions,
  selectedValue,
  onChange,
  onBlur,
  width = 300,
  disabled,
  error,
  helperText,
}: iProps) {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  return (
    <div>
      <FormControl
        sx={{ m: 1, width: width }}
        size="small"
        fullWidth
        error={!!error}
      >
        <InputLabel
          id="demo-multiple-name-label"
          sx={{ color: error ? 'red' : '' }}
        >
          {label}
        </InputLabel>
        <Select
          value={selectedValue||''}
          onBlur={onBlur}
          onChange={handleChange}
          label={label}
          disabled={disabled}
          // sx={{ borderRadius: '10px' }}
          sx={{
            borderRadius: '10px',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: error ? 'red' : '', // Red outline on error
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: error ? 'red' : '',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: error ? 'red' : '',
            },
            '& .MuiSelect-root': {
              color: error ? 'red' : 'inherit', // Red text on error
            },
            // '& .Mui-disabled': {
            //   color: 'black',
            // },
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: 'black',
              backgroundColor: '#f0f0f0',
              borderRadius: '10px',
            },
          }}
        >
          {valueOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
        {error && <FormHelperText>{helperText}</FormHelperText>}{' '}
      </FormControl>
    </div>
  );
}
