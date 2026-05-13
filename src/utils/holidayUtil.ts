import moment from 'moment';
import { dateFormate } from '../components/constants';
import { AttendanceStatus, UserShift } from '../Interfaces/iUser';
import { Holiday } from '../Interfaces/holiday';

export type iHolidayStatus = 'Holiday';
export const HolidayStatus: iHolidayStatus = 'Holiday';

/**
 * Map a user's shift to the holiday country code the DB stores. India shift
 * → "IN", US shift → "US". Used by `holidaysForUserShift` below so each
 * employee only sees the public-holiday set that applies to their shift,
 * plus any "ALL" holidays the super-admin marked as org-wide.
 */
export function holidayCountryForShift(shift: UserShift): 'IN' | 'US' {
  return shift === UserShift.India ? 'IN' : 'US';
}

/**
 * Filter a list of holidays down to the ones an employee on `shift` should
 * see in their calendar / attendance / leave overlay:
 *   - country === user's shift country (IN or US)
 *   - country === "ALL" (super-admin marked it applicable to both shifts)
 *   - country missing / undefined → treat as "ALL" for legacy rows created
 *     before the country field landed.
 */
export function holidaysForUserShift(
  holidays: Holiday[],
  shift: UserShift | undefined,
): Holiday[] {
  if (!shift) return holidays;
  const mine = holidayCountryForShift(shift);
  return holidays.filter((h) => {
    const c = h.country || 'ALL';
    return c === 'ALL' || c === mine;
  });
}

export const isHolidayMarked = (
  holidays: Holiday[],
  fromDate?: string,
  toDate?: string,
  excludeId?: string,
  /**
   * Optional country scope. When set, overlap is only checked against
   * holidays whose `country` matches `scope` OR is "ALL" (since "ALL"
   * applies to every shift and therefore always conflicts). Lets a US
   * holiday and an India holiday coexist on the same calendar date.
   */
  scope?: 'IN' | 'US' | 'ALL',
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

    if (scope) {
      const c = holiday.country || 'ALL';
      // A holiday in a different country scope can share the same date
      // without conflict. "ALL" always conflicts (because it applies to
      // every shift, so any new entry would double up for at least one
      // shift's calendar).
      if (scope !== 'ALL' && c !== 'ALL' && c !== scope) return false;
    }

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
