
import React, { useState } from 'react';
import { Shift } from '../types';
import { DAY_NAMES } from '../utils/dateTime';
import { ref, remove, db } from '../firebase';

interface ShiftListProps {
  shifts: Shift[];
}

const ShiftList: React.FC<ShiftListProps> = ({ shifts }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (deleteId) {
      await remove(ref(db, `schedule-v3/${deleteId}`));
      setDeleteId(null);
    }
  };

  if (shifts.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-zinc-800 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-zinc-700 transition-all">
        <div className="bg-sky-50 dark:bg-sky-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-sky-300 dark:text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-slate-400 dark:text-slate-500 font-black text-sm uppercase tracking-widest">אין משמרות עתידיות ברשימה</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block bg-white dark:bg-zinc-800 rounded-[2.5rem] shadow-2xl shadow-slate-100/50 dark:shadow-none border border-slate-100 dark:border-zinc-700 overflow-hidden transition-all">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-zinc-700/30 border-b border-slate-100 dark:border-zinc-700">
              <th className="px-8 py-6 text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.2em]">מטעין</th>
              <th className="px-8 py-6 text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.2em]">מועד</th>
              <th className="px-8 py-6 text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.2em]">זמן</th>
              <th className="px-8 py-6 text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.2em]">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50 dark:divide-zinc-700/50">
            {shifts.map((shift) => (
              <tr key={shift.id} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-colors group">
                <td className="px-8 py-6">
                  <span className="text-slate-900 dark:text-white font-black text-lg tracking-tight">{shift.username}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <span className="bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[10px] px-3 py-1.5 rounded-xl font-black uppercase tracking-wider">
                      {DAY_NAMES[shift.day]}
                    </span>
                    <span className="text-slate-900 dark:text-slate-200 font-black text-sm">
                      {shift.scheduledDate}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-end gap-4 font-mono text-slate-900 dark:text-white" dir="ltr">
                    <span className="text-xl font-black leading-none">{shift.startTime}</span>
                    <svg className="w-5 h-5 text-sky-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="text-xl font-black leading-none">{shift.endTime}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <button
                    onClick={() => setDeleteId(shift.id)}
                    className="p-3 text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {shifts.map((shift) => (
          <div key={shift.id} className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-100 dark:border-zinc-700 shadow-md shadow-slate-100/20 dark:shadow-none transition-all">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight truncate ml-2">{shift.username}</h3>
              <button
                onClick={() => setDeleteId(shift.id)}
                className="p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-wider whitespace-nowrap">
                  {DAY_NAMES[shift.day]}
                </span>
                <span className="text-slate-700 dark:text-slate-200 text-xs font-black tracking-tight whitespace-nowrap">{shift.scheduledDate}</span>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-700/30 px-3 py-2 rounded-xl border border-slate-100 dark:border-zinc-700/50" dir="ltr">
                <span className="font-mono text-sm font-black text-slate-900 dark:text-white leading-none">{shift.startTime}</span>
                <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span className="font-mono text-sm font-black text-slate-900 dark:text-white leading-none">{shift.endTime}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100] animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 max-w-xs w-full shadow-2xl transition-all text-center border border-slate-100 dark:border-zinc-700 scale-in-95 animate-in duration-300">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-black mb-2 text-slate-900 dark:text-white tracking-tight">בטוח?</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 font-bold text-xs leading-relaxed">מחיקת המשמרת היא פעולה סופית ולא ניתן לבטלה.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmDelete}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-rose-500/20"
              >
                כן, מחק משמרת
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="w-full bg-slate-100 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-600 dark:text-slate-400 font-black py-3 rounded-xl transition-all"
              >
                לא, בטל
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShiftList;
