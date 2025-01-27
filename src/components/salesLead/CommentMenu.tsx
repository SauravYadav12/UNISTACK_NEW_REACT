import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Button, IconButton, Menu, MenuItem } from '@mui/material';
import React from 'react';
export default function CommentMenu({ owner, onDelete, onEdit }: iProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        <MoreVertIcon color="primary" />
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        {owner && (
          <MenuItem
            onClick={() => {
              onEdit();
              handleClose();
            }}
          >
            Edit
          </MenuItem>
        )}
        {owner && (
          <MenuItem
            onClick={() => {
              onDelete();
              handleClose();
            }}
          >
            Delete
          </MenuItem>
        )}
        <MenuItem onClick={handleClose}>Reply</MenuItem>
      </Menu>
    </div>
  );
}

interface iProps {
  owner: boolean;
  onDelete: () => void;
  onEdit: () => void;
}
