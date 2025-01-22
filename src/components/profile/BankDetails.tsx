import React, { useEffect, useState } from 'react';
import {  MyDetail } from '../../Interfaces/profile';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { Box } from '@mui/material';
import './profile.css';
const BankDetailsComponent = () => {
  const { myProfile } = useAuth();
  const [bankDetails, setBankDetails] = useState<MyDetail[]>([]);

  useEffect(() => {
    const accountName = myProfile?.bankDetails.accountName;
    const accountNumber = myProfile?.bankDetails.accountNumber;
    const bankName = myProfile?.bankDetails.bankName;
    const ifscCode = myProfile?.bankDetails.ifscCode;
    const swiftCode = myProfile?.bankDetails.swiftCode;
    const bankAddress = myProfile?.bankDetails.bankAddress;

    const bankDetailsSchema: MyDetail[] = [
      {
        label: 'Account Name',
        value: accountName ,
      },
      {
        label: 'Account Number',
        value: accountNumber ,
      },
      {
        label: 'IFSC Code',
        value: ifscCode ,
      },
      {
        label: 'Swift Code',
        value: swiftCode ,
      },
      {
        label: 'Bank Name',
        value: bankName ,
      },
      {
        label: 'Bank Address',
        value: bankAddress ,
      },
    ];
    setBankDetails(bankDetailsSchema);
  }, [myProfile]);
  return (
    <div className="myDetails-container">
      <>
        {bankDetails.map((detail, i) => {
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
              <p className="myDetail-value">{value|| 'NA'}</p>
            </Box>
          );
        })}
      </>
    </div>
  );
};

export default BankDetailsComponent;
