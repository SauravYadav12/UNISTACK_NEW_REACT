import { Button, Grid, TextField } from "@mui/material"
import CustomSelect from "../select/CustomSelectField"
import { useState } from "react"
import CustomTextField from "../text_field/CustomTextField"

export default function CustomForm() {
    const [reqStatus, setReqStatus] = useState("")
    const [assignedTo, setAssignedTo] = useState("")
    const [appliedFor, setAppliedFor] = useState("")
    const [taxType, setTaxType] = useState("")
    const [reqForm, setReqForm] = useState("")
    const [tech, setTech] = useState("")
    const [file, setFile] = useState()

    function handleFile(event: any) {
        event.preventDefault();
        setFile(event.target.files)
        console.log("selected file",event.target.files)
    }

    function onSubmit(event: any) {
        event.preventDefault();
        console.log("file is uploaded", file);
    }

    function handleSubmitForm(event: any) {
        event.preventDefault();
        console.log("Form is submitted successfully")

    }

    const requestStatusOptions = [
        'New Working',
        'Submitted',
        'Interviewed',
        'Cancelled',
        'Project Active',
        'Project Inactive',
      ];
    const assignedToOptions = [
        "Saurav Yadav", 
        "Navendra Yadav",
        "Sam",
        "Pramod",
        "Ankush"
    ];
    const appliedForOptions = [
        "Software Engineer",
        "Backend Developer"
    ];
    const taxTypeOptions = [
        "C2C",
        "1099",
        "W2 With vendor",
        "W2 With client"
        ];

    const gotRequirementForm = [
        "Got from online Resume",
        "Received on consulyant's Email",
        "Gor through Job Portal"
    ]

    const techStack = [
        "Java",
        "Ruby",
        "React",
        "Angular",
        "Node",
        "PHP",
        "Python",
        "Dot Net",
        "MERN",
        "MEAN",
        "AWS",
        "Go Lang",
        "React Native",
        "Laravel",
        "Flutter",
        "SAP Consultant",
        "ETL",
        "QA/Tester",
        "Azure",
        "Other Frontend"
    ]

  return (
    <>
    <div>
        <h2>Choose File</h2>
        <form onSubmit={onSubmit}>
                <input type="file" onChange={handleFile}/>
                {/* <button type="submit">Upload</button> */}
            <Button variant="contained" color="primary" type="submit">
                Upload
            </Button>
        </form>
    </div>

    <form>
    <Grid container spacing={2}>
        {/* Section 1: Requirement & Communication */}
        <Grid item xs={12}>
          <h4>1. Requirement & Communication</h4>
        </Grid>
        <CustomSelect 
        label="Req Status"
        valueOptions={requestStatusOptions}
        selectedValue={reqStatus}
        onChange={setReqStatus}
        />
        <CustomSelect 
        label="Assigned To"
        valueOptions={assignedToOptions}
        selectedValue={assignedTo}
        onChange={setAssignedTo}
        />
        <CustomTextField label="Next Step" placeholder="Review comment"/>
        <CustomSelect 
        label="Applied For"
        valueOptions={appliedForOptions}
        selectedValue={appliedFor}
        onChange={setAppliedFor}
        />
        <CustomTextField label="Rate" placeholder="Enter Rates"/>
          <CustomSelect 
          label="Tax Type"
          valueOptions={taxTypeOptions}
          selectedValue={taxType}
          onChange={setTaxType}
          />
        <CustomTextField label="Remote %" />
        <CustomTextField label="Duration" placeholder="Enter Duration"/>
        <Grid item xs={12}>
          <TextField
            label="Marketing Person's Comment"
            multiline
            rows={4}
            fullWidth
          />
        </Grid>
    </Grid>

    <Grid container spacing={2}>
        {/* Section 2: Client Info */}
        <Grid item xs={12}>
          <h4>2. Client Info</h4>
        </Grid>
        <CustomTextField label="Client Company"/>
        <CustomTextField label="Client Website"/>
        <CustomTextField label="Client Address"/>
        <CustomTextField label="Client Person Name"/>
        <CustomTextField label="Client Phone number"/>
        <CustomTextField label="Client Email"/>
    </Grid>
        
        
    <Grid container spacing={2}>
            
        {/* Section 3: Prime Vendor Info */}
        <Grid item xs={12}>
          <h4>3. Prime Vendor Info</h4>
        </Grid>
        <CustomTextField label="Prime Vendor Company"/>
        <CustomTextField label="Prime Vendor Website"/>
        <CustomTextField label="Prime Vendor Person Name"/>
        <CustomTextField label="Prime Vendor Phone number"/>
        <CustomTextField label="Prime Vendor Email"/>
    </Grid>

    <Grid container spacing={2}>
        {/* Section 4: Vendor Info */}
        <Grid item xs={12}>
          <h4>4. Vendor Info</h4>
        </Grid>
        <CustomTextField label="Vendor Company"/>
        <CustomTextField label="Vendor Website"/>
        <CustomTextField label="Vendor Person Name"/>
        <CustomTextField label="Vendor Phone number"/>
        <CustomTextField label="Vendor Email"/>
    </Grid>

    <Grid container spacing={2}>

        {/* Section 5: Job Requirement Info */}
        <Grid item xs={12}>
          <h4>5. Job Requirement Info</h4>
        </Grid>
        <CustomTextField label="Requirement Entered Date" />
        <CustomSelect 
        label="Got Requirement from"
        valueOptions={gotRequirementForm}
        selectedValue={reqForm}
        onChange={setReqForm}
        />
        <CustomSelect 
        label="Primary Tech Stack"
        valueOptions={techStack}
        selectedValue={tech}
        onChange={setTech}
        />
        <CustomTextField label="Job Title" placeholder="Enter Job Title"/>
        <CustomTextField label="Employement Type (If Mentioned)"/>
        <CustomTextField label="Job Portal Link" placeholder="Enter Job Portal Link"/>
        <CustomTextField label="Requirement Entered By"/>
        <CustomTextField label="Primary Tech Stack" placeholder="Enter the technical keywords"/>
        <CustomTextField label="Secondary Tech Stack" placeholder="Enter the technical keywords"/>

        <Grid item xs={12}>
          <TextField
            label="Complete Job Description"
            placeholder="Enter the complete Job Description"
            multiline
            rows={10}
            fullWidth
            />
        </Grid>
    </Grid>

        {/* Submit Button */}
        <Grid item sx={{mt:1}}>
          <Button variant="contained" color="primary" type="submit" onClick={handleSubmitForm}>
            Submit
          </Button>
        </Grid>
        
    </form>
    </>
  )
}