import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from "@mui/material";

export default function CustomSelectField({label, valueOptions, selectedValue, onChange, width= 300, disabled, error, helperText }: any) {
   
    const handleChange = (event: any) => {
        onChange(event.target.value);
      };

  return (
    <div>
      <FormControl sx={{ m: 1, width: width }} size="small" fullWidth error={!!error}>
        <InputLabel id="demo-multiple-name-label" sx={{ color: error ? 'red' : '' }}>{label}</InputLabel>
        <Select
          value={selectedValue}
          onChange={handleChange}
          label={label}
          disabled={disabled}
          // sx={{ borderRadius: '10px' }}
          sx={{
            borderRadius: '10px',
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: error ? 'red' : '' // Red outline on error
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: error ? 'red' : ''
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: error ? 'red' : ''
            },
            "& .MuiSelect-root": {
              color: error ? 'red' : 'inherit' // Red text on error
            }
          }}
        >
          {valueOptions.map((option: any) => (
            <MenuItem
              key={option}
              value={option}
            >
              {option}
            </MenuItem>
          ))}
        </Select>
        {error && <FormHelperText>{helperText}</FormHelperText>} {/* Display error text */}
      </FormControl>
    </div>
  )
}

