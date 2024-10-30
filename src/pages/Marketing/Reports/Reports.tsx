import { Box, Button, Grid, Typography } from "@mui/material";
import CustomAccordion from "../../../components/accordion/CustomAccordion";
import ReportsAccordionContent from "./ReportsAccordionContent";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { useState } from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, {Dayjs} from 'dayjs'


const initialValues = {
  fromDate: null,
  toDate: null,

}

export default function Reports() {

    const [values, setValues] = useState(initialValues);
    const [fromDate, setFromwDate] = useState<Dayjs | null>();
    const [toDate, setToDate] = useState<Dayjs | null>();

    const addValue = (key: any, newValue: any) => {
      if (key === 'fromDate') {
          const formattedDate = newValue ? dayjs(newValue).format('YYYY-MM-DD') : null;
          setValues((prevValues) => ({
              ...prevValues,
              [key]: formattedDate // Save the formatted date
          }));
      } else if (key === 'toDate') {
        const formattedDate = newValue ? dayjs(newValue).format('YYYY-MM-DD') : null;
        setValues((prevValues) => ({
            ...prevValues,
            [key]: formattedDate // Save the formatted date
        }));
      } else {
        setValues((prevValues) => ({
            ...prevValues,
            [key]: newValue
        }));
    }

    }

  return (
    <>
    <div>
      <Box mb={2}>
      <Grid container alignItems="center" justifyContent="space-between" spacing={1}>

        <Grid item sx={{ flexGrow: 1, textAlign: 'left' }}>
                <Typography variant="h6" component="span" fontWeight="bold">
                    Reports: 
                </Typography>
                <Typography component="span" sx={{ mx: 1 }}>
                     From {values.fromDate ? values.fromDate : "____-__-__"}
                </Typography>
                <Typography component="span">
                     To {values.toDate ? values.toDate : "____-__-__"}
                </Typography>
                <Box mt={1}>
                  <Typography>Total Position: 0</Typography>
                </Box>
          </Grid>

        <Grid item sx={{width: 190, mr:1}}>
            <LocalizationProvider dateAdapter={AdapterDayjs} >
                <DatePicker
                      label="From Date"
                      value={fromDate}
                      onChange={(newValue) => addValue("fromDate",newValue)} // Handle date change
                      slotProps={{ 
                        textField: {
                          fullWidth:true,
                          size:"small",
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px', // same border-radius
                            },
                          } } }}
                          />
            </LocalizationProvider>
      </Grid>
      <Grid item sx={{width: 190, mr:1}}>
            <LocalizationProvider dateAdapter={AdapterDayjs} >
                <DatePicker
                      label="To Date"
                      value={toDate}
                      onChange={(newValue) => addValue("toDate",newValue)} // Handle date change
                      slotProps={{ 
                        textField: {
                          fullWidth:true,
                          size:"small",
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px', // same border-radius
                            },
                          } } }}
                          />
              </LocalizationProvider>
        </Grid>
        <Grid item>
            <Button variant="contained" size="small"
              sx={{
              marginRight:1,
              width: 100,        // Match the width of DatePicker
              borderRadius: '10px', // Same border-radius as DatePicker
              height: '40px',    // Adjust height for consistency
          }}
            >
                  Generate
            </Button>
        </Grid>
      </Grid>
      </Box>
    </div>
    <div>
      <Box mb={1}>
      <CustomAccordion title="Saurav Yadav">
        <ReportsAccordionContent />
      </CustomAccordion>
      </Box>
      <Box mt={1}>
      <CustomAccordion title="Navendra Yadav">
        <ReportsAccordionContent />
      </CustomAccordion>
      </Box>
    </div>
    </>
    
  )
}