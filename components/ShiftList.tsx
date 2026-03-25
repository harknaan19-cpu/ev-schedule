import React, { useState } from 'react';
import { Shift } from '../types';
import { DAY_NAMES } from '../utils/dateTime';
import { ref, remove, db } from '../firebase';
import SwipeDelete from './SwipeDelete';

interface ShiftListProps { shifts: Shift[]; readOnly?: boolean; }

const DAY_COLORS = [
  'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
];

const BellIcon = ({ reminder }: { reminder: number }) => (
  <span title={`תזכורת ${reminder} דקות לפני`}>
    <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  </span>
);

const ShiftList: React.FC<ShiftListProps> = ({ shifts, readOnly = false }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const confirmDelete = async () => { if (deleteId) { await remove(ref(db, `schedule-v3/${deleteId}`)); setDeleteId(null); } };

  if (shifts.length === 0) {
    return (
      <div className="text-center py-16 glass-card rounded-3xl a-fade-up">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
        <p className="text-slate-400 font-bold text-sm">אין משמרות עתידיות ברשימה</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop list */}
      <div className="hidden md:block glass-card rounded-3xl p-2 a-fade-up a-d2">
        <div className="space-y-1">
          <div className={`grid ${readOnly ? 'grid-cols-3' : 'grid-cols-4'} items-center px-5 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] text-right border-b border-slate-200/40 dark:border-white/5 mx-3 mb-1`}>
            <span>מטעין</span><span>מועד</span><span>זמן</span>{!readOnly && <span className="text-center">פעולות</span>}
          </div>
          {shifts.map((shift, i) => (
            <div key={shift.id} className={`grid ${readOnly ? 'grid-cols-3' : 'grid-cols-4'} items-center px-5 py-3 rounded-2xl row-hover a-fade-up`} style={{ animationDelay: `${(i + 1) * 50}ms` }}>
              <span className="font-bold text-base">{shift.username}</span>
              <div className="flex items-center gap-2">
                <span className={`${DAY_COLORS[shift.day]} text-[10px] px-2.5 py-1 rounded-full font-bold`}>{DAY_NAMES[shift.day]}</span>
                <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">{shift.scheduledDate}</span>
              </div>
              <div className="flex items-center justify-end gap-3 font-mono" dir="ltr">
                {shift.reminder && <BellIcon reminder={shift.reminder} />}
                <span className="text-sm font-bold leading-none">{shift.startTime}</span>
                <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                <span className="text-sm font-bold leading-none">{shift.endTime}</span>
              </div>
              {!readOnly && (
                <div className="flex justify-center">
                  <button onClick={() => setDeleteId(shift.id)} className="p-2 text-slate-400 rounded-full del-btn">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {shifts.map((shift, i) => {
          const card = (
            <div className="glass-card-subtle p-3 rounded-3xl" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-base truncate ml-2">{shift.username}</h3>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`${DAY_COLORS[shift.day]} text-xs px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap`}>{DAY_NAMES[shift.day]}</span>
                  <span className="text-slate-400 text-sm font-semibold whitespace-nowrap">{shift.scheduledDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {shift.reminder && <BellIcon reminder={shift.reminder} />}
                  <div className="flex items-center gap-1.5 glass-pill px-2.5 py-1.5" dir="ltr">
                    <span className="font-mono text-sm font-bold leading-none">{shift.startTime}</span>
                    <svg className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    <span className="font-mono text-sm font-bold leading-none">{shift.endTime}</span>
                  </div>
                </div>
              </div>
            </div>
          );
          return readOnly ? (
            <div key={shift.id} className="a-fade-up" style={{ animationDelay: `${i * 60}ms` }}>{card}</div>
          ) : (
            <SwipeDelete key={shift.id} onDelete={() => setDeleteId(shift.id)}>
              <div className="a-fade-up" style={{ animationDelay: `${i * 60}ms` }}>{card}</div>
            </SwipeDelete>
          );
        })}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-[100] a-fade-in">
          <div className="glass-card rounded-3xl p-6 max-w-xs w-full text-center a-scale-in">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-lg font-extrabold mb-1.5">בטוח?</h3>
            <p className="text-slate-400 mb-5 font-semibold text-xs">מחיקת המשמרת היא פעולה סופית.</p>
            <div className="flex flex-col gap-2.5">
              <button onClick={confirmDelete} className="w-full font-bold py-2.5 rounded-full glass-btn-danger">כן, מחק משמרת</button>
              <button onClick={() => setDeleteId(null)} className="w-full font-bold py-2.5 rounded-full text-slate-500 glass-btn">לא, בטל</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShiftList;
