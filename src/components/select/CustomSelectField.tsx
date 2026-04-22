import {
  Autocomplete,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { useEffect, useState, type FocusEvent } from 'react';

interface iProps {
  label: string;
  valueOptions: string[];
  selectedValue: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  width?: number;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  /** When true, allows any typed string (MUI Autocomplete freeSolo), not only list options */
  freeSolo?: boolean;
  /** When true, takes full width of parent instead of fixed pixel width */
  fullWidth?: boolean;
  /** When true, renders a red asterisk on the label to signal a required field. */
  required?: boolean;
}

const outlinedFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
  },
  '& .MuiInputBase-root.MuiOutlinedInput-root.Mui-disabled': {
    backgroundColor: '#f0f0f0',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'inherit',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'inherit',
  },
  '& .MuiInputBase-input.Mui-disabled': {
    WebkitTextFillColor: 'black',
    backgroundColor: '#f0f0f0',
    borderRadius: '10px',
    textOverflow: 'clip',
    whiteSpace: 'normal',
    overflow: 'visible',
  },
} as const;

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
  freeSolo = false,
  fullWidth: isFullWidth = false,
  required = false,
}: iProps) {
  const containerSx = isFullWidth ? { width: '100%' } : { m: 1, width };
  const [inputValue, setInputValue] = useState(selectedValue);

  useEffect(() => {
    setInputValue(selectedValue);
  }, [selectedValue]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  if (freeSolo) {
    return (
      <div style={isFullWidth ? { width: '100%' } : undefined}>
        <Autocomplete
          freeSolo
          fullWidth={isFullWidth}
          options={valueOptions}
          value={selectedValue}
          inputValue={inputValue}
          disabled={disabled}
          onInputChange={(_, newInputValue, reason) => {
            if (reason === 'reset') {
              setInputValue(selectedValue);
              return;
            }
            setInputValue(newInputValue);
          }}
          onChange={(_, newValue) => {
            const v = newValue == null ? '' : String(newValue);
            onChange(v);
          }}
          sx={containerSx}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              required={required}
              size="small"
              error={!!error}
              helperText={error ? helperText : undefined}
              multiline={disabled}
              minRows={disabled ? 1 : undefined}
              maxRows={disabled ? 16 : undefined}
              InputProps={{
                ...params.InputProps,
              }}
              inputProps={{
                ...params.inputProps,
              }}
              sx={{
                ...outlinedFieldSx,
                ...(disabled && {
                  '& .MuiOutlinedInput-root': { alignItems: 'flex-start', borderRadius: '10px', },
                }),
              }}
              onBlur={(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                params.inputProps.onBlur?.(
                  e as FocusEvent<HTMLInputElement>
                );
                const raw = (e.target as HTMLInputElement).value ?? '';
                if (raw !== selectedValue) {
                  onChange(raw);
                }
                if (raw !== inputValue) {
                  setInputValue(raw);
                }
                onBlur?.();
              }}
            />
          )}
        />
      </div>
    );
  }

  return (
    <div style={isFullWidth ? { width: '100%' } : undefined}>
      <FormControl
        sx={containerSx}
        size="small"
        fullWidth={isFullWidth}
        error={!!error}
        required={required}
      >
        <InputLabel
          id="demo-multiple-name-label"
          required={required}
          sx={{ color: error ? 'red' : '' }}
        >
          {label}
        </InputLabel>
        <Select
          value={selectedValue || ''}
          onBlur={onBlur}
          onChange={handleChange}
          label={label}
          disabled={disabled}
          required={required}
          sx={{
            borderRadius: '10px',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: error ? 'red' : '',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: error ? 'red' : '',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: error ? 'red' : '',
            },
            '& .MuiSelect-root': {
              color: error ? 'red' : 'inherit',
            },
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
