
export interface Shift {
  id: string;
  username: string;
  day: number; // 0-6
  scheduledDate: string; // DD/MM/YYYY
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  timestamp: number;
}

export interface ShiftFormData {
  username: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
}

export interface ClubBooking {
  id: string;
  name: string;
  apartment: number;
  scheduledDate: string; // DD/MM/YYYY
  day: number; // 0-6
  chairs: number;
  tables: number;
  clubReserved: boolean;
  timestamp: number;
}
