
import { Shift } from '../types';

export const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/**
 * Converts "DD/MM/YYYY" and "HH:mm" to a Date object.
 * Handles overnight shifts by checking if end time is before start time.
 */
export const getShiftTimes = (dateStr: string, startTime: string, endTime: string) => {
  const [day, month, year] = dateStr.split('/').map(Number);
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const start = new Date(year, month - 1, day, startH, startM);
  let end = new Date(year, month - 1, day, endH, endM);

  // If end time is earlier than start time, it's an overnight shift (ends next day)
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return { start, end };
};

export const isShiftOverlap = (newShift: { scheduledDate: string, startTime: string, endTime: string }, existingShifts: Shift[]) => {
  const newRange = getShiftTimes(newShift.scheduledDate, newShift.startTime, newShift.endTime);

  for (const shift of existingShifts) {
    const existingRange = getShiftTimes(shift.scheduledDate, shift.startTime, shift.endTime);

    // Overlap condition: (StartA < EndB) AND (EndA > StartB)
    if (newRange.start < existingRange.end && newRange.end > existingRange.start) {
      return true;
    }
  }
  return false;
};

export const isPastShift = (dateStr: string, startTime: string) => {
  const [day, month, year] = dateStr.split('/').map(Number);
  const [h, m] = startTime.split(':').map(Number);
  const start = new Date(year, month - 1, day, h, m);
  return start < new Date();
};

export const formatDate = (date: Date): string => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};
