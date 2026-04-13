import React, { useState, useEffect, useRef } from 'react';
import { Shift } from '../types';
import { isShiftOverlap, isPastShift, getShiftTimes } from '../utils/dateTime';
import { set, ref, db } from '../firebase';

interface ShiftFormProps { existingShifts: Shift[]; onSuccess: () => void; onCancel: () => void; }

const ShiftForm: React.FC<ShiftFormProps> = ({ existingShifts, onSuccess, onCancel }) => {
  const [username, setUsername] = useState('');
  const [date, setDate] = useState(() => { const t = new Date(); return `${t.getDate().toString().padStart(2, '0')}/${(t.getMonth() + 1).toString().padStart(2, '0')}/${t.getFullYear()}`; });
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('06:00');
  const [error, setError] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [bellAnimating, setBellAnimating] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dateInputRef.current) {
      // @ts-ignore
      flatpickr(dateInputRef.current, {
        locale: {
          firstDayOfWeek: 0,
          weekdays: { shorthand: ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'], longhand: ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'] },
          months: { shorthand: ['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'], longhand: ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'] },
          rangeSeparator: ' אל ', time_24hr: true,
        },
        defaultDate: 'today', dateFormat: 'd/m/Y', minDate: 'today', disableMobile: true, animate: true, position: "auto",
        onChange: (selectedDates: Date[]) => { if (selectedDates.length > 0) { const d = selectedDates[0]; setDate(`${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`); } }
      });
    }
  }, []);

  const handleToggleReminder = (enabled: boolean) => {
    setReminderEnabled(enabled);
    if (enabled) {
      setBellAnimating(true);
      setTimeout(() => setBellAnimating(false), 800);
      // Request permission early so it's ready at submit time
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  const scheduleReminder = (shiftDate: string, shiftStart: string, shiftEnd: string, mins: number, user: string) => {
    const { start } = getShiftTimes(shiftDate, shiftStart, shiftEnd);
    const reminderTime = start.getTime() - mins * 60 * 1000;
    const delay = reminderTime - Date.now();

    const fireNotification = () => {
      const msg = `${user}, המשמרת שלך מתחילה בעוד ${mins} דקות (${shiftStart})`;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('תזכורת משמרת טעינה 🔔', { body: msg, icon: './logo-192.png' });
      }
    };

    if (delay > 0) {
      setTimeout(fireNotification, delay);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!username || !date || !startTime || !endTime) { setError('יש למלא את כל השדות'); return; }
    if (isPastShift(date, startTime)) { setError('לא ניתן לקבוע משמרת בעבר'); return; }
    if (isShiftOverlap({ scheduledDate: date, startTime, endTime }, existingShifts)) { setError('קיימת חפיפה עם משמרת אחרת'); return; }
    try {
      const [d, m, y] = date.split('/').map(Number);
      const dayIndex = new Date(y, m - 1, d).getDay();
      const { start } = getShiftTimes(date, startTime, endTime);
      const key = `${username}-${date.replace(/\//g, '-')}-${startTime.replace(/:/g, '')}-${endTime.replace(/:/g, '')}`;
      await set(ref(db, `schedule-v3/${key}`), { username, day: dayIndex, scheduledDate: date, startTime, endTime, timestamp: start.getTime(), ...(reminderEnabled ? { reminder: reminderMinutes } : {}) });
      if (reminderEnabled) {
        scheduleReminder(date, startTime, endTime, reminderMinutes, username);
      }
      setUsername(''); const t = new Date(); setDate(`${t.getDate().toString().padStart(2, '0')}/${(t.getMonth() + 1).toString().padStart(2, '0')}/${t.getFullYear()}`);
      setStartTime('22:00'); setEndTime('06:00'); setReminderEnabled(false); setReminderMinutes(15);
      // @ts-ignore
      if (dateInputRef.current) dateInputRef.current._flatpickr.clear();
      onSuccess();
    } catch (err) { setError('שגיאה בשמירת הנתונים'); console.error(err); }
  };

  const inputCls = "w-full px-4 py-3 glass-input rounded-full outline-none text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400 transition-all duration-200";
  const selCls = "px-3 py-3 glass-input rounded-full outline-none text-slate-700 dark:text-slate-200 font-semibold text-base text-center appearance-none transition-all duration-200";
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];
  const parse = (t: string) => { const [h, m] = t.split(':'); return { h: h || '00', m: m || '00' }; };
  const sp = parse(startTime), ep = parse(endTime);


  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 a-fade-up">
        <div>
          <h2 className="text-xl font-extrabold text-slate-700 dark:text-slate-100 tracking-tight">הוספת משמרת טעינה</h2>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">מלא את הפרטים למטה</p>
        </div>
        <button onClick={onCancel} className="w-9 h-9 rounded-full glass-btn flex items-center justify-center text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="a-fade-up a-d1"><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} placeholder="מי המטעין?" /></div>
          <div className="relative a-fade-up a-d2">
            <input type="text" ref={dateInputRef} className={`${inputCls} cursor-pointer pl-12`} placeholder="בחר תאריך" readOnly />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <div className="md:col-span-2 a-fade-up a-d3">
            <div className="flex items-center justify-center gap-3 md:gap-6" dir="ltr">
              <div className="flex items-center gap-1">
                <select value={sp.h} onChange={(e) => setStartTime(`${e.target.value}:${sp.m}`)} className={selCls}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                <span className="text-slate-400 font-bold">:</span>
                <select value={sp.m} onChange={(e) => setStartTime(`${sp.h}:${e.target.value}`)} className={selCls}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
              <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              <div className="flex items-center gap-1">
                <select value={ep.h} onChange={(e) => setEndTime(`${e.target.value}:${ep.m}`)} className={selCls}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                <span className="text-slate-400 font-bold">:</span>
                <select value={ep.m} onChange={(e) => setEndTime(`${ep.h}:${e.target.value}`)} className={selCls}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
              </div>
            </div>
          </div>
        </div>


        {/* Reminder section */}
        <div className="a-fade-up a-d4">
          <div className={`px-5 py-3 rounded-3xl glass-card transition-all duration-300 ${
            reminderEnabled ? 'border-amber-200/60 dark:border-amber-500/15' : ''
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  reminderEnabled ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-slate-100 dark:bg-white/5'
                }`}>
                  <svg className={`w-4 h-4 ${bellAnimating ? 'bell-ring' : ''} transition-colors duration-300 ${
                    reminderEnabled ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span className={`text-sm font-bold transition-colors duration-300 ${
                  reminderEnabled ? 'text-amber-800 dark:text-amber-200' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  להזכיר לך{' '}
                  <select
                    value={reminderMinutes}
                    onChange={(e) => setReminderMinutes(Number(e.target.value))}
                    className={`inline-flex px-1.5 py-0.5 rounded-lg text-sm font-bold appearance-none outline-none cursor-pointer transition-all duration-200 ${
                      reminderEnabled
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/20'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/5'
                    }`}
                  >
                    <option value={15}>15</option>
                    <option value={30}>30</option>
                    <option value={45}>45</option>
                    <option value={60}>60</option>
                  </select>
                  {' '}דקות לפני?
                </span>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleReminder(true)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    reminderEnabled
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'glass-btn text-slate-400 hover:border-amber-300 hover:text-amber-600 dark:hover:border-amber-500/30 dark:hover:text-amber-400'
                  }`}
                >כן</button>
                <button
                  type="button"
                  onClick={() => handleToggleReminder(false)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    !reminderEnabled
                      ? 'bg-slate-400 dark:bg-slate-600 text-white shadow-sm'
                      : 'glass-btn text-slate-400 hover:border-slate-300 hover:text-slate-600 dark:hover:border-white/10 dark:hover:text-slate-300'
                  }`}
                >לא</button>
              </div>
            </div>
          </div>
        </div>


        <div className="flex gap-3 a-fade-up a-d5">
          <button type="button" onClick={onCancel} className="flex-1 py-3.5 rounded-full font-bold text-slate-500 text-sm glass-btn">ביטול</button>
          <button type="submit" className="flex-[2] font-bold py-3.5 rounded-full text-base flex items-center justify-center gap-2 group glass-btn-primary">
            <span>הוסף</span>
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 spring" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
          </button>
        </div>
      </form>
      {error && (
        <div className="mt-6 p-4 rounded-3xl text-red-500 text-sm font-semibold flex items-center gap-3 a-scale-in bg-red-50 dark:bg-red-500/10">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-10a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default ShiftForm;
