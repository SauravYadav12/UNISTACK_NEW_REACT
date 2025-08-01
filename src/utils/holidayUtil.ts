import moment from 'moment';
import { dateFormate } from '../components/constants';
import { AttendanceStatus } from '../Interfaces/iUser';
import { Holiday } from '../Interfaces/holiday';

export type iHolidayStatus = 'Holiday';
export const HolidayStatus: iHolidayStatus = 'Holiday';

export const isHolidayMarked = (
  holidays: Holiday[],
  fromDate?: string,
  toDate?: string,
  excludeId?: string
) => {
  if (!fromDate && !toDate) {
    throw new Error('At least one date (fromDate or toDate) is required');
  }

  if (fromDate && !moment(fromDate, dateFormate, true).isValid())
    throw new Error('fromDate formate should be YYYY/MM/DD');
  if (toDate && !moment(toDate, dateFormate, true).isValid())
    throw new Error('toDate formate should be YYYY/MM/DD');

  if (fromDate && toDate && fromDate > toDate) {
    throw new Error('fromDate cannot be after toDate');
  }

  return holidays.find((holiday) => {
    if (excludeId && holiday._id === excludeId) return false;

    const existingFrom = holiday.fromDate;
    const existingTo = holiday.toDate;

    if (fromDate && toDate) {
      return (
        (fromDate <= existingTo && toDate >= existingFrom) ||
        (fromDate <= existingFrom && toDate >= existingTo)
      );
    } else if (fromDate) {
      return fromDate >= existingFrom && fromDate <= existingTo;
    } else if (toDate) {
      return toDate >= existingFrom && toDate <= existingTo;
    }

    return false;
  });
};

export function getStatusShortForm(status: AttendanceStatus | iHolidayStatus) {
  return status === HolidayStatus ? 'PH' : status?.charAt(0).toUpperCase();
}
