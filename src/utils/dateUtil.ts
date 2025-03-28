import { AttendanceStatus, UserShift } from './../Interfaces/iUser';
import mz from 'moment-timezone';
import { dateFormate, timeFormate } from '../components/constants';

export enum TimeZone {
  PST = 'America/Los_Angeles',
  CST = 'America/Chicago',
  MST = 'America/Denver',
  EST = 'America/New_York',
  IST = 'Asia/Kolkata',
}

export function handleZone(shift: UserShift, date: Date | string = new Date()) {
  let tz = TimeZone.IST;
  if (shift === UserShift.US) {
    tz = TimeZone.EST;
  }
  return mz(date).tz(tz);
}

export function dateByUserShift(
  shift: UserShift,
  date: Date | string = new Date()
) {
  return handleZone(shift, date).format(dateFormate);
}

export function timeByUserShift(
  shift: UserShift,
  date: Date | string = new Date()
) {
  return handleZone(shift, date).format(timeFormate);
}

export function handleAttendanceStatus(shift: UserShift, date: Date=new Date()) {
  const h = shift === UserShift.US ? 18 : 10;
  const m = shift === UserShift.US ? 30 : 0;
  const workingHourStart = new Date();
  workingHourStart.setHours(h, m, 0, 0);
  const delayInMilliseconds = date.getTime() - workingHourStart.getTime();
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

