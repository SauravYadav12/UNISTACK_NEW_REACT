import {
  AttendanceStatus,
  jUser,
  UserShift,
  WorkLocation,
} from './../Interfaces/iUser';
import mz, { Moment } from 'moment-timezone';
import moment from 'moment';
import { getJUser } from './utils';

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
  user: jUser,
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

export function getWorkingDuration(checkIn: string, checkOut: string) {
  const shift = getJUser()?.shift;
  if (!shift) return;
  const checkinTime = timeByUserShift(shift, moment(checkIn));
  const checkoutTime = timeByUserShift(shift, moment(checkOut));

  // Extract time components (hours and minutes)
  const checkinHours = checkinTime.hours();
  const checkinMinutes = checkinTime.minutes();
  const checkoutHours = checkoutTime.hours();
  const checkoutMinutes = checkoutTime.minutes();

  // Create Moment objects for the same day to calculate the difference
  const startOfDay = moment().startOf('day'); // Represents the beginning of the current day
  const startCheckin = startOfDay
    .clone()
    .hours(checkinHours)
    .minutes(checkinMinutes)
    .seconds(0)
    .milliseconds(0);
  const startCheckout = startOfDay
    .clone()
    .hours(checkoutHours)
    .minutes(checkoutMinutes)
    .seconds(0)
    .milliseconds(0);

  // Calculate the difference in milliseconds
  const differenceInMilliseconds = startCheckout.diff(startCheckin);
  const duration = moment.duration(differenceInMilliseconds);

  const hours = Math.floor(duration.asHours());
  const minutes = Math.floor(duration.asMinutes()) % 60;

  return `${hours}h ${minutes}m`;
}
