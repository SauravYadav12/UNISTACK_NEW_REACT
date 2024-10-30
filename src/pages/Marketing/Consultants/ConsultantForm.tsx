import { Button, Grid } from '@mui/material'
import CustomTextField from '../../../components/text_field/CustomTextField'
import CustomSelectField from '../../../components/select/CustomSelectField'
import { useState } from 'react'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import  dayjs, {Dayjs} from 'dayjs'
import { consultantStatusOptions, timeZoneOptions, visaStatusOptions } from './consultantValues'



const initialValues = {
  timeZone: "",
  status: "",
  visaStatus: "",
  projects: "",
  dob: null,
  consultantName: "",
  currentAddress: "",
  previousAddress: "",
  email: "",
  phone: "",
  degreeName: "",
  university: "",
  yearOfPassing: "",
  ssn: "",
  drivingLicense: "",
  psuedoNameOfConsultant: "",
  skypeId: "",
  howDidYouGetTheVISA: "",
  inWhichYearYouCameToUS: "",
  basiclyFromWhichCountry: "",
  whyAreYouLookingForTheChange: "",

}


export default function ConsultantForm({handleCloseForm}: any) {
    const [values, setValues] = useState(initialValues);
    const [projects, setProjects] = useState([{ 
      projectNumber: 1,
      projectName: "",
      projectCity: "",
      projectState: "",
      projectStartDate: "",
      projectEndtDate: "",
      projectDescription: "",
     }])
    const [dob, setDob] = useState<Dayjs | null>(null);
    const [projectStartDate, setProjectStartDate] = useState<Dayjs | null>(null);
    const [projectEndtDate, setProjectEndtDate] = useState<Dayjs | null>(null); 



    const handleAddProject = () => {
        const newProjectNumber = projects.length + 1;
        setProjects([...projects, { 
          projectNumber: newProjectNumber,
          projectName: "", 
          projectCity: "", 
          projectState: "", 
          projectStartDate: "", 
          projectEndtDate: "", 
          projectDescription: ""
        }]); // Add a new project to the state
      };

  const addValue = (field: any, newValue: any, index?: number) => {
    if (typeof index === 'number') {
        setProjects((prevProjects) => {
            const updatedProjects = [...prevProjects];
            if (field === 'projectStartDate' || field === 'projectEndtDate') {
                const formattedDate = newValue ? dayjs(newValue).format('YYYY-MM-DD') : null;
                updatedProjects[index] = { 
                    ...updatedProjects[index], 
                    [field]: formattedDate // Save formatted date for the project
                };
            } else {
                updatedProjects[index] = { 
                    ...updatedProjects[index], 
                    [field]: newValue 
                };
            }
            return updatedProjects;
        });
    } else {
        if (field === 'dob') {
            const formattedDate = newValue ? dayjs(newValue).format('YYYY-MM-DD') : null;
            setValues((prevValues) => ({
                ...prevValues,
                [field]: formattedDate // Save the formatted date
            }));
        } else {
            setValues((prevValues) => ({
                ...prevValues,
                [field]: newValue
            }));
        }
    }
};
  

  function handleChange(event: any, key: string) {
        setValues((prev) => ({ ...prev, [key]: event.target.value }));
    }

  function handleSubmitForm(event: any) {
      event.preventDefault();
      const payload = {
        ...values,
        projects: projects
    };
      console.log("Interview Form submitted successfully", payload)
  }

  return (
        <form style={{ margin: '0 20px' }}>
            <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
          {/* Section 1: Consultant Info */}
            <Grid item xs={12}>
              <h4>1. Consultant Info</h4>
            </Grid>
                <CustomSelectField 
                    label="Consultant Status" 
                    size="small" 
                    valueOptions={consultantStatusOptions}
                    selectedValue={values.status}
                    onChange={(value: any)=> handleChange({ target: { value } }, "status")}
                    width={230}
                    />
                <CustomTextField 
                    label="Consultant Name" width={230}
                    value={values.consultantName}
                    onChange={(event: any) => addValue("consultantName", event.target.value)}
                    />
                <CustomSelectField 
                    label="Visa Status" 
                    valueOptions={visaStatusOptions} 
                    selectedValue={values.visaStatus}
                    onChange={(value: any)=> handleChange({ target: { value } }, "visaStatus")}
                    width={230}
                    />
                <Grid item>
                    <LocalizationProvider dateAdapter={AdapterDayjs} >
                        <DatePicker
                            label="Date of Birth"
                            value={dob}
                            onChange={(newValue) => addValue("dob",newValue)} // Handle date change
                            slotProps={{ 
                              textField: {
                                size:"small",
                                sx: {
                                  '& .MuiOutlinedInput-root': {
                                      borderRadius: '10px', // same border-radius
                                  },
                                    width: 230,
                               } } }}
                          />
                    </LocalizationProvider>
                </Grid>
                <CustomTextField
                    label="Current Address" 
                    width={230}
                    value={values.currentAddress}
                    onChange={(event: any) => addValue("currentAddress", event.target.value)}
                    />
                <CustomTextField 
                    label="Previous Address"
                    width={230}
                    value={values.previousAddress}
                    onChange={(event: any) => addValue("previousAddress", event.target.value)}
                    />
                <CustomTextField 
                    label="Email" width={230}
                    value={values.email}
                    onChange={(event: any) => addValue("email", event.target.value)}
                    />
                <CustomTextField 
                    label="Phone" width={230}
                    value={values.phone}
                    onChange={(event: any) => addValue("phone", event.target.value)}
                    />
                <CustomSelectField 
                    label="Consultant Timezone"
                    valueOptions={timeZoneOptions} 
                    selectedValue={values.timeZone}
                    onChange={(value: any)=> handleChange({ target: { value } }, "timeZone")}
                    width={230}
                    />
                <CustomTextField 
                    label="Degree Name" width={230}
                    value={values.degreeName}
                    onChange={(event: any) => addValue("degreeName", event.target.value)}
                    />
                <CustomTextField
                    label="University"
                    width={230}
                    value={values.university}
                    onChange={(event: any) => addValue("university", event.target.value)}
                    />
                <CustomTextField 
                    label="Year of Passing" width={230}
                    value={values.yearOfPassing}
                    onChange={(event: any) => addValue("yearOfPassing", event.target.value)}
                    />
                <CustomTextField 
                    label="SSN"
                    width={230}
                    value={values.ssn}
                    onChange={(event: any) => addValue("ssn", event.target.value)}
                    />
                <CustomTextField 
                    label="Driving License"
                    width={230}
                    value={values.drivingLicense}
                    onChange={(event: any) => addValue("drivingLicense", event.target.value)}
                    />
                <CustomTextField 
                    label="Psuedo Name Of Consultant" width={230}
                    value={values.psuedoNameOfConsultant}
                    onChange={(event: any) => addValue("psuedoNameOfConsultant", event.target.value)}
                    />
                <CustomTextField 
                    label="SkypeId"
                    width={230}
                    value={values.skypeId}
                    onChange={(event: any) => addValue("skypeId", event.target.value)}
                    />  
                <CustomTextField 
                    label="How did you get the VISA?"
                    width={230}
                    value={values.howDidYouGetTheVISA}
                    onChange={(event: any) => addValue("howDidYouGetTheVISA", event.target.value)}
                    />
                <CustomTextField 
                    label="In which year you came to US?"
                    width={230}
                    value={values.inWhichYearYouCameToUS}
                    onChange={(event: any) => addValue("inWhichYearYouCameToUS", event.target.value)}
                    />
                <CustomTextField 
                    label="Basicly from which country?"
                    width={230}
                    value={values.basiclyFromWhichCountry}
                    onChange={(event: any) => addValue("basiclyFromWhichCountry", event.target.value)}
                    />
                <CustomTextField 
                    label="Why are you looking for the change?"
                    width={230}
                    value={values.whyAreYouLookingForTheChange}
                    onChange={(event: any) => addValue("whyAreYouLookingForTheChange", event.target.value)}
                    />
            {/* Section 2: Resume Info */}
            <Grid item xs={12}>
              <h4>2. Resume Info</h4>
            </Grid>
            {projects.map((project, index) => (
                <Grid key={index} container spacing={1}>
                <Grid item xs={12}>
                  <h4>{`PROJECT ${project.projectNumber}`}</h4>
                </Grid>
              <CustomTextField 
                      label="Project Name"
                      width={180}
                      value={project.projectName}
                      onChange={(event: any) => addValue("projectName", event.target.value, index)}
                      />
              <CustomTextField 
                      label="Project City"
                      width={180}
                      value={project.projectCity}
                      onChange={(event: any) => addValue("projectCity", event.target.value, index)}
                      />
              <CustomTextField 
                      label="Project State"
                      width={180}
                      value={project.projectState}
                      onChange={(event: any) => addValue("projectState", event.target.value, index)}
                      />
              <Grid item mr={1}>
                      <LocalizationProvider dateAdapter={AdapterDayjs} >
                        <DatePicker
                            label="Project Start Date"
                            value={projectStartDate}
                            onChange={(newValue) => addValue("projectStartDate",newValue, index)} // Handle date change
                            slotProps={{ 
                              textField: {
                                fullWidth:true,
                                size:"small",
                                sx: {
                                  '& .MuiOutlinedInput-root': {
                                      borderRadius: '10px', // same border-radius
                                  },
                                    width: 180,
                               } } }}
                          />
                      </LocalizationProvider>
              </Grid>
              <Grid item>
                    <LocalizationProvider dateAdapter={AdapterDayjs} >
                        <DatePicker
                            label="Project End Date"
                            value={projectEndtDate}
                            onChange={(newValue) => addValue("projectEndtDate",newValue, index)} // Handle date change
                            slotProps={{ 
                              textField: {
                                fullWidth:true,
                                size:"small",
                                sx: {
                                  '& .MuiOutlinedInput-root': {
                                      borderRadius: '10px', // same border-radius
                                  },
                                    width: 180,
                               } } }}
                          />
                    </LocalizationProvider>
              </Grid>
              <CustomTextField 
                      label="Project Description"
                      multiline
                      rows={2}
                      width={970}
                      value={project.projectDescription}
                      onChange={(event: any) => addValue("projectDescription", event.target.value, index)}
                      />
              </Grid>
            ))}

            {/* Button to add new project */}
            <Grid item xs={12} style={{ marginTop: '10px' }}>
                <Button variant="contained" size='small' onClick={handleAddProject}>
                    Add New Project
                </Button>
            </Grid>
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