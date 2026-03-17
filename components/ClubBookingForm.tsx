import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ClubBooking } from '../types';
import { set, ref, db } from '../firebase';

const MAX_CHAIRS = 25;
const MAX_TABLES = 4;
const CHAIR_OPTIONS = [5, 10, 15, 20, 25];
const TABLE_OPTIONS = [1, 2, 3, 4];

interface ClubBookingFormProps {
  existingBookings: ClubBooking[];
  onSuccess: () => void;
  onCancel: () => void;
}

const ClubBookingForm: React.FC<ClubBookingFormProps> = ({ existingBookings, onSuccess, onCancel }) => {
  // Freeze bookings at the time the form opens — ignore real-time updates while form is open
  const [frozenBookings] = useState(() => existingBookings);
  const [name, setName] = useState('');
  const [apartment, setApartment] = useState<number>(1);
  const [date, setDate] = useState(() => {
    const today = new Date();
    const d = today.getDate().toString().padStart(2, '0');
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  });
  const [chairs, setChairs] = useState(0);
  const [tables, setTables] = useState(0);
  const [clubReserved, setClubReserved] = useState(true);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);

  // Calculate what's already booked for the selected date (from frozen snapshot)
  const dateBookings = useMemo(() => {
    return frozenBookings.filter(b => b.scheduledDate === date);
  }, [frozenBookings, date]);

  const usedChairs = useMemo(() => dateBookings.reduce((sum, b) => sum + b.chairs, 0), [dateBookings]);
  const usedTables = useMemo(() => dateBookings.reduce((sum, b) => sum + b.tables, 0), [dateBookings]);
  const isClubTaken = useMemo(() => dateBookings.some(b => b.clubReserved), [dateBookings]);

  const availableChairs = MAX_CHAIRS - usedChairs;
  const availableTables = MAX_TABLES - usedTables;

  const chairOptions = CHAIR_OPTIONS.filter(c => c <= availableChairs);
  const tableOptions = TABLE_OPTIONS.filter(t => t <= availableTables);

  const isFullyBooked = availableChairs <= 0 && availableTables <= 0 && isClubTaken;

  // Reset selections when date changes and available inventory changes
  useEffect(() => {
    if (chairOptions.length > 0) {
      setChairs(chairOptions[chairOptions.length - 1]);
    } else {
      setChairs(0);
    }
    if (tableOptions.length > 0) {
      setTables(tableOptions[tableOptions.length - 1]);
    } else {
      setTables(0);
    }
    if (isClubTaken) {
      setClubReserved(false);
    } else {
      setClubReserved(true);
    }
  }, [date, availableChairs, availableTables, isClubTaken]);

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

    if (!name || !date) {
      setError('יש למלא את כל השדות');
      return;
    }

    const [dd, mm, yy] = date.split('/').map(Number);
    const selectedDate = new Date(yy, mm - 1, dd, 23, 59);
    if (selectedDate < new Date()) {
      setError('לא ניתן להזמין תאריך שעבר');
      return;
    }

    if (isFullyBooked) {
      setError('כל הציוד והמועדון כבר תפוסים בתאריך זה');
      return;
    }

    if (chairs === 0 && tables === 0 && !clubReserved) {
      setError('יש לבחור לפחות ציוד אחד או שיריון מועדון');
      return;
    }

    if (clubReserved && isClubTaken) {
      setError('המועדון כבר שוריין לתאריך זה');
      return;
    }

    if (chairs > availableChairs) {
      setError(`נותרו רק ${availableChairs} כסאות פנויים בתאריך זה`);
      return;
    }

    if (tables > availableTables) {
      setError(`נותרו רק ${availableTables} שולחנות פנויים בתאריך זה`);
      return;
    }

    try {
      const dayIndex = new Date(yy, mm - 1, dd).getDay();
      const key = `${name}-${date.replace(/\//g, '-')}-${apartment}-${Date.now()}`;
      const newRef = ref(db, `club-bookings/${key}`);

      await set(newRef, {
        name,
        apartment,
        scheduledDate: date,
        day: dayIndex,
        chairs,
        tables,
        clubReserved,
        ...(note.trim() && { note: note.trim() }),
        timestamp: new Date(yy, mm - 1, dd).getTime()
      });

      onSuccess();
    } catch (err) {
      setError('שגיאה בשמירת הנתונים');
      console.error(err);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl focus:ring-4 focus:ring-sky-500/10 dark:focus:ring-sky-400/10 focus:border-sky-500 dark:focus:border-sky-400 outline-none text-slate-900 dark:text-white transition-all font-medium placeholder:text-slate-400 shadow-sm";
  const selectClasses = "w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl focus:ring-4 focus:ring-sky-500/10 dark:focus:ring-sky-400/10 focus:border-sky-500 dark:focus:border-sky-400 outline-none text-slate-900 dark:text-white transition-all font-medium shadow-sm appearance-none";
  const disabledSelectClasses = "w-full px-4 py-3 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-2xl outline-none text-slate-400 dark:text-slate-600 transition-all font-medium shadow-sm appearance-none cursor-not-allowed";

  const apartments = Array.from({ length: 55 }, (_, i) => i + 1);

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">הזמנת מועדון דיירים</h2>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">מלא את הפרטים למטה</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-xl transition-colors text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Availability info banner */}
      {dateBookings.length > 0 && !isFullyBooked && (
        <div className="mb-6 p-3 md:p-4 bg-sky-50 dark:bg-sky-950/20 rounded-2xl border border-sky-200/60 dark:border-sky-900/30 text-xs md:text-sm font-bold text-sky-700 dark:text-sky-300">
          <span>📦 מלאי פנוי לתאריך זה: </span>
          <span>{availableChairs} כסאות</span>
          <span> · </span>
          <span>{availableTables} שולחנות</span>
          <span> · </span>
          <span>מועדון: {isClubTaken ? 'תפוס ❌' : 'פנוי ✓'}</span>
        </div>
      )}

      {isFullyBooked && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-black border border-rose-100 dark:border-rose-900/30 text-center">
          כל הציוד והמועדון תפוסים בתאריך זה
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} placeholder="שם" />
          
          <select value={apartment} onChange={(e) => setApartment(Number(e.target.value))} className={selectClasses}>
            {apartments.map(a => <option key={a} value={a}>דירה {a}</option>)}
          </select>

          <div className="relative">
            <input type="text" ref={dateInputRef} className={`${inputClasses} cursor-pointer pl-12`} placeholder="בחר תאריך" readOnly />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          {chairOptions.length > 0 ? (
            <select value={chairs} onChange={(e) => setChairs(Number(e.target.value))} className={selectClasses}>
              <option value={0}>ללא כסאות</option>
              {chairOptions.map(c => <option key={c} value={c}>{c} כסאות</option>)}
            </select>
          ) : (
            <select disabled className={disabledSelectClasses}>
              <option>אין כסאות פנויים</option>
            </select>
          )}

          {tableOptions.length > 0 ? (
            <select value={tables} onChange={(e) => setTables(Number(e.target.value))} className={selectClasses}>
              <option value={0}>ללא שולחנות</option>
              {tableOptions.map(t => <option key={t} value={t}>{t} שולחנות</option>)}
            </select>
          ) : (
            <select disabled className={disabledSelectClasses}>
              <option>אין שולחנות פנויים</option>
            </select>
          )}

          <label className={`flex items-center gap-3 px-4 py-3 border rounded-2xl shadow-sm ${
            isClubTaken
              ? 'bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 cursor-not-allowed'
              : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 cursor-pointer'
          }`}>
            <input
              type="checkbox"
              checked={clubReserved}
              onChange={(e) => setClubReserved(e.target.checked)}
              disabled={isClubTaken}
              className="w-5 h-5 rounded-lg border-slate-300 text-sky-500 focus:ring-sky-500/20 disabled:opacity-50"
            />
            <span className={`font-medium ${isClubTaken ? 'text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-white'}`}>
              {isClubTaken ? 'המועדון כבר שוריין' : 'שיריון המועדון עצמו'}
            </span>
          </label>

          <div className="md:col-span-2">
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputClasses} placeholder='הערה (למשל "יום הולדת", "ישיבת ועד")' />
          </div>
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={onCancel} className="flex-1 px-4 md:px-8 py-4 md:py-5 rounded-2xl font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 transition-all duration-300 text-sm md:text-base">
            ביטול
          </button>
          <button
            type="submit"
            disabled={isFullyBooked}
            className={`flex-[2] font-black py-4 md:py-5 px-4 md:px-8 rounded-2xl shadow-xl transition-all duration-300 text-base md:text-lg flex items-center justify-center gap-2 group ${
              isFullyBooked
                ? 'bg-slate-300 dark:bg-zinc-700 text-slate-500 dark:text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-600 text-white shadow-slate-900/20 dark:shadow-sky-500/20'
            }`}
          >
            <span className="tracking-tight">הזמן</span>
            <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 p-5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-black border border-rose-100 dark:border-rose-900/30 flex items-center gap-4">
          <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-10a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          </div>
          {error}
        </div>
      )}
    </div>
  );
};

export default ClubBookingForm;
