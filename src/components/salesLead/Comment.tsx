import { CircularProgress, Grid, IconButton, TextField } from '@mui/material';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import SendIcon from '@mui/icons-material/Send';
import { SalesLeadComment } from '../../Interfaces/salesLeads';
const Comment = ({ onAdd, comment, disabled, createMode }: Iprops) => {
  const [commentMessage, setCommentMessage] = useState('');
  const [savingNewComment, setSavingNewComment] = useState(false);
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
          disabled={disabled}
          fullWidth
          onChange={(e) => handleOnChange(e.target.value)}
          required={createMode}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              backgroundColor: disabled ? '#f0f0f0' : 'transparent',
            },
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: 'black',
              backgroundColor: '#f0f0f0',
            },
          }}
          multiline={true}
        />
      </Grid>
      {createMode && (
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
      )}
    </Grid>
  );
};

export default Comment;

interface Iprops {
  onAdd?: (message: string) => Promise<void>;
  comment?: SalesLeadComment;
  disabled?: boolean;
  createMode?: boolean;
}
