export interface Holiday {
  _id: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
  description?: string;
  fromDate: string;
  toDate: string;
  isHalfDay: boolean;
  halfDayType?: boolean;
}
