import { AttendanceStatus, UserShift } from './../Interfaces/iUser';
import mz, { Moment } from 'moment-timezone';
import moment from 'moment';

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

export function handleAttendanceStatus(
  shift: UserShift,
  date: Moment = dateByUserShift(shift)
) {
  const { h, m } = shift === UserShift.US ? { h: 9, m: 0 } : { h: 10, m: 0 };
  const workingHourStart = date.clone();
  workingHourStart.hour(h).minute(m).second(0).millisecond(0);

  // Calculate the delay in milliseconds
  const delayInMilliseconds = date.valueOf() - workingHourStart.valueOf();
  const delayInMinutes = Math.round(delayInMilliseconds / (1000 * 60));

  const presentThresholdMinutes = 15;
  const lateThresholdMinutes = 1.5 * 60;
  const notApplicableThresholdMinutes = 8 * 60;

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
