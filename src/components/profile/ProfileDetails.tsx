import React, { useEffect, useState } from 'react';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { MyDetail } from '../../Interfaces/profile';
import { Box } from '@mui/material';
import './profile.css';
import dayjs from 'dayjs';
const ProfileDetails = () => {
  const { myProfile } = useAuth();
  const [MyDetails, setMyDetails] = useState<MyDetail[]>([]);

  const initializeDetails = () => {
    const name = myProfile?.name;
    const personalEmail = myProfile?.email.personal;
    const officialEmail = myProfile?.email.official;
    const phoneNumber = myProfile?.phoneNumber;
    const emergencyPhoneNumber = myProfile?.emergencyPhoneNumber;
    const myDetalSchema: MyDetail[] = [
      {
        label: 'Name',
        value: name,
      },
      {
        label: 'Date of birth',
        value: myProfile?.dob ? dayjs(myProfile.dob).format('YYYY-MM-DD') : '',
      },
      {
        label: 'Personal Email',
        value: personalEmail,
      },
      {
        label: 'Official Email',
        value: officialEmail,
      },

      {
        label: 'Phone number',
        value: phoneNumber,
      },
      {
        label: 'Emergency Phone Number',
        value: emergencyPhoneNumber,
      },
      {
        label: 'Aadhar Number',
        value: myProfile?.aadharNumber,
      },
      {
        label: 'PAN Number',
        value: myProfile?.panNumber,
      },
    ];
    setMyDetails(myDetalSchema);
  };

  useEffect(() => {
    initializeDetails();
  }, [myProfile]);

  return (
    <div className="myDetails-container">
      <>
        {MyDetails.map((detail, i) => {
          const { label, value } = detail;
          return (
            <Box
              key={i}
              component="div"
              sx={{
                minWidth: '220px',
                padding: '10px',
              }}
            >
              <p className="myDetail-label">{label}</p>
              <p className="myDetail-value">{value || 'NA'}</p>
            </Box>
          );
        })}
      </>
    </div>
  );
};

export default ProfileDetails;
