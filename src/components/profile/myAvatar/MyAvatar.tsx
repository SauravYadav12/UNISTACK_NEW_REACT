import { Box } from '@mui/material';
import { DoNotDisturbAlt } from '@mui/icons-material/';
import './myAvatar.css';
import { FaUserCircle } from "react-icons/fa";

interface MyProps {
  avatar?: string | File;
}

const MyAvatar = ({ avatar }: MyProps) => {
  return (
    <Box className="my-avatar-parent-box" sx={{}}>
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
        {!avatar && <FaUserCircle style={{ color: 'white',fontSize:'100', }} />}
      </Box>
    </Box>
  );
};

export default MyAvatar;
