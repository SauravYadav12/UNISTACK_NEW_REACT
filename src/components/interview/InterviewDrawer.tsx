import React, { useState } from 'react';
import CustomDrawer from '../drawer/CustomDrawer';
import InterviewForm from '../../pages/Marketing/Interviews/InterviewForm';
import { FormMode } from '../../pages/Marketing/Requirements/Requirements';
import { SetResults } from '../../hooks/paginationHook';
import TestAndVendorForm from '../../pages/Marketing/TestAndVendorInterviews/TestAndVendorForm';
interface iProps {
  open: boolean;
  interview?: any;
  onClose: () => void;
  setData: SetResults;
}
const InterviewDrawer = ({ interview, open, setData, onClose }: iProps) => {
  const [mode, setMode] = useState<FormMode>('view');
  const handleEdit = (editMode: boolean) => {
    setMode(editMode ? 'edit' : 'view');
  };
  return (
    <>
      <CustomDrawer
        title={
          (interview?.testID ? 'Vendor interview' : 'Interview') +
          ' : ' +
          (interview?.intId || interview?.testID)
        }
        open={open}
        onClose={onClose}
        closeOnOutSideClick
      >
        <>
          {interview?.intId && (
            <InterviewForm
              disableDelete
              viewData={interview}
              mode={mode}
              isEditing={mode !== 'view'}
              onDrawerClose={() => setMode('view')}
              onEdit={handleEdit}
              setResults={setData}
            />
          )}
          {interview?.testID && (
            <TestAndVendorForm
              disableDelete
              viewData={interview}
              mode={mode}
              isEditing={mode !== 'view'}
              onDrawerClose={() => setMode('view')}
              onEdit={handleEdit}
              setResults={setData}
            />
          )}
        </>
      </CustomDrawer>
    </>
  );
};

export default InterviewDrawer;
