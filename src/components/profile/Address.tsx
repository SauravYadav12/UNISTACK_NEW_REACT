import React, { useEffect, useState } from 'react';
import {
  CommunicationAddress,
  MyDetail,
  PermanentAddress,
} from '../../Interfaces/profile';
import { Box } from '@mui/material';
import './profile.css';
import { Country } from 'country-state-city';
const Address = ({
  address,
}: {
  address: PermanentAddress | CommunicationAddress;
}) => {
  const [addressSchema, setAddressSchema] = useState<MyDetail[]>([]);

  const inItAddressSchema = (
    address: CommunicationAddress | PermanentAddress
  ) => {
    const schema: MyDetail[] = [
      {
        label: 'Address1',
        value: address.address1,
      },
      {
        label: 'Address2',
        value: address.address2,
      },
      {
        label: 'City',
        value: address.city,
      },
      {
        label: 'State',
        value: address.state,
      },
      {
        label: 'Country',
        value: address.country
          ? `${Country.getCountryByCode(address.country)?.name} (${
              address.country
            })`
          : '',
      },
      {
        label: 'Zip/pin',
        value: address['zip/pin'],
      },
    ];
    return schema;
  };

  useEffect(() => {
    setAddressSchema(inItAddressSchema(address));
  }, [address]);

  return (
    <div className="myDetails-container">
      <>
        {addressSchema.map((detail, i) => {
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

export default Address;
