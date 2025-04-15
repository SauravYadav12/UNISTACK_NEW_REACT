import { Link, Typography } from '@mui/material';
import React from 'react';

const CopyRight = () => {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      sx={{ mt: 5 }}
    >
      {'Copyright © '}
      <Link color="inherit" target="_blank" href="https://www.unicodez.com/">
        Unicodez Inc
      </Link>
      {' 2025.'}
    </Typography>
  );
};

export default CopyRight;
