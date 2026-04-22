export interface IOrganization {
  _id: string;
  orgId: string;
  name: string;
  shortCode: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  einNumber?: string;
  logoUrl?: string;
  active: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}
