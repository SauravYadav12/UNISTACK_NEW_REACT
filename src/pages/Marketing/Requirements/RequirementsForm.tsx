import { Button, Grid } from "@mui/material"
import CustomSelect from "../../../components/select/CustomSelectField"
import { useState } from "react"
import CustomTextField from "../../../components/text_field/CustomTextField"
import  dayjs  from 'dayjs'
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { appliedForOptions, assignedToOptions, gotRequirementForm, requestStatusOptions, taxTypeOptions, techStack } from "./requirementsValues"


const initialValues = {
        reqStatus: "",
        assignedTo: "",
        appliedFor: "",
        taxType: "",
        reqForm: "",
        tech: "",
        file: undefined,
        nextStep: "",
        rate: "",
        remotePercentage: "",
        duration: "",
        marketingComment: "",
        clientCompany: "",
        clientWebsite: "",
        clientAddress: "",
        clientPersonName: "",
        clientPhoneNumber: "",
        clientEmail: "",
        primeVendorCompany: "",
        primeVendorWebsite: "",
        primeVendorPersonName: "",
        primeVendorPhoneNumber: "",
        primeVendorEmail: "",
        vendorCompany: "",
        vendorWebsite: "",
        vendorPersonName: "",
        vendorPhoneNumber: "",
        vendorEmail: "",
        requirementEnteredDate: dayjs().format('YYYY-MM-DD'),
        gotRequirementForm: "",
        primaryTechStack: "",
        jobTitle: "",
        employmentType: "",
        jobPortalLink: "",
        requirementEnteredBy: "",
        secondaryTechStack: "",
        completeJobDescription: "",
}

export default function RequirementsForm() {
    const [values, setValues] = useState(initialValues);
    const [requirementEnteredDate, setRequirementEnteredDate] = useState(dayjs());

  function handleFile(event: any) {
        event.preventDefault();
        setValues((prev) => ({ ...prev, file: event.target.files }));
        console.log("selected file",event.target.files)
    }

  function onSubmit(event: any) {
        event.preventDefault();
        console.log("file is uploaded", values.file);
    }

  function handleSubmitForm(event: any) {
        event.preventDefault();
        console.log("Form is submitted successfully", values)

    }

    function handleChange(event: any, key: string) {
      setValues((prev) => ({ ...prev, [key]: event.target.value }));
  }

  const addValue = (key: any, newValue: any) => {
    console.log("nextstepvalues", values.rate)
    if (key === 'requirementEnteredDate') {
      const formattedDate = newValue ? dayjs(newValue).format('YYYY-MM-DD') : null;
      setValues((prevValues) => ({
        ...prevValues,
        [key]: formattedDate
    }));
    } else setValues((prevValues) => ({
        ...prevValues,
        [key]: newValue
    }));
};


  return (
    <>
    <div style={{ margin: '0 20px' }}>
        <h2>Choose File</h2>
        <form onSubmit={onSubmit} style={{ margin: '0 20px' }}>
                <input type="file" onChange={handleFile}/>
            <Button variant="contained" color="primary" type="submit" size="small">
                Upload
            </Button>
        </form>
    </div>

    <form style={{ margin: '0 20px' }}>
    <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
        {/* Section 1: Requirement & Communication */}
        <Grid item xs={12}>
          <h4>1. Requirement & Communication</h4>
        </Grid>
        <CustomSelect 
        label="Req Status"
        valueOptions={requestStatusOptions}
        selectedValue={values.reqStatus}
        onChange={(value: any)=> handleChange({ target: { value } }, "reqStatus")}
        width={230}
        />
        <CustomSelect 
        label="Assigned To"
        valueOptions={assignedToOptions}
        selectedValue={values.assignedTo}
        onChange={(value: any)=> handleChange({ target: { value } }, "assignedTo")}
        width={230}
        />
        <CustomTextField 
        label="Next Step" 
        width={230}
        value={values.nextStep}
        onChange={(event: any) => addValue("nextStep", event.target.value)}
        />
        <CustomSelect 
        label="Applied For"
        valueOptions={appliedForOptions}
        selectedValue={values.appliedFor}
        onChange={(value: any)=> handleChange({ target: { value } }, "appliedFor")}
        width={230}
        />
        <CustomTextField 
        label="Rate" 
        width={230}
        selectedValue={values.rate}
        onChange={(event: any) => addValue("rate", event.target.value)}
        />
        <CustomSelect 
        label="Tax Type"
        valueOptions={taxTypeOptions}
        selectedValue={values.taxType}
        onChange={(value: any)=> handleChange({ target: { value } }, "taxType")}
        width={230}
        />
        <CustomTextField 
        label="Remote %" width={230}
        selectedValue={values.remotePercentage}
        onChange={(event: any) => addValue("remotePercentage", event.target.value)}
        />
        <CustomTextField 
        label="Duration" width={230}
        selectedValue={values.duration}
        onChange={(event: any) => addValue("duration", event.target.value)}
        />
        <CustomTextField 
        label="Marketing Person's Comment"
        multiline
        rows={2}
        width={970}
        selectedValue={values.marketingComment}
        onChange={(event: any) => addValue("marketingComment", event.target.value)}
        />
    </Grid>

    <Grid container spacing={2}>
        {/* Section 2: Client Info */}
        <Grid item xs={12}>
          <h4>2. Client Info</h4>
        </Grid>
        <CustomTextField 
        label="Client Company" width={230}
        selectedValue={values.clientCompany}
        onChange={(event: any) => addValue("clientCompany", event.target.value)}
        />
        <CustomTextField 
        label="Client Website" width={230}
        selectedValue={values.clientWebsite}
        onChange={(event: any) => addValue("clientWebsite", event.target.value)}
        />
        <CustomTextField 
        label="Client Address" width={230}
        selectedValue={values.clientAddress}
        onChange={(event: any) => addValue("clientAddress", event.target.value)}
        />
        <CustomTextField 
        label="Client Person Name" width={230}
        selectedValue={values.clientPersonName}
        onChange={(event: any) => addValue("clientPersonName", event.target.value)}
        />
        <CustomTextField 
        label="Client Phone number" width={230}
        selectedValue={values.clientPhoneNumber}
        onChange={(event: any) => addValue("clientPhoneNumber", event.target.value)}
        />
        <CustomTextField 
        label="Client Email" width={230}
        selectedValue={values.clientEmail}
        onChange={(event: any) => addValue("clientEmail", event.target.value)}
        />
    </Grid>
        
        
    <Grid container spacing={2}>
            
        {/* Section 3: Prime Vendor Info */}
        <Grid item xs={12}>
          <h4>3. Prime Vendor Info</h4>
        </Grid>
        <CustomTextField 
        label="Prime Vendor Company" width={230}
        selectedValue={values.primeVendorCompany}
        onChange={(event: any) => addValue("primeVendorCompany", event.target.value)}
        />
        <CustomTextField 
        label="Prime Vendor Website" width={230}
        selectedValue={values.primeVendorWebsite}
        onChange={(event: any) => addValue("primeVendorWebsite", event.target.value)}
        />
        <CustomTextField 
        label="Prime Vendor Person Name" width={230}
        selectedValue={values.primeVendorPersonName}
        onChange={(event: any) => addValue("primeVendorPersonName", event.target.value)}
        />
        <CustomTextField 
        label="Prime Vendor Phone number" width={230}
        selectedValue={values.primeVendorPhoneNumber}
        onChange={(event: any) => addValue("primeVendorPhoneNumber", event.target.value)}
        />
        <CustomTextField 
        label="Prime Vendor Email" width={230}
        selectedValue={values.primeVendorEmail}
        onChange={(event: any) => addValue("primeVendorEmail", event.target.value)}
        />
    </Grid>

    <Grid container spacing={2}>
        {/* Section 4: Vendor Info */}
        <Grid item xs={12}>
          <h4>4. Vendor Info</h4>
        </Grid>
        <CustomTextField 
        label="Vendor Company" width={230}
        selectedValue={values.vendorCompany}
        onChange={(event: any) => addValue("vendorCompany", event.target.value)}
        />
        <CustomTextField 
        label="Vendor Website" width={230}
        selectedValue={values.vendorWebsite}
        onChange={(event: any) => addValue("vendorWebsite", event.target.value)}
        />
        <CustomTextField 
        label="Vendor Person Name" width={230}
        selectedValue={values.vendorPersonName}
        onChange={(event: any) => addValue("vendorPersonName", event.target.value)}
        />
        <CustomTextField 
        label="Vendor Phone number" width={230}
        selectedValue={values.vendorPhoneNumber}
        onChange={(event: any) => addValue("vendorPhoneNumber", event.target.value)}
        />
        <CustomTextField 
        label="Vendor Email" width={230}
        selectedValue={values.vendorEmail}
        onChange={(event: any) => addValue("vendorEmail", event.target.value)}
        />
    </Grid>

    <Grid container spacing={2}>

        {/* Section 5: Job Requirement Info */}
        <Grid item xs={12}>
          <h4>5. Job Requirement Info</h4>
        </Grid>
        <Grid sx={{mt:1,ml:1,mr:1, width: 230}}>
              <LocalizationProvider dateAdapter={AdapterDayjs} >
                        <DatePicker
                            label="Requirement Entered Date"
                            value={requirementEnteredDate}
                            disabled
                            // onChange={(newValue) => addValue("requirementEnteredDate",newValue)} // Handle date change
                            slotProps={{ 
                              textField: {
                                size:"small",
                                sx: {
                                  '& .MuiOutlinedInput-root': {
                                      borderRadius: '10px', // same border-radius
                                  }} } }}
                          />
              </LocalizationProvider>
          </Grid>
        <CustomSelect 
        label="Got Requirement from"
        valueOptions={gotRequirementForm}
        selectedValue={values.reqForm || ""}
        onChange={(value: any)=> handleChange({ target: { value } }, "reqForm")}
        width={230}
        />
        <CustomSelect 
        label="Primary Tech Stack"
        valueOptions={techStack}
        selectedValue={values.tech}
        onChange={(value: any)=> handleChange({ target: { value } }, "tech")}
        width={230}
        />
        <CustomTextField 
        label="Job Title" width={230}
        selectedValue={values.jobTitle}
        onChange={(event: any) => addValue("jobTitle", event.target.value)}
        />
        <CustomTextField 
        label="Employement Type (If Mentioned)" width={230}
        selectedValue={values.employmentType}
        onChange={(event: any) => addValue("employmentType", event.target.value)}
        />
        <CustomTextField 
        label="Job Portal Link" width={230}
        selectedValue={values.jobPortalLink}
        onChange={(event: any) => addValue("jobPortalLink", event.target.value)}
        />
        <CustomTextField 
        label="Requirement Entered By" width={230}
        selectedValue={values.requirementEnteredBy}
        onChange={(event: any) => addValue("requirementEnteredBy", event.target.value)}
        />
        <CustomTextField 
        label="Primary Tech Stack" width={230}
        selectedValue={values.primaryTechStack}
        onChange={(event: any) => addValue("primaryTechStack", event.target.value)}
        />
        <CustomTextField 
        label="Secondary Tech Stack" width={230}
        selectedValue={values.secondaryTechStack}
        onChange={(event: any) => addValue("secondaryTechStack", event.target.value)}
        />
        <CustomTextField 
        label="Complete Job Description"
        multiline
        rows={4}
        width={970}
        selectedValue={values.completeJobDescription}
        onChange={(event: any) => addValue("completeJobDescription", event.target.value)}
        />
    </Grid>

        {/* Submit Button */}
        <Grid item sx={{mt:1}}>
          <Button variant="contained" color="primary" type="submit" onClick={handleSubmitForm} size="small">
            Submit
          </Button>
        </Grid>
        
    </form>
    </>
  )
}