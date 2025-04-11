import React from 'react';
import CustomDrawer from '../drawer/CustomDrawer';
import InterviewForm from '../../pages/Marketing/Interviews/InterviewForm';
interface iProps {
  open: boolean;
  interview?: any;
  onClose: () => void;
}
const InterviewDrawer = ({ interview, open, onClose }: iProps) => {
  return (
    <>
      <CustomDrawer
        title={'Interview : ' + interview?.intId}
        open={open}
        onClose={onClose}
        closeOnOutSideClick
      >
        <>{interview && <InterviewForm viewData={interview} hideButtons />}</>
      </CustomDrawer>
    </>
  );
};

export default InterviewDrawer;
