import { AttendanceStatus, UserShift } from './../Interfaces/iUser';
import mz, { Moment } from 'moment-timezone';
import moment from 'moment';

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

export function handleAttendanceStatus(
  shift: UserShift,
  date: Moment = dateByUserShift(shift)
) {
  const delayInMinutes = timeElapsedSinceOfficeStart(shift, date);

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
