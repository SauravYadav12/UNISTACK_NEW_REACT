import React, { useEffect, useState } from 'react';
import { iSalesLead } from '../../../Interfaces/salesLeads';
import {
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import CustomTextField from '../../../components/text_field/CustomTextField';
import {
  createComment,
  deleteSalesLead,
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

  const addValue = (key: keyof InitialValues, newValue: any) => {
    setValues((prevValues: any) => ({
      ...prevValues,
      [key]: newValue,
    }));
  };

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
              onAgree={() => values._id && handleDeleteSalesLead(values._id)}
              onClose={() => setOpenAlert(false)}
            />
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
          disabled
        />
        <CustomTextField
          label="Last name"
          width={220}
          selectedValue={values.lastName}
          disabled
        />
        <CustomTextField
          label="Email"
          width={220}
          selectedValue={values.email}
          disabled
        />
        <CustomTextField
          label="Phone"
          width={220}
          selectedValue={values.phone}
          disabled
        />
        <CustomSelectField
          label="Status"
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
          disabled
        />
        <CustomTextField
          label="City"
          width={220}
          selectedValue={values.city}
          disabled
        />
        <Grid item xs={12}>
          <h4>2. Message</h4>
        </Grid>
        <Grid item xs={12} style={{ padding: '0px', minWidth: 300 }}>
          <CustomTextField
            label="Message"
            width={'98%'}
            selectedValue={values.message}
            disabled
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

            {values.comments
              .sort((a, b) => -1 * a.date.localeCompare(b.date))
              .map((c, i) => {
                return <Comment key={i} disabled comment={c} />;
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
      <DialogTitle id="alert-dialog-title">{'Delete'}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Are you sure you want to delete this sales lead? This action cannot be
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
