import { Box } from '@mui/material';
import { FaUserCircle } from 'react-icons/fa';
import { ModeEditOutline } from '@mui/icons-material';
import './myAvatar.css';

interface MyProps {
  avatar?: string | File;
  onEdit: () => void;
}

const MyAvatar = ({ avatar, onEdit }: MyProps) => {
  return (
    <Box className="my-avatar-parent-box" sx={{}}>
      <Box className="edit-box" onClick={() => onEdit()}>
        <ModeEditOutline
          sx={{ width: '16px', height: '16px' }}
          className="edit-icon"
        />
      </Box>
      <Box className="my-avatar-box" sx={{}}>
        {!!avatar && (
          <img
            className="my-avatar"
            src={
              typeof avatar === 'string' ? avatar : URL.createObjectURL(avatar)
            }
            alt="profile-image"
          />
        )}
        {!avatar && (
          <FaUserCircle style={{ color: 'white', fontSize: '100' }} />
        )}
      </Box>
    </Box>
  );
};

export default MyAvatar;
