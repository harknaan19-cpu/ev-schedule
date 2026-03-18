import React, { useState } from 'react';
import { Shift } from '../types';
import { DAY_NAMES } from '../utils/dateTime';
import { ref, remove, db } from '../firebase';

interface ShiftListProps { shifts: Shift[]; readOnly?: boolean; }

const DAY_COLORS = [
  'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',       // 0 ראשון
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', // 1 שני
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',     // 2 שלישי
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',         // 3 רביעי
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',             // 4 חמישי
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',             // 5 שישי
  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',     // 6 שבת
];

const ShiftList: React.FC<ShiftListProps> = ({ shifts, readOnly = false }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const confirmDelete = async () => { if (deleteId) { await remove(ref(db, `schedule-v3/${deleteId}`)); setDeleteId(null); } };

  if (shifts.length === 0) {
    return (
      <div className="text-center py-16 neu-raised rounded-3xl a-fade-up">
        <div className="w-16 h-16 rounded-full neu-concave flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-500/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">אין משמרות עתידיות ברשימה</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block neu-raised rounded-3xl overflow-hidden a-fade-up a-d2">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="neu-concave">
              <th className="px-6 py-4 text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-[0.12em]">מטעין</th>
              <th className="px-6 py-4 text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-[0.12em]">מועד</th>
              <th className="px-6 py-4 text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-[0.12em]">זמן</th>
              {!readOnly && <th className="px-6 py-4 text-xs font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-[0.12em]">פעולות</th>}
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift, i) => (
              <tr key={shift.id} className="row-hover border-b last:border-b-0 a-fade-up" style={{ borderColor: 'rgba(0,0,0,0.04)', animationDelay: `${(i + 1) * 50}ms` }}>
                <td className="px-6 py-5"><span className="text-slate-700 dark:text-slate-100 font-bold text-base">{shift.username}</span></td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <span className={`neu-inset ${DAY_COLORS[shift.day]} text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider`}>{DAY_NAMES[shift.day]}</span>
                    <span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">{shift.scheduledDate}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center justify-end gap-3 font-mono text-slate-700 dark:text-slate-100" dir="ltr">
                    <span className="text-lg font-bold leading-none">{shift.startTime}</span>
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    <span className="text-lg font-bold leading-none">{shift.endTime}</span>
                  </div>
                </td>
                {!readOnly && (
                  <td className="px-6 py-5">
                    <button onClick={() => setDeleteId(shift.id)} className="p-2 text-slate-400 rounded-full del-btn neu-pill">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {shifts.map((shift, i) => (
          <div key={shift.id} className="neu-flat p-4 rounded-2xl neu-hover a-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="font-bold text-base text-slate-700 dark:text-slate-100 truncate ml-2">{shift.username}</h3>
              {!readOnly && (
                <button onClick={() => setDeleteId(shift.id)} className="p-1.5 text-slate-400 del-btn rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className={`neu-inset ${DAY_COLORS[shift.day]} text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap`}>{DAY_NAMES[shift.day]}</span>
                <span className="text-slate-500 dark:text-slate-300 text-xs font-semibold whitespace-nowrap">{shift.scheduledDate}</span>
              </div>
              <div className="flex items-center gap-1.5 neu-pill px-2.5 py-1.5 rounded-full" dir="ltr">
                <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-100 leading-none">{shift.startTime}</span>
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-100 leading-none">{shift.endTime}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-6 z-[100] a-fade-in">
          <div className="neu-raised rounded-3xl p-6 max-w-xs w-full text-center a-scale-in">
            <div className="w-10 h-10 rounded-full neu-concave flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-[#DC143C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-lg font-extrabold mb-1.5 text-slate-700 dark:text-slate-100">בטוח?</h3>
            <p className="text-slate-400 mb-5 font-semibold text-xs">מחיקת המשמרת היא פעולה סופית.</p>
            <div className="flex flex-col gap-2.5">
              <button onClick={confirmDelete} className="w-full font-bold py-2.5 rounded-full neu-btn-danger">כן, מחק משמרת</button>
              <button onClick={() => setDeleteId(null)} className="w-full font-bold py-2.5 rounded-full text-slate-500 neu-btn">לא, בטל</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShiftList;