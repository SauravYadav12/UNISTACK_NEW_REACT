import dayjs from 'dayjs';
import { dateFormate } from '../../../components/constants';
import { RequirementStatus } from '../../../Interfaces/reports';
import { validateEmail, ValidationMeta } from '../../../utils/validators';

export const requestStatusOptions: RequirementStatus[] = [
  'New Working',
  'Submitted',
  'Interviewed',
  'Cancelled',
  'Project Active',
  'Project Inactive',
];

export const requirementFormInitialValues = {
  reqStatus: requestStatusOptions[0] || '',
  assignedTo: '',
  assignedToRef: '',
  appliedFor: '',
  appliedForRef: '',
  reqForm: '',
  primaryTechStack: '',
  resumeUpload: '',
  nextStep: '',
  taxType: '',
  rate: '',
  remote: '',
  duration: '',
  mComment: [],
  clientCompany: '',
  clientWebsite: '',
  clientAddress: '',
  clientPerson: '',
  clientPhone: '',
  clientEmail: '',
  primeVendorCompany: '',
  primeVendorWebsite: '',
  primeVendorName: '',
  primeVendorPhone: '',
  primeVendorEmail: '',
  vendorCompany: '',
  vendorWebsite: '',
  vendorPersonName: '',
  vendorPhone: '',
  vendorEmail: '',
  gotReqFrom: '',
  primaryTech: '',
  jobTitle: '',
  employmentType: '',
  jobPortalLink: '',
  reqEnteredBy: '',
  reqEnteredByRef: '',
  secondaryTech: '',
  jobDescription: '',
};

export const reqirementStatusColors: ReqirementStatusColors = {
  'New Working': '#1976D2',
  Submitted: '#4CAF50',
  Interviewed: '#03A9F4',
  Cancelled: '#D32F2F',
  'Project Active': '#9C27B0',
  'Project Inactive': '#9E9E9E',
};

export const taxTypeOptions = [
  'C2C',
  '1099',
  'W2 With vendor',
  'W2 With client',
];

export const gotRequirementForm = [
  'Got from online Resume',
  "Received on consultant's Email",
  'Got through Job Portal',
];

export const techStack = [
  'Java',
  'Ruby',
  'React',
  'Angular',
  'Node',
  'PHP',
  'Python',
  'Dot Net',
  'MERN',
  'MEAN',
  'AWS',
  'Go Lang',
  'React Native',
  'Laravel',
  'Flutter',
  'SAP Consultant',
  'ETL',
  'QA/Tester',
  'Azure',
  'Other Frontend',
];

export const duration = ['03 Months', '06 Months', '12 Months', '12+ Months'];

export const requirementValidationMeta: ValidationMeta[] = [
  { field: 'reqStatus', required: true },
  { field: 'assignedTo', required: true },
  { field: 'jobDescription', required: true },
  { field: 'vendorCompany', required: true },
  { field: 'vendorPersonName', required: true },
  { field: 'clientEmail', validate: validateEmail },
  { field: 'primeVendorEmail', validate: validateEmail },
  { field: 'vendorEmail', validate: validateEmail },
  {
    field: 'createdAt',
    transform(value: any) {
      return value ? dayjs(value).format(dateFormate) : null;
    },
  },
];

type ReqirementStatusColors = {
  [key in RequirementStatus]: string;
};
