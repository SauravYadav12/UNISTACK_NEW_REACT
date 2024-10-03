import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

export default function CustomSelectField({label, valueOptions, selectedValue, onChange}: any) {
   
    const handleChange = (event: any) => {
        onChange(event.target.value);
      };

  return (
    <div>
      <FormControl sx={{ m: 1, width: 350 }}>
        <InputLabel id="demo-multiple-name-label">{label}</InputLabel>
        <Select
          value={selectedValue}
          onChange={handleChange}
          label={label}
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
      </FormControl>
    </div>
  )
}

