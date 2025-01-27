import {
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  TextField,
} from '@mui/material';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CommentMenu from './CommentMenu';
import SendIcon from '@mui/icons-material/Send';
import { SalesLeadComment } from '../../Interfaces/salesLeads';
import { getIUser } from '../../utils/utils';
const Comment = ({
  onEdit,
  onDelete,
  onAdd,
  comment,
  disabled,
  createMode,
}: Iprops) => {
  const user = getIUser();
  const [commentMessage, setCommentMessage] = useState('');
  const [savingNewComment, setSavingNewComment] = useState(false);
  const [savingEditedComment, setSavingEditedComment] = useState(false);
  const [editing, setEditing] = useState(false);
  const label = `${comment?.name} . ${moment(comment?.date).format(
    'YYYY-MM-DD hh:mm A'
  )}`;

  const handleOnChange = (val: string) => {
    setCommentMessage(val);
  };

  const handleOnAdd = async () => {
    if (!onAdd || !commentMessage.length) return;

    try {
      setSavingNewComment(true);
      await onAdd(commentMessage);
      setCommentMessage('');
    } catch (error) {
      console.log(error);
    } finally {
      setSavingNewComment(false);
    }
  };

  const saveEditedComment = async () => {
    if (!onEdit || !commentMessage.length || !comment) return;

    try {
      setSavingEditedComment(true);
      await onEdit({ ...comment, comment: commentMessage });
      setCommentMessage('');
    } catch (error) {
      console.log(error);
    } finally {
      setSavingEditedComment(false);
      setEditing(false);
    }
  };


  const handleOnEdit = () => {
    setEditing(true);
  };

  useEffect(() => {
    setCommentMessage(comment?.comment || '');
  }, [comment]);

  return (
    <Grid
      item
      xs={12}
      sx={{ my: 1 }}
      style={{
        padding: '0px',
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <Grid
        item
        sx={{ m: 1, width: '100%', position: 'relative', minWidth: 300 }}
      >
        <TextField
          label={createMode ? 'New comment' : label}
          value={commentMessage}
          disabled={editing ? false : disabled}
          fullWidth
          onChange={(e) => handleOnChange(e.target.value)}
          required
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              backgroundColor: (editing ? false : disabled)
                ? '#f0f0f0'
                : 'transparent',
            },
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: 'black',
              backgroundColor: '#f0f0f0',
            },
          }}
          multiline={true}
        />
      
      </Grid>
      {createMode ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            disabled={!commentMessage.length || savingNewComment}
            onClick={() => handleOnAdd()}
          >
            {savingNewComment ? (
              <CircularProgress
                style={{ color: '#1976d2', width: '20px', height: '20px' }}
              />
            ) : (
              <SendIcon color="primary" />
            )}
          </IconButton>
        </div>
      ) : (
        <>
          {editing ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                disabled={!commentMessage.length || savingEditedComment}
                onClick={() => saveEditedComment()}
              >
                {savingEditedComment ? (
                  <CircularProgress
                    style={{ color: '#1976d2', width: '20px', height: '20px' }}
                  />
                ) : (
                  <SendIcon color="primary" />
                )}
              </IconButton>
            </div>
          ) : (
            <CommentMenu
              owner={
                user?.role === 'super-admin' || comment?.commentBy === user?.id
              }
              onDelete={() => onDelete && onDelete(comment)}
              onEdit={handleOnEdit}
            />
          )}
        </>
      )}
    </Grid>
  );
};

export default Comment;

interface Iprops {
  onEdit?: (c?: SalesLeadComment) => Promise<void>;
  onDelete?: (c?: SalesLeadComment) => Promise<void>;
  onAdd?: (message: string) => Promise<void>;
  comment?: SalesLeadComment;
  disabled?: boolean;
  createMode?: boolean;
}
