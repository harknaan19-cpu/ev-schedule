
import React, { useState, useEffect, useRef } from 'react';
import { Shift } from '../types';
import { isShiftOverlap, isPastShift, getShiftTimes } from '../utils/dateTime';
import { shiftsRef, set, ref, db } from '../firebase';

interface ShiftFormProps {
  existingShifts: Shift[];
  onSuccess: () => void;
  onCancel: () => void;
}

const ShiftForm: React.FC<ShiftFormProps> = ({ existingShifts, onSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    const d = today.getDate().toString().padStart(2, '0');
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  });
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('06:00');
  const [error, setError] = useState<string | null>(null);
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dateInputRef.current) {
      // @ts-ignore
      flatpickr(dateInputRef.current, {
        locale: 'he',
        dateFormat: 'd/m/Y',
        minDate: 'today',
        disableMobile: true,
        animate: true,
        position: "auto",
        onChange: (selectedDates: Date[]) => {
          if (selectedDates.length > 0) {
            const d = selectedDates[0];
            const formatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
            setDate(formatted);
          }
        }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !date || !startTime || !endTime) {
      setError('יש למלא את כל השדות');
      return;
    }

    if (isPastShift(date, startTime)) {
      setError('לא ניתן לקבוע משמרת בעבר');
      return;
    }

    if (isShiftOverlap({ scheduledDate: date, startTime, endTime }, existingShifts)) {
      setError('קיימת חפיפה עם משמרת אחרת');
      return;
    }

    try {
      const [d, m, y] = date.split('/').map(Number);
      const dayIndex = new Date(y, m - 1, d).getDay();
      const { start } = getShiftTimes(date, startTime, endTime);
      
      const key = `${username}-${date.replace(/\//g, '-')}-${startTime.replace(/:/g, '')}-${endTime.replace(/:/g, '')}`;
      const newShiftRef = ref(db, `schedule-v3/${key}`);

      await set(newShiftRef, {
        username,
        day: dayIndex,
        scheduledDate: date,
        startTime,
        endTime,
        timestamp: start.getTime()
      });

      setUsername('');
      const resetToday = new Date();
      const resetD = resetToday.getDate().toString().padStart(2, '0');
      const resetM = (resetToday.getMonth() + 1).toString().padStart(2, '0');
      const resetY = resetToday.getFullYear();
      setDate(`${resetD}/${resetM}/${resetY}`);
      setStartTime('22:00');
      setEndTime('06:00');
      if (dateInputRef.current) {
        // @ts-ignore
        dateInputRef.current._flatpickr.clear();
      }
      
      onSuccess();
    } catch (err) {
      setError('שגיאה בשמירת הנתונים');
      console.error(err);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl focus:ring-4 focus:ring-sky-500/10 dark:focus:ring-sky-400/10 focus:border-sky-500 dark:focus:border-sky-400 outline-none text-slate-900 dark:text-white transition-all font-medium placeholder:text-slate-400 shadow-sm";
  const timeInputClasses = "w-full px-2 md:px-4 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl focus:ring-4 focus:ring-sky-500/10 dark:focus:ring-sky-400/10 focus:border-sky-500 dark:focus:border-sky-400 outline-none text-slate-900 dark:text-white transition-all font-medium text-sm md:text-base shadow-sm";

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">הוספת משמרת טעינה</h2>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">מלא את הפרטים למטה</p>
          </div>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-xl transition-colors text-slate-400"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClasses}
              placeholder="מי המטעין?"
            />
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                ref={dateInputRef}
                className={`${inputClasses} cursor-pointer pl-12`}
                placeholder="בחר תאריך"
                readOnly
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 md:gap-6" dir="ltr">
              <div className="relative flex-1 min-w-0">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  step="900"
                  className={timeInputClasses}
                />
              </div>
              
              <svg className="w-5 h-5 md:w-8 md:h-8 text-sky-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>

              <div className="relative flex-1 min-w-0">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  step="900"
                  className={timeInputClasses}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 md:px-8 py-4 md:py-5 rounded-2xl font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 transition-all duration-300 text-sm md:text-base"
          >
            ביטול
          </button>
          <button
            type="submit"
            className="flex-[2] bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-600 text-white font-black py-4 md:py-5 px-4 md:px-8 rounded-2xl shadow-xl shadow-slate-900/20 dark:shadow-sky-500/20 transition-all duration-300 text-base md:text-lg flex items-center justify-center gap-2 md:gap-3 group"
          >
            <span className="tracking-tight">הוסף</span>
            <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </form>
      
      {error && (
        <div className="mt-8 p-5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-black border border-rose-100 dark:border-rose-900/30 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-10a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          </div>
          {error}
        </div>
      )}
    </div>
  );
};

export default ShiftForm;
