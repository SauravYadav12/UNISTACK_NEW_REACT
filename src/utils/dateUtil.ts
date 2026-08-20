import {
  AttendanceStatus,
  iUser,
  UserShift,
  WorkLocation,
} from './../Interfaces/iUser';
import mz, { Moment } from 'moment-timezone';
import moment from 'moment';
// import { getJUser } from './utils';

/**
 * Calendar-only date helpers — for fields that conceptually represent
 * a CALENDAR DATE (Date of Birth, Date of Joining, etc.), not an
 * instant in time. The naïve "send string, let Mongoose cast to Date"
 * approach is timezone-broken: `new Date("1991/04/20")` parses as
 * LOCAL midnight which becomes a different UTC instant depending on
 * server TZ, and then `dayjs(stored).format('YYYY/MM/DD')` interprets
 * the ISO back in CLIENT-local TZ. A user picks April 20 in IST, the
 * server in UTC stores 1991-04-20T00:00Z, the client in UTC sees April
 * 19 — classic off-by-one.
 *
 * The fix is to commit to UTC midnight at every boundary:
 *   - SAVE side: `toUtcMidnightISO('1991/04/20')` → '1991-04-20T00:00:00.000Z'
 *   - DISPLAY side: `formatCalendarDate(input, 'YYYY/MM/DD')` → '1991/04/20',
 *     reading UTC components so the same ISO always renders the same
 *     calendar date everywhere.
 */

/**
 * Coerce a calendar-date input (YYYY/MM/DD string, YYYY-MM-DD string,
 * Date, or ISO timestamp) into a UTC-midnight ISO string suitable for
 * sending to the server. Returns '' for empty/invalid input.
 */
export function toUtcMidnightISO(
  input: string | Date | undefined | null,
): string {
  if (!input) return '';
  // Pull out the year/month/day components in the SOURCE's frame:
  //   - String "YYYY/MM/DD" or "YYYY-MM-DD" → split manually so we
  //     never go through new Date() (which would apply local-TZ
  //     parsing rules and reintroduce the bug).
  //   - Date / ISO string → use UTC components so we keep whatever
  //     calendar date the storage already represents in UTC.
  let y: number, m: number, d: number;
  if (typeof input === 'string') {
    const dateOnly = input.split('T')[0];
    const parts = dateOnly.split(/[\/\-]/);
    if (parts.length < 3) return '';
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    d = parseInt(parts[2], 10);
  } else {
    const dt = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(dt.getTime())) return '';
    y = dt.getUTCFullYear();
    m = dt.getUTCMonth() + 1;
    d = dt.getUTCDate();
  }
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return '';
  }
  return new Date(Date.UTC(y, m - 1, d)).toISOString();
}

/**
 * Format a stored calendar-date value (ISO string, Date, or YYYY/MM/DD
 * string) using UTC components — guarantees the same calendar date
 * renders regardless of client TZ.
 *
 * `format` accepts a tiny set of tokens we actually use across the
 * app: YYYY, MM, DD. Anything else passes through verbatim.
 */
export function formatCalendarDate(
  input: string | Date | undefined | null,
  format: string = 'YYYY/MM/DD',
): string {
  if (!input) return '';
  let y: number, m: number, d: number;
  if (typeof input === 'string' && /^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/.test(input)) {
    // Bare YYYY/MM/DD or YYYY-MM-DD — read literally, no parsing.
    const parts = input.split(/[\/\-]/);
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    d = parseInt(parts[2], 10);
  } else {
    const dt = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(dt.getTime())) return '';
    y = dt.getUTCFullYear();
    m = dt.getUTCMonth() + 1;
    d = dt.getUTCDate();
  }
  return format
    .replace('YYYY', String(y))
    .replace('MM', String(m).padStart(2, '0'))
    .replace('DD', String(d).padStart(2, '0'));
}

export const officeStartTimeInEst = { h: 9, m: 0 };
export const officeStartTimeInIst = { h: 10, m: 0 };
export const presentThresholdMinutes = 15;
export const lateThresholdMinutes = 1.5 * 60;
export const notApplicableThresholdMinutes = 4 * 60;

export enum TimeZone {
  PST = 'America/Los_Angeles',
  CST = 'America/Chicago',
  MST = 'America/Denver',
  EST = 'America/New_York',
  IST = 'Asia/Kolkata',
}

export function handleZone(shift: UserShift, date: Moment = moment()) {
  let tz = TimeZone.IST;
  if (shift === UserShift.US) {
    tz = TimeZone.EST;
  }
  return mz(date).tz(tz);
}

export function dateByUserShift(shift: UserShift, date: Moment = moment()) {
  return handleZone(shift, date);
}

export function timeByUserShift(shift: UserShift, date: Moment = moment()) {
  return handleZone(shift, date);
}

export function getOfficeStartTime(shift: UserShift) {
  return shift === UserShift.US ? officeStartTimeInEst : officeStartTimeInIst;
}

function timeElapsedSinceOfficeStart(
  shift: UserShift,
  date: Moment = dateByUserShift(shift)
) {
  const { h, m } = getOfficeStartTime(shift);
  const workingHourStart = date.clone();
  workingHourStart.hour(h).minute(m).second(0).millisecond(0);

  const delayInMilliseconds = date.valueOf() - workingHourStart.valueOf();
  // returns elapsed time in minutes
  return Math.round(delayInMilliseconds / (1000 * 60));
}

export function timeRemainingUntilOfficeEnd(
  shift: UserShift,
  date: Moment = dateByUserShift(shift)
) {
  const workingTimeThresholdMinutes = 9 * 60;
  const timeElapsedInMinutes = timeElapsedSinceOfficeStart(shift, date);
  // returns remaining time in minutes
  const timeremaining = workingTimeThresholdMinutes - timeElapsedInMinutes;
  return timeremaining > 0 ? timeremaining : 0;
}

export function getAttendanceStatus(
  user: iUser,
  date: Moment = dateByUserShift(user.shift)
) {
  if (user.workLocation === WorkLocation.Home) return AttendanceStatus.Present;

  const delayInMinutes = timeElapsedSinceOfficeStart(user.shift, date);

  if (delayInMinutes <= presentThresholdMinutes) {
    return AttendanceStatus.Present;
  } else if (
    delayInMinutes > presentThresholdMinutes &&
    delayInMinutes <= lateThresholdMinutes
  ) {
    return AttendanceStatus.Late;
  } else if (
    lateThresholdMinutes < delayInMinutes &&
    delayInMinutes <= notApplicableThresholdMinutes
  ) {
    return AttendanceStatus['Half-Day'];
  }
  return;
}

export function getTimeZoneKey(zone: string) {
  for (const [key, iZone] of Object.entries(TimeZone)) {
    if (zone === iZone) return key;
  }
}
export function timeZoneKeyByUserShift(shift: UserShift) {
  let tzKey = 'IST';
  if (shift === UserShift.US) {
    tzKey = 'EST';
  }
  return tzKey;
}

export function getWorkingDuration(
  checkIn: string,
  checkOut: string,
  // Kept for call-site compatibility; the duration between two absolute
  // instants is timezone-independent so the shift is no longer needed.
  _shift?: UserShift
) {
  // Absolute-instant diff. The previous implementation extracted the wall-
  // clock hours/minutes and re-pinned both onto today's start-of-day before
  // subtracting — which produced wrong/negative durations for any session
  // that crossed midnight (e.g. 1:27 PM → 3:27 AM = 14h computed as −10h).
  const ms = moment(checkOut).diff(moment(checkIn));
  if (!(ms > 0)) return '0h 0m';
  const duration = moment.duration(ms);
  const hours = Math.floor(duration.asHours());
  const minutes = Math.floor(duration.asMinutes()) % 60;
  return `${hours}h ${minutes}m`;
}

export function getDatesBetween(startDate: string, endDate: string) {
  const dates = [];
  const currentDate = moment(startDate);
  const lastDate = moment(endDate);

  while (currentDate <= lastDate) {
    dates.push(currentDate);
    currentDate.add(1, 'days');
  }

  return dates;
}
