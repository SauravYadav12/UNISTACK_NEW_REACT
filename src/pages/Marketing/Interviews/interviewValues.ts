import dayjs from 'dayjs';
import { dateFormate, timeFormate } from '../../../components/constants';
import { ValidationMeta } from '../../../utils/validators';

export const timeZoneOptions = ['EST', 'CST', 'MST', 'PST'];
export const createInterviewQueryParam = 'createInterviewByReq';
export const intTypeOptions = [
  'Technical',
  'Techno Managerial',
  'Non Technical',
  'Prep Call',
];

export const intStatusOptions = [
  'Interview Tentative',
  'Interview Confirm',
  'Interview Cancelled',
  'Interview Re-Scheduled',
  'Interview Completed',
];

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

export const interviewFormInitialValues = {
  timeShift: '',
  timeZone: '',
  interviewType: '',
  interviewStatus: intStatusOptions[0] || '',
  interviewWith: '',
  intResult: '',
  interviewRound: '',
  interviewViaMode: '',
  meetingType: '',
  interviewDuration: '',
  interviewDate: null,
  interviewTime: null,
  consultant: '',
  marketingPerson: '',
  vendorCompany: '',
  primeVendorCompany: '',
  codeLink: '',
  tentativeReason: '',
  remarks: '',
  subjectLine: '',
  interviewMode: '',
  interviewLink: '',
  interviewFocus: '',
  specialNote: '',
  interviewFeedback: '',
  jobTitle: '',
  reqID: '',
  clientName: '',
  taxType: '',
  duration: '',
  candidateName: '',
  rateForInterview: '',
  paymentStatus: '',
  jobDescription: '',
  script: '',
};

export const interviewValidationMeta: ValidationMeta[] = [
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
