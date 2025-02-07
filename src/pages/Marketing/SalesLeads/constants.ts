import { iSalesLead, iSalesLeadStatus } from '../../../Interfaces/salesLeads';

export const salesLeadStatusOptions: iSalesLeadStatus[] = [
  'New',
  'Contacted',
  'HotLead',
  'Cold Lead',
  'Converted',
  'Closed',
  'Bad Lead',
];

export const salesLeadInitialValues: SalesLeadInitialValues = {
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

export interface SalesLeadInitialValues
  extends Omit<iSalesLead, '_id' | 'createdAt' | 'updatedAt'> {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}
