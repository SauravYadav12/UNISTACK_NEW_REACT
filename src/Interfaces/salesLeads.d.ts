export interface iSalesLead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  message: string;
  status: iSalesLeadStatus;
  comments: SalesLeadComment[];
  createdAt: string;
  updatedAt: string;
}

export type iSalesLeadStatus =
  | 'New'
  | 'Contacted'
  | 'HotLead'
  | 'Cold Lead'
  | 'Converted'
  | 'Closed'
  | 'Bad Lead';

export interface SalesLeadComment {
  _id?:string
  name: string;
  date: string;
  comment: string;
  commentBy:string
}
