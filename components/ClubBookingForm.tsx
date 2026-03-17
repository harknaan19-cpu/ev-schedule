import React, { useState, useEffect, useRef } from 'react';
import { ClubBooking } from '../types';
import { set, ref, db } from '../firebase';

interface ClubBookingFormProps {
  existingBookings: ClubBooking[];
  onSuccess: () => void;
  onCancel: () => void;
}

const ClubBookingForm: React.FC<ClubBookingFormProps> = ({ existingBookings, onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [apartment, setApartment] = useState<number>(1);
  const [date, setDate] = useState(() => {
    const today = new Date();
    const d = today.getDate().toString().padStart(2, '0');
    const m = (today.getMonth() + 1).toString().padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  });
  const [chairs, setChairs] = useState(25);
  const [tables, setTables] = useState(4);
  const [clubReserved, setClubReserved] = useState(true);
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

    if (!name || !date) {
      setError('יש למלא את כל השדות');
      return;
    }

    // Check if date is in the past
    const [dd, mm, yy] = date.split('/').map(Number);
    const selectedDate = new Date(yy, mm - 1, dd, 23, 59);
    if (selectedDate < new Date()) {
      setError('לא ניתן להזמין תאריך שעבר');
      return;
    }

    // Check for date conflict
    const hasConflict = existingBookings.some(b => b.scheduledDate === date);
    if (hasConflict) {
      setError('כבר קיימת הזמנה בתאריך זה');
      return;
    }

    try {
      const dayIndex = new Date(yy, mm - 1, dd).getDay();
      const key = `${name}-${date.replace(/\//g, '-')}-${apartment}`;
      const newRef = ref(db, `club-bookings/${key}`);

      await set(newRef, {
        name,
        apartment,
        scheduledDate: date,
        day: dayIndex,
        chairs,
        tables,
        clubReserved,
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

          <select value={chairs} onChange={(e) => setChairs(Number(e.target.value))} className={selectClasses}>
            {[5, 10, 15, 20, 25].map(c => <option key={c} value={c}>{c} כסאות</option>)}
          </select>

          <select value={tables} onChange={(e) => setTables(Number(e.target.value))} className={selectClasses}>
            {[1, 2, 3, 4].map(t => <option key={t} value={t}>{t} שולחנות</option>)}
          </select>

          <label className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-sm cursor-pointer">
            <input type="checkbox" checked={clubReserved} onChange={(e) => setClubReserved(e.target.checked)} className="w-5 h-5 rounded-lg border-slate-300 text-sky-500 focus:ring-sky-500/20" />
            <span className="text-slate-900 dark:text-white font-medium">שיריון המועדון עצמו</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={onCancel} className="flex-1 px-4 md:px-8 py-4 md:py-5 rounded-2xl font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 transition-all duration-300 text-sm md:text-base">
            ביטול
          </button>
          <button type="submit" className="flex-[2] bg-slate-900 dark:bg-sky-500 hover:bg-slate-800 dark:hover:bg-sky-600 text-white font-black py-4 md:py-5 px-4 md:px-8 rounded-2xl shadow-xl shadow-slate-900/20 dark:shadow-sky-500/20 transition-all duration-300 text-base md:text-lg flex items-center justify-center gap-2 group">
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
