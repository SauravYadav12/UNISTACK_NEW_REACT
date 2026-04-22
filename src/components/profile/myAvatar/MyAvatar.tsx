import { Avatar, Box, IconButton, alpha } from '@mui/material';
import { IconCamera, IconUser } from '@tabler/icons-react';
import { tokens } from '../../../theme/theme';

interface MyProps {
  avatar?: string | File;
  editable?: boolean;
  onEdit: () => void;
}

const MyAvatar = ({ avatar, onEdit, editable }: MyProps) => {
  const imgSrc = avatar
    ? typeof avatar === 'string'
      ? avatar
      : URL.createObjectURL(avatar)
    : undefined;

  return (
    <Box
      sx={{
        position: 'relative',
        width: 110,
        height: 110,
        borderRadius: '50%',
        p: '4px',
        background: tokens.gradients.pinkBlue,
        flexShrink: 0,
      }}
    >
      <Avatar
        src={imgSrc}
        sx={{
          width: '100%',
          height: '100%',
          fontSize: 40,
          bgcolor: tokens.colors.brand,
          color: '#fff',
        }}
      >
        {!avatar && <IconUser size={44} />}
      </Avatar>

      {editable && (
        <IconButton
          onClick={onEdit}
          size="small"
          sx={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            width: 30,
            height: 30,
            bgcolor: tokens.colors.blue,
            color: '#fff',
            border: '2px solid #fff',
            '&:hover': { bgcolor: tokens.colors.blueDark },
          }}
        >
          <IconCamera size={14} />
        </IconButton>
      )}
    </Box>
  );
};

export default MyAvatar;
