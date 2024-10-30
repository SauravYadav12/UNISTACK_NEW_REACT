import { Button, Grid } from "@mui/material"
import { useState } from "react"
import CustomTextField from "../../../components/text_field/CustomTextField"
import CustomSelectField from "../../../components/select/CustomSelectField"
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers'
import  dayjs, {Dayjs} from 'dayjs'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { intDurationOptions, intModeOptions, intRoundOptions, intStatusOptions, intTypeOptions, intWithOptions, meetingTypeOptions, paymentStatusOptions, resultOptions, timeZoneOptions } from "./testAndViValues"


const initialValues = {
    timeShift: "",
    timeZone: "",
    intType: "",
    intStatus: "",
    intWith: "",
    intResult: "",
    round: "",
    intMode: "",
    meetingType: "",
    intDuration: "",
    interviewDate: null,
    interviewTime: null,
    consultant: "",
    maketingPerson: "",
    vendorCompany: "",
    primeVendorCompany: "",
    submittedAnyCode: "",
    tentativeReason: "",
    remarks: "",
    subjectLine: "",
    interviewModeDetails: "",
    interviewLink: "",
    interviewFocus: "",
    specialNote: "",
    feedback: "",
    jobTitle: "",
    reqID: "",
    clientName: "",
    taxType: "",
    duration: "",
    candidateName: "",
    ratesForInterview: "",
    paymentStatus: "",

}


export default function InterviewForm({handleCloseForm}: any) {

    const [values, setValues] = useState(initialValues);
    const [interviewDate, setInterviewDate] = useState<Dayjs | null>();
    const [interviewTime, setInterviewTime] = useState<Dayjs | null>();



      const addValue = (key: any, newValue: any) => {
        if (key === 'interviewDate') {
            const formattedDate = newValue ? dayjs(newValue).format('YYYY-MM-DD') : null;
            setValues((prevValues) => ({
                ...prevValues,
                [key]: formattedDate // Save the formatted date
            }));
        } 
        else if (key === 'interviewTime') {
            const formattedTime = newValue ? dayjs(newValue).format('hh:mm:ss A') : null;
            setValues((prevValues) => ({
                ...prevValues,
                [key]: formattedTime // Save the formatted time
            }));
        } 
        else {
            setValues((prevValues) => ({
                ...prevValues,
                [key]: newValue
            }));
        }
    };

      function handleSubmitForm(event: any) {
        event.preventDefault();
        console.log("Interview Form submitted successfully", values)
    }

    function handleChange(event: any, key: string) {
        setValues((prev) => ({ ...prev, [key]: event.target.value }));
    }

  return (
        <form style={{ margin: '0 20px' }}>
            <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
          {/* Section 1: Interview Details */}
            <Grid item xs={12}>
              <h4>1. Interview Details</h4>
            </Grid>
                <Grid item sx={{width: 190, mr:1}}>
                    <LocalizationProvider dateAdapter={AdapterDayjs} >
                        <DatePicker
                            label="Interview Date"
                            value={interviewDate}
                            onChange={(newValue) => addValue("interviewDate",newValue)} // Handle date change
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
                        <TimePicker
                            label="Interview Time"
                            value={interviewTime}
                            onChange={(newValue) => addValue("interviewTime",newValue)} // Handle date change
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
                <CustomSelectField
                label="Time Zone"
                valueOptions={timeZoneOptions} 
                selectedValue={values.timeZone}
                onChange={(value: any)=> handleChange({ target: { value } }, "timeZone")} 
                width={180}
                />
                <CustomSelectField
                label="Interview Type" 
                valueOptions={intTypeOptions} 
                selectedValue={values.intType}
                onChange={(value: any)=> handleChange({ target: { value } }, "intType")}
                width={180}
                />
                <CustomSelectField 
                label="Interview Status" 
                valueOptions={intStatusOptions} 
                selectedValue={values.intStatus}
                onChange={(value: any)=> handleChange({ target: { value } }, "intStatus")}
                width={180}
                />
                <CustomTextField 
                label="Consultant" width={230}
                selectedValue={values.consultant}
                onChange={(event: any) => addValue("consultant", event.target.value)}
                />
                <CustomTextField 
                label="Maketing Person" width={230}
                selectedValue={values.maketingPerson}
                onChange={(event: any) => addValue("maketingPerson", event.target.value)}
                />
                <CustomTextField 
                label="Vendor Company" width={230}
                selectedValue={values.vendorCompany}
                onChange={(event: any) => addValue("vendorCompany", event.target.value)}
                />
                <CustomTextField 
                label="Prime Vendor Company" width={230}
                selectedValue={values.primeVendorCompany}
                onChange={(event: any) => addValue("primeVendorCompany", event.target.value)}
                />
                <CustomSelectField 
                label="Interview With" 
                valueOptions={intWithOptions} 
                selectedValue={values.intWith}
                onChange={(value: any)=> handleChange({ target: { value } }, "intWith")}
                width={230}
                />
                <CustomTextField 
                label="Submitted Any Code(if Yes Enter the Link)" width={230}
                selectedValue={values.submittedAnyCode}
                onChange={(event: any) => addValue("submittedAnyCode", event.target.value)}
                />
                <CustomSelectField 
                label="Result" 
                valueOptions={resultOptions} 
                selectedValue={values.intResult}
                onChange={(value: any)=> handleChange({ target: { value } }, "intResult")}
                width={230}
                />
                <CustomSelectField 
                label="Interview Round" 
                valueOptions={intRoundOptions} 
                selectedValue={values.round}
                onChange={(value: any)=> handleChange({ target: { value } }, "intResult")}
                width={230}
                />
                <CustomTextField 
                label="Tentative Reason (if Any)" width={230}
                selectedValue={values.tentativeReason}
                onChange={(event: any) => addValue("tentativeReason", event.target.value)}
                />
                <CustomSelectField 
                label="Interview via Mode" 
                valueOptions={intModeOptions} 
                selectedValue={values.intMode}
                onChange={(value: any)=> handleChange({ target: { value } }, "intMode")}
                width={230}
                />
                <CustomSelectField 
                label="Meeting type" 
                valueOptions={meetingTypeOptions} 
                selectedValue={values.meetingType}
                onChange={(value: any)=> handleChange({ target: { value } }, "meetingType")}
                width={230}
                />
                <CustomSelectField 
                label="Interview Duration" 
                valueOptions={intDurationOptions} 
                selectedValue={values.intDuration}
                onChange={(value: any)=> handleChange({ target: { value } }, "intDuration")}
                width={230}
                />
                <CustomTextField 
                    label="Remarks/Comments (if negative / if on hold / If anything else? Why?)"
                    multiline
                    rows={2}
                    width={970}
                    selectedValue={values.remarks}
                    onChange={(event: any) => addValue("remarks", event.target.value)}
                    />

            <Grid item xs={12}>
              <h4>2. Details of Interview</h4>
            </Grid>
              <CustomTextField 
                      label="Subject line (Enter Duration + Mode Of Interview + Interview With only)"
                      multiline
                      rows={1}
                      width={970}
                      selectedValue={values.subjectLine}
                      onChange={(event: any) => addValue("subjectLine", event.target.value)}
                      />
              <CustomTextField 
                      label="Interview / interviewer / Interview Mode Details"
                      multiline
                      rows={2}
                      width={970}
                      selectedValue={values.interviewModeDetails}
                      onChange={(event: any) => addValue("interviewModeDetails", event.target.value)}
                      />
              <CustomTextField 
                      label="Interview Link"
                      multiline
                      rows={1}
                      width={970}
                      selectedValue={values.interviewLink}
                      onChange={(event: any) => addValue("interviewLink", event.target.value)}
                      />
              <CustomTextField 
                      label="Interview Focus"
                      multiline
                      rows={1}
                      width={970}
                      selectedValue={values.interviewFocus}
                      onChange={(event: any) => addValue("interviewFocus", event.target.value)}
                      />
              <CustomTextField 
                      label="Special Note"
                      multiline
                      rows={1}
                      width={970}
                      selectedValue={values.specialNote}
                      onChange={(event: any) => addValue("specialNote", event.target.value)}
                      />

            {/* Section 3: Interview Feedback */}
            <Grid item xs={12}>
              <h4>3. Interview Feedback</h4>
            </Grid>
                <CustomTextField label="Feedback" 
                width={970}
                multiline
                rows={2}
                selectedValue={values.feedback}
                onChange={(event: any) => addValue("feedback", event.target.value)}
                />
                <CustomTextField label="Job Title" width={180}
                selectedValue={values.jobTitle}
                onChange={(event: any) => addValue("jobTitle", event.target.value)}
                />
                <CustomTextField label="Req ID" width={180}
                selectedValue={values.reqID}
                onChange={(event: any) => addValue("reqID", event.target.value)}
                />
                <CustomTextField label="Client Name" width={185}
                selectedValue={values.clientName}
                onChange={(event: any) => addValue("clientName", event.target.value)}
                />
                <CustomTextField label="Tax Type" width={180}
                selectedValue={values.taxType}
                onChange={(event: any) => addValue("taxType", event.target.value)}
                />
                <CustomTextField label="Duration" width={180}
                selectedValue={values.duration}
                onChange={(event: any) => addValue("duration", event.target.value)}
                />

            {/* Section 4: Interviewee Candidate Details */}
            <Grid item xs={12}>
              <h4>4. Interviewee Candidate Details</h4>
            </Grid>
                <CustomTextField label="Candidate Name" width={310}
                selectedValue={values.candidateName}
                onChange={(event: any) => addValue("candidateName", event.target.value)}
                />
                <CustomTextField label="Rates For Interview" width={310}
                selectedValue={values.ratesForInterview}
                onChange={(event: any) => addValue("ratesForInterview", event.target.value)}
                />
                <CustomSelectField 
                label="Payment Status"
                valueOptions={paymentStatusOptions} 
                selectedValue={values.paymentStatus}
                onChange={(value: any)=> handleChange({ target: { value } }, "paymentStatus")}
                width={310}
                />
            </Grid>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                <Button onClick={handleCloseForm} color="primary" size='small'>
                    Cancel
                </Button>
                <Button color="primary" variant="contained" size='small' onClick={handleSubmitForm}>
                    Save
                </Button>
             </div>
        </form>
  )
}
