import { useEffect, useState } from 'react';
import { Grid, Button } from '@mui/material';
import CustomTextField from '../../../components/text_field/CustomTextField';
import {
  createComment,
  deleteSalesLead,
} from '../../../services/salesLeadsApi';
import Comment from '../../../components/salesLead/Comment';
import CustomSelectField from '../../../components/select/CustomSelectField';
import { salesLeadInitialValues, salesLeadStatusOptions } from './constants';
import { Country } from 'country-state-city';
import AlertBox from '../../../components/alert/AlertBox';
import { toast } from 'react-toastify';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import { FormMode } from '../Requirements/Requirements';
import { iSalesLead } from '../../../Interfaces/salesLeads';
import { UserRole } from '../../../Interfaces/iUser';

interface iProps {
  viewData?: iSalesLead;
  mode: FormMode;
  setDrawerOpen: (open: boolean) => void;
  isEditing: boolean;
  onEdit: (data: iSalesLead) => void;
  onDelete: (id: string) => void;
}

const SalesLeadForm = (props: iProps) => {
  const [values, setValues] = useState<Partial<iSalesLead>>(
    salesLeadInitialValues
  );
  const [openAlert, setOpenAlert] = useState(false);
  const user = useAuth().iUser!;
  const { viewData, mode, setDrawerOpen, isEditing, onEdit, onDelete } = props;

  useEffect(() => {
    setValues(viewData || {});
  }, [mode, viewData]);

  const addValue = (key: keyof iSalesLead, newValue: string) => {
    setValues((prevValues) => ({
      ...prevValues,
      [key]: newValue,
    }));
  };

  async function handleDeleteSalesLead(_id: string) {
    try {
      await deleteSalesLead(_id);
      setDrawerOpen(false);
      onDelete(_id);
    } catch (error) {
      toast.error('Failed to delete');
      console.error('An error occurred while deleting the requirement:', error);
    }
  }

  const onAddComment = async (comment: string) => {
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
      setValues(data.data);
      onEdit(data.data);
    } catch (error) {
      toast.error('Something went wrong');
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
        {user.role.includes(UserRole['super-admin']) && (
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
              title="Delete"
              description="Are you sure you want to delete this requirement? This
                      action cannot be undone."
              onOk={() => values._id && handleDeleteSalesLead(values._id)}
              onClose={() => setOpenAlert(false)}
            />
          </>
        )}
      </Grid>
      <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
        <Grid size={12}>
          <h4>1. Sender Info</h4>
        </Grid>
        <CustomTextField
          label="First name"
          width={220}
          selectedValue={values.firstName || ''}
          disabled
        />
        <CustomTextField
          label="Last name"
          width={220}
          selectedValue={values.lastName || ''}
          disabled
        />
        <CustomTextField
          label="Email"
          width={220}
          selectedValue={values.email || ''}
          disabled
        />
        <CustomTextField
          label="Phone"
          width={220}
          selectedValue={values.phone || 'NA'}
          disabled
        />

        <CustomTextField
          label="Country"
          width={220}
          selectedValue={`${Country.getCountryByCode(values.country || '')?.name} (${
            values.country
          })`}
          disabled
        />
        <CustomTextField
          label="City"
          width={220}
          selectedValue={values.city || ''}
          disabled
        />
        <Grid size={12}>
          <h4>2. Message</h4>
        </Grid>
        <Grid size={12} style={{ padding: '0px', minWidth: 300 }}>
          <CustomTextField
            label="Message"
            width={'98%'}
            selectedValue={values.message || ''}
            disabled
          />
        </Grid>
        <Grid size={12}>
          <h4>3. Status</h4>
        </Grid>
        <CustomSelectField
          label="Status"
          valueOptions={salesLeadStatusOptions}
          disabled={!isEditing}
          selectedValue={values.status || ''}
          onChange={(value) => addValue('status', value)}
          width={220}
        />
        <CustomTextField
          label="Assigned To"
          width={220}
          selectedValue={values.assignedTo || ''}
          disabled
        />

        {mode === 'view' && (
          <>
            <Grid size={12}>
              <h4>4. Comments</h4>
            </Grid>

            <Comment
              disabled={false}
              createMode
              onAdd={(cmt) => onAddComment(cmt)}
            />

            {values.comments
              ?.sort((a, b) => -1 * a.date.localeCompare(b.date))
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
