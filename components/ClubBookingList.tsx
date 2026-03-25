import React, { useState } from 'react';
import { ClubBooking } from '../types';
import { DAY_NAMES } from '../utils/dateTime';
import { ref, remove, db } from '../firebase';
import SwipeDelete from './SwipeDelete';

interface ClubBookingListProps { bookings: ClubBooking[]; readOnly?: boolean; }

const DAY_COLORS = [
  'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
];

const ClubBookingList: React.FC<ClubBookingListProps> = ({ bookings, readOnly = false }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const confirmDelete = async () => { if (deleteId) { await remove(ref(db, `club-bookings/${deleteId}`)); setDeleteId(null); } };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 glass-card rounded-3xl a-fade-up">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        <p className="text-slate-400 font-bold text-sm">אין הזמנות מועדון</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop list */}
      <div className="hidden md:block glass-card rounded-3xl p-2 a-fade-up a-d2 overflow-hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200/40 dark:border-white/5">
              <th className="px-5 py-3 font-extrabold text-right">שם</th>
              <th className="px-3 py-3 font-extrabold text-right">דירה</th>
              <th className="px-3 py-3 font-extrabold text-right">תאריך</th>
              <th className="px-3 py-3 font-extrabold text-center">כסאות</th>
              <th className="px-3 py-3 font-extrabold text-center">שולחנות</th>
              <th className="px-3 py-3 font-extrabold text-center">מועדון</th>
              <th className="px-3 py-3 font-extrabold text-right">הערה</th>
              {!readOnly && <th className="px-3 py-3 font-extrabold text-center">פעולות</th>}
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, i) => (
              <tr key={b.id} className="row-hover rounded-2xl a-fade-up" style={{ animationDelay: `${(i + 1) * 50}ms` }}>
                <td className="px-5 py-3 font-bold text-base">{b.name}</td>
                <td className="px-3 py-3 font-semibold text-slate-500 dark:text-slate-400">{b.apartment}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`${DAY_COLORS[b.day]} text-[10px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap`}>{DAY_NAMES[b.day]}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm whitespace-nowrap">{b.scheduledDate}</span>
                  </div>
                </td>
                <td className="px-3 py-3 font-bold text-slate-700 dark:text-slate-200 text-center">{b.chairs}</td>
                <td className="px-3 py-3 font-bold text-slate-700 dark:text-slate-200 text-center">{b.tables}</td>
                <td className="px-3 py-3 text-center">{b.clubReserved ? <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full text-xs whitespace-nowrap">שמור ✓</span> : <span className="text-rose-500 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full text-xs whitespace-nowrap">ללא שיריון</span>}</td>
                <td className="px-3 py-3 text-sm text-slate-400 font-medium max-w-[140px] truncate">{b.note ? <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>{b.note}</span> : '—'}</td>
                {!readOnly && (
                  <td className="px-3 py-3 text-center">
                    <button onClick={() => setDeleteId(b.id)} className="p-2 text-slate-400 rounded-full del-btn">
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
        {bookings.map((b, i) => {
          const card = (
            <div className="glass-card-subtle p-3 rounded-3xl">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base">{b.name}</h3>
                  <span className="text-sm font-semibold text-slate-400">· דירה {b.apartment}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`${DAY_COLORS[b.day]} text-xs px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap`}>{DAY_NAMES[b.day]}</span>
                  <span className="text-slate-400 text-sm font-semibold whitespace-nowrap">{b.scheduledDate}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                  <span className="font-bold">{b.chairs} כסאות</span><span className="text-slate-400">·</span><span className="font-bold">{b.tables} שולחנות</span><span className="text-slate-400">·</span>
                  <span>{b.clubReserved ? <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-full">שמור</span> : <span className="text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded-full">ללא שיריון</span>}</span>
                </div>
              </div>
              {b.note && <div className="text-sm text-amber-700 dark:text-amber-300 font-medium mt-1.5 flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1.5 rounded-full"><svg className="w-3 h-3 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>{b.note}</div>}
            </div>
          );
          return readOnly ? (
            <div key={b.id} className="a-fade-up" style={{ animationDelay: `${i * 60}ms` }}>{card}</div>
          ) : (
            <SwipeDelete key={b.id} onDelete={() => setDeleteId(b.id)}>
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
            <p className="text-slate-400 mb-5 font-semibold text-xs">מחיקת ההזמנה היא פעולה סופית.</p>
            <div className="flex flex-col gap-2.5">
              <button onClick={confirmDelete} className="w-full font-bold py-2.5 rounded-full glass-btn-danger">כן, מחק</button>
              <button onClick={() => setDeleteId(null)} className="w-full font-bold py-2.5 rounded-full text-slate-500 glass-btn">לא, בטל</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClubBookingList;
