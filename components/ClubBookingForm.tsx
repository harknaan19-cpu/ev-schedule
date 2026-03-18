import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ClubBooking } from '../types';
import { set, ref, db } from '../firebase';

const MAX_CHAIRS = 25, MAX_TABLES = 4;
const CHAIR_OPTIONS = [5, 10, 15, 20, 25];
const TABLE_OPTIONS = [1, 2, 3, 4];

interface ClubBookingFormProps { existingBookings: ClubBooking[]; onSuccess: () => void; onCancel: () => void; }

const ClubBookingForm: React.FC<ClubBookingFormProps> = ({ existingBookings, onSuccess, onCancel }) => {
  const [frozenBookings] = useState(() => existingBookings);
  const [name, setName] = useState('');
  const [apartment, setApartment] = useState<number>(1);
  const [date, setDate] = useState(() => { const t = new Date(); return `${t.getDate().toString().padStart(2, '0')}/${(t.getMonth() + 1).toString().padStart(2, '0')}/${t.getFullYear()}`; });
  const [chairs, setChairs] = useState(0);
  const [tables, setTables] = useState(0);
  const [clubReserved, setClubReserved] = useState(true);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const dateBookings = useMemo(() => frozenBookings.filter(b => b.scheduledDate === date), [frozenBookings, date]);
  const usedChairs = useMemo(() => dateBookings.reduce((s, b) => s + b.chairs, 0), [dateBookings]);
  const usedTables = useMemo(() => dateBookings.reduce((s, b) => s + b.tables, 0), [dateBookings]);
  const isClubTaken = useMemo(() => dateBookings.some(b => b.clubReserved), [dateBookings]);
  const availableChairs = MAX_CHAIRS - usedChairs;
  const availableTables = MAX_TABLES - usedTables;
  const chairOptions = CHAIR_OPTIONS.filter(c => c <= availableChairs);
  const tableOptions = TABLE_OPTIONS.filter(t => t <= availableTables);
  const isFullyBooked = availableChairs <= 0 && availableTables <= 0 && isClubTaken;

  useEffect(() => {
    setChairs(chairOptions.length > 0 ? chairOptions[chairOptions.length - 1] : 0);
    setTables(tableOptions.length > 0 ? tableOptions[tableOptions.length - 1] : 0);
    setClubReserved(!isClubTaken);
  }, [date, availableChairs, availableTables, isClubTaken]);

  useEffect(() => {
    if (dateInputRef.current) {
      // @ts-ignore
      flatpickr(dateInputRef.current, {
        locale: 'he', dateFormat: 'd/m/Y', minDate: 'today', disableMobile: true, animate: true, position: "auto",
        onChange: (selectedDates: Date[]) => { if (selectedDates.length > 0) { const d = selectedDates[0]; setDate(`${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`); } }
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!name || !date) { setError('יש למלא את כל השדות'); return; }
    const [dd, mm, yy] = date.split('/').map(Number);
    if (new Date(yy, mm - 1, dd, 23, 59) < new Date()) { setError('לא ניתן להזמין תאריך שעבר'); return; }
    if (isFullyBooked) { setError('כל הציוד והמועדון כבר תפוסים בתאריך זה'); return; }
    if (chairs === 0 && tables === 0 && !clubReserved) { setError('יש לבחור לפחות ציוד אחד או שיריון מועדון'); return; }
    if (clubReserved && isClubTaken) { setError('המועדון כבר שוריין לתאריך זה'); return; }
    if (chairs > availableChairs) { setError(`נותרו רק ${availableChairs} כסאות פנויים בתאריך זה`); return; }
    if (tables > availableTables) { setError(`נותרו רק ${availableTables} שולחנות פנויים בתאריך זה`); return; }
    try {
      const dayIndex = new Date(yy, mm - 1, dd).getDay();
      await set(ref(db, `club-bookings/${name}-${date.replace(/\//g, '-')}-${apartment}-${Date.now()}`), {
        name, apartment, scheduledDate: date, day: dayIndex, chairs, tables, clubReserved,
        ...(note.trim() && { note: note.trim() }), timestamp: new Date(yy, mm - 1, dd).getTime()
      });
      onSuccess();
    } catch (err) { setError('שגיאה בשמירת הנתונים'); console.error(err); }
  };

  const inputCls = "w-full px-4 py-3 neu-inset rounded-full outline-none text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400 transition-all duration-200";
  const selCls = "w-full px-4 py-3 neu-inset rounded-full outline-none text-slate-700 dark:text-slate-200 font-medium appearance-none transition-all duration-200";
  const disCls = "w-full px-4 py-3 neu-inset rounded-full outline-none text-slate-400 font-medium appearance-none cursor-not-allowed opacity-60";
  const apartments = Array.from({ length: 55 }, (_, i) => i + 1);

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 a-fade-up">
        <div>
          <h2 className="text-xl font-extrabold text-slate-700 dark:text-slate-100 tracking-tight">הזמנת מועדון דיירים</h2>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">מלא את הפרטים למטה</p>
        </div>
        <button onClick={onCancel} className="w-9 h-9 rounded-full neu-pill flex items-center justify-center text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {dateBookings.length > 0 && !isFullyBooked && (
        <div className="mb-5 p-3 rounded-2xl text-xs md:text-sm font-semibold text-cyan-800 dark:text-cyan-300 a-fade-up a-d1 flex items-center gap-2 bg-cyan-50 dark:bg-cyan-900/20 neu-inset">
          <svg className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          מלאי פנוי: {availableChairs} כסאות · {availableTables} שולחנות · מועדון: {isClubTaken ? 'תפוס ✗' : 'פנוי ✓'}
        </div>
      )}
      {isFullyBooked && (
        <div className="mb-5 p-3 rounded-2xl text-[#DC143C] text-sm font-semibold text-center a-scale-in bg-red-50 dark:bg-red-900/15 neu-inset">
          כל הציוד והמועדון תפוסים בתאריך זה
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="a-fade-up a-d1"><input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="שם" /></div>
          <div className="a-fade-up a-d2">
            <select value={apartment} onChange={(e) => setApartment(Number(e.target.value))} className={selCls}>
              {apartments.map(a => <option key={a} value={a}>דירה {a}</option>)}
            </select>
          </div>
          <div className="relative a-fade-up a-d2">
            <input type="text" ref={dateInputRef} className={`${inputCls} cursor-pointer pl-12`} placeholder="בחר תאריך" readOnly />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <div className="a-fade-up a-d3">
            {chairOptions.length > 0 ? (
              <select value={chairs} onChange={(e) => setChairs(Number(e.target.value))} className={selCls}>
                <option value={0}>ללא כסאות</option>
                {chairOptions.map(c => <option key={c} value={c}>{c} כסאות</option>)}
              </select>
            ) : <select disabled className={disCls}><option>אין כסאות פנויים</option></select>}
          </div>
          <div className="a-fade-up a-d3">
            {tableOptions.length > 0 ? (
              <select value={tables} onChange={(e) => setTables(Number(e.target.value))} className={selCls}>
                <option value={0}>ללא שולחנות</option>
                {tableOptions.map(t => <option key={t} value={t}>{t} שולחנות</option>)}
              </select>
            ) : <select disabled className={disCls}><option>אין שולחנות פנויים</option></select>}
          </div>
          <div className="a-fade-up a-d4">
            <label className={`flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 ${
              isClubTaken ? 'neu-inset cursor-not-allowed opacity-60' : 'neu-flat cursor-pointer'
            }`}>
              <input type="checkbox" checked={clubReserved} onChange={(e) => setClubReserved(e.target.checked)} disabled={isClubTaken}
                className="w-4 h-4 rounded-full border-slate-300 text-slate-700 focus:ring-slate-400/20 disabled:opacity-40" />
              <span className={`font-medium text-sm ${isClubTaken ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                {isClubTaken ? 'המועדון כבר שוריין' : 'שיריון המועדון עצמו'}
              </span>
            </label>
          </div>
          <div className="md:col-span-2 a-fade-up a-d5">
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="הערה (יום הולדת, ישיבת ועד...)" />
          </div>
        </div>

        <div className="flex gap-3 a-fade-up a-d6">
          <button type="button" onClick={onCancel} className="flex-1 py-3.5 rounded-full font-bold text-slate-500 text-sm neu-btn">ביטול</button>
          <button type="submit" disabled={isFullyBooked}
            className={`flex-[2] font-bold py-3.5 rounded-full text-base flex items-center justify-center gap-2 group ${
              isFullyBooked ? 'neu-inset text-slate-400 cursor-not-allowed opacity-60' : 'neu-btn-primary'
            }`}>
            <span>הזמן</span>
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 spring" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-5 p-4 rounded-2xl text-[#DC143C] text-sm font-semibold flex items-center gap-3 a-scale-in bg-red-50 dark:bg-red-900/15 neu-inset">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-10a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default ClubBookingForm;