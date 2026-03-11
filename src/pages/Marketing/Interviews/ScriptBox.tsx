import { Card, Stack, Typography, Box, IconButton } from '@mui/material';
import { getMaterialFileIcon } from 'file-extension-icon-js';
import { downloadFile } from '../../../utils/utils';

import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { urlValidator } from '../../../utils/validators';
interface iProps {
  scriptUrl: string;
}
const ScriptBox = ({ scriptUrl: url }: iProps) => {
  if (!urlValidator(url)) {
    console.error('scriptUrl is not valid :=> ' + url);
    return null;
  }
  return (
    <Card
      variant="outlined"
      className="document-container"
      sx={{ borderRadius: '10px', p: 0, width: '210px' }}
    >
      <Stack py={'6px'} pl={2} direction={'row'} alignItems={'center'}>
        <img
          src={`${getMaterialFileIcon(url)}`}
          alt="icon"
          style={{
            width: '17px',
            height: '17px',
          }}
        />
        <Typography variant={'subtitle2'} pl={'3px'}>
          Script
        </Typography>
      </Stack>
      <Box pr={1}>
        <IconButton target="_blank" href={url} sx={{ height: '30px' }}>
          <OpenInNewIcon style={{ color: '#1976d2', width: '16px' }} />
        </IconButton>
        <IconButton onClick={() => downloadFile(url)} sx={{ height: '30px' }}>
          <DownloadIcon style={{ color: '#1976d2', width: '16px' }} />
        </IconButton>
      </Box>
    </Card>
  );
};

export default ScriptBox;
