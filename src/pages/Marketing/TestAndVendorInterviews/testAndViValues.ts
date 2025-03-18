import dayjs from 'dayjs';
import { dateFormate, timeFormate } from '../../../components/constants';
import { InterviewStatus } from '../../../Interfaces/reports';
import { ValidationMeta } from '../../../utils/validators';

export const timeZoneOptions = ['EST', 'CST', 'MST', 'PST'];

export const intTypeOptions = [
  'Technical',
  'Techno Managerial',
  'Non Technical',
  'Prep Call',
];

export const intStatusOptions: InterviewStatus[] = [
  'Interview Tentative',
  'Interview Confirm',
  'Interview Cancelled',
  'Interview Completed',
  'Interview Re-Scheduled',
];
export const interviewStatusColors: InterviewStatusColors = {
  'Interview Confirm': '#1976D2',
  'Interview Tentative': '#9E9E9E',
  'Interview Cancelled': '#D32F2F',
  'Interview Completed': '#4CAF50',
  'Interview Re-Scheduled': 'black',
};

export const intWithOptions = ['Client', 'IMP/PV', 'Vendor'];

export const resultOptions = [
  'Offer',
  'Negative',
  'Positive',
  'No Feedback yet',
];

export const intRoundOptions = [
  'Round 1',
  'Round 2',
  'Round 3',
  'Round 4',
  'Final Round',
];

export const intModeOptions = [
  'Not Confirmed',
  'Phone',
  'Video',
  'Video + Coding',
];

export const meetingTypeOptions = [
  'Not Confirmed',
  'Audio',
  'Google Meet',
  'Zoom',
  'Microsoft Teams',
  'Webex',
  'Flocareer',
];

export const intDurationOptions = [
  '15 Min',
  '30 Min',
  '45 Min',
  '1 Hour',
  '2 Hour',
  '3 Hour',
];

export const paymentStatusOptions = ['Paid', 'Not Paid'];

type InterviewStatusColors = {
  [key in InterviewStatus]: string;
};

export const vendorInterviewValidationMeta: ValidationMeta[] = [
  {
    field: 'interviewDate',
    required: true,
    transform(value: any) {
      return value ? dayjs(value).format(dateFormate) : null;
    },
  },
  {
    field: 'interviewTime',
    required: true,
    transform(value: any) {
      return value ? dayjs(value).format(timeFormate) : null;
    },
  },
  {
    field: 'interviewType',
    required: true,
  },
  {
    field: 'interviewWith',
    required: true,
  },
  {
    field: 'interviewViaMode',
    required: true,
  },
  {
    field: 'interviewDuration',
    required: true,
  },
];
