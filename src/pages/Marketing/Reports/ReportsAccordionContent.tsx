import { Box, Typography, Link } from '@mui/material';

export default function ReportsAccordionContent(){
  return (
    <Box p={2}>
      <Typography> Total Position Entered: <Link href="#">0</Link> </Typography>
      <Typography> Total Position Submitted: <Link href="#">0</Link> </Typography>
      <Typography> Total Position Cancelled: <Link href="#">0</Link> </Typography>
      <Typography> Called But No Response: <Link href="#">0</Link> </Typography>
    </Box>
  );
};