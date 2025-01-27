import React, { useEffect, useState } from 'react';
import { iSalesLead, SalesLeadComment } from '../../../Interfaces/salesLeads';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import moment from 'moment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CustomTextField from '../../../components/text_field/CustomTextField';
import dayjs from 'dayjs';
import {
  createComment,
  deleteComment,
  deleteSalesLead,
  updateComment,
} from '../../../services/salesLeadsApi';
import Comment from '../../../components/salesLead/Comment';
import CustomSelectField from '../../../components/select/CustomSelectField';
import { salesLeadStatusOptions } from './constants';
import { getIUser } from '../../../utils/utils';
export const initialValues: InitialValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: '',
  city: '',
  message: '',
  comments: [],
  status: 'New',
};
const SalesLeadForm = (props: any) => {
  const [values, setValues] = useState(initialValues);
  const [openAlert, setOpenAlert] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [errors, setErrors] = useState(initialValues);
  const { viewData, mode, setDrawerOpen, isEditing, onEdit } = props;

  useEffect(() => {
    setValues(viewData);
  }, [mode, viewData]);

  //   const handleClickOpenAlert = () => {
  //     setOpenAlert(true);
  //   };

  //   const handleClickCloseAlert = () => {
  //     setOpenAlert(false);
  //   };

  const addValue = (key: keyof InitialValues, newValue: any) => {
    setValues((prevValues: any) => ({
      ...prevValues,
      [key]: newValue,
    }));
  };
  async function handleSubmitForm(event: any) {
    event.preventDefault();
    //   const newErrors: any = {};
    //   if (!values.teamName) newErrors.teamName = 'Team Name is required';
    //   if (!values.contactPerson)
    //     newErrors.contactPerson = 'Consultant Name is required';
    //   if (!values.phone) newErrors.phone = 'Phone Number is required';

    //   if (Object.keys(newErrors).length > 0) {
    //     setErrors(newErrors);
    //     return;
    //   }
    console.log('Submit button clicked');
    try {
      // const res = await createTeam(values);
      // if (res.status === 200) console.log('Create Team', res);
      setDrawerOpen(false);
      console.log('Teams Form submitted successfully', values);
    } catch (error) {
      console.log('An error occurred while saving the form:', error);
    }
  }

  async function handleEditSubmitForm(event: any) {
    event.preventDefault();
    //   console.log('Edit submit clicked', values.createdAt);
    try {
      // const res = await updateTeam(values._id, values);
      // if (res.status === 200) {
      setDrawerOpen(false);
      //   console.log('Team updated successfully', res.data);
      //   onEdit(res.data);
      // }
    } catch (error) {
      console.log('An error occurred while updating the form:', error);
    }
  }
  async function handleDeleteSalesLead(_id: string) {
    console.log('Delete button clicked');
    try {
      const response = await deleteSalesLead(_id);
      if (response.status === 200) {
        console.log('Interview  deleted successfully:', response.data);
        setDrawerOpen(false);
      } else {
        console.error('Failed to delete requirement:', response);
      }
    } catch (error) {
      console.error('An error occurred while deleting the requirement:', error);
    }
  }

  const onAddComment = async (comment: string) => {
    const user = getIUser();
    if (!values._id || !user) return;
    try {
      const name = `${user.firstName} ${user.lastName}`;
      const { data } = await createComment(values._id, {
        comment,
        name,
        commentBy: user.id,
      });
      if (!data.data?.comments.length) {
        return;
      }
      setValues((pre) => ({ ...pre, comments: [...data.data!.comments] }));
    } catch (error) {
      console.log(error);
    }
  };
  const onUpdateComment = async (comment?: SalesLeadComment) => {
    if (!values._id || !comment?._id) return;
    try {
      await updateComment(values._id, comment);
      setValues((pre) => {
        pre.comments = pre.comments.map((c) => {
          if (c._id === comment._id) return comment;
          return c;
        });
        return { ...pre };
      });
      console.log(values);
    } catch (error) {
      console.log(error);
    }
  };
  const onDeleteComment = async (comment?: SalesLeadComment) => {
    if (!comment || !values._id || !comment._id) return;
    try {
      await deleteComment(values._id, comment._id);
      setValues((pre) => {
        pre.comments = pre.comments.filter((c) => c._id !== comment._id);
        return { ...pre };
      });
      console.log(values);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <form style={{ margin: '0 20px' }}>
      <Grid
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1,
          marginRight: 10,
        }}
      >
        {mode === 'add' ? (
          <Button
            variant="contained"
            color="primary"
            type="submit"
            onClick={handleSubmitForm}
            size="small"
            sx={{ borderRadius: '10px' }}
          >
            Submit
          </Button>
        ) : isEditing ? (
          <>
            <Button
              variant="contained"
              color="primary"
              type="button"
              onClick={() => onEdit(false)}
              size="small"
              sx={{ borderRadius: '10px' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              onClick={handleEditSubmitForm}
              size="small"
              sx={{ borderRadius: '10px' }}
            >
              Submit
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="contained"
              color="primary"
              type="button"
              onClick={() => onEdit(true)}
              size="small"
              sx={{ borderRadius: '10px' }}
            >
              Edit
            </Button>
            {user.role === 'super-admin' && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  type="button"
                  size="small"
                  sx={{ borderRadius: '10px' }}
                  onClick={() => setOpenAlert(true)}
                >
                  Delete
                </Button>
                <AlertBox
                  open={openAlert}
                  onAgree={() =>
                    values._id && handleDeleteSalesLead(values._id)
                  }
                  onClose={() => setOpenAlert(false)}
                />
              </>
            )}
          </>
        )}
      </Grid>
      <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
        {/* Section 1: Consultant Info */}
        <Grid item xs={12}>
          <h4>1. Sender Info</h4>
        </Grid>
        <CustomTextField
          label="First name"
          width={220}
          selectedValue={values.firstName}
          error={!!errors.firstName}
          helperText={errors.firstName}
          disabled={!isEditing}
          onChange={(event: any) => addValue('firstName', event.target.value)}
        />
        <CustomTextField
          label="Last name"
          width={220}
          selectedValue={values.lastName}
          error={!!errors.lastName}
          helperText={errors.lastName}
          disabled={!isEditing}
          onChange={(event: any) => addValue('lastName', event.target.value)}
        />
        <CustomTextField
          label="Email"
          width={220}
          selectedValue={values.email}
          error={!!errors.email}
          helperText={errors.email}
          disabled={!isEditing}
          onChange={(event: any) => addValue('email', event.target.value)}
        />
        <CustomTextField
          label="Phone"
          width={220}
          selectedValue={values.phone}
          //   type="number"
          error={!!errors.phone}
          helperText={errors.phone}
          disabled={!isEditing}
          onChange={(event: any) => addValue('phone', event.target.value)}
        />
        <CustomSelectField
          label="Applied For"
          valueOptions={salesLeadStatusOptions}
          disabled={!isEditing}
          selectedValue={values.status}
          onChange={(value: any) => addValue('status', value)}
          width={220}
        />
        <CustomTextField
          label="Country"
          width={220}
          selectedValue={values.country}
          //   type="number"
          error={!!errors.country}
          helperText={errors.country}
          disabled={!isEditing}
          onChange={(event: any) => addValue('country', event.target.value)}
        />
        <CustomTextField
          label="City"
          width={220}
          selectedValue={values.city}
          //   type="number"
          error={!!errors.city}
          helperText={errors.city}
          disabled={!isEditing}
          onChange={(event: any) => addValue('city', event.target.value)}
        />
        <Grid item xs={12}>
          <h4>2. Message</h4>
        </Grid>
        <Grid item xs={12} style={{ padding: '0px', minWidth: 300 }}>
          <CustomTextField
            label="Message"
            width={'98%'}
            selectedValue={values.message}
            //   type="number"
            error={!!errors.message}
            helperText={errors.message}
            disabled={!isEditing}
            onChange={(event: any) => addValue('message', event.target.value)}
          />
        </Grid>

        {mode === 'view' && (
          <>
            <Grid item xs={12}>
              <h4>3. Comments</h4>
            </Grid>

            <Comment
              disabled={false}
              createMode
              onAdd={(cmt) => onAddComment(cmt)}
            />

            {values.comments.sort((a, b) => -1* a.date.localeCompare(b.date)).map((c, i) => {
              console.log(c.date);
              return (
                <Comment
                  key={i}
                  disabled
                  comment={c}
                  onDelete={(comment) => onDeleteComment(comment)}
                  onEdit={(comment) => onUpdateComment(comment)}
                />
              );
            })}
          </>
        )}
      </Grid>
    </form>
  );
};

export default SalesLeadForm;

export interface InitialValues
  extends Omit<iSalesLead, '_id' | 'createdAt' | 'updatedAt'> {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}

const AlertBox = ({ open, onClose, onAgree }: AlertBoxProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{'Delete Consultant?'}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Are you sure you want to delete this Teams? This action cannot be
          undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          Disagree
        </Button>
        <Button onClick={onAgree} autoFocus>
          Agree
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface AlertBoxProps {
  open: boolean;
  onClose: () => void;
  onAgree: () => void;
}
