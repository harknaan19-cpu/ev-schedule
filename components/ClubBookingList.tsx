import React, { useState } from 'react';
import { ClubBooking } from '../types';
import { DAY_NAMES } from '../utils/dateTime';
import { ref, remove, db } from '../firebase';

interface ClubBookingListProps { bookings: ClubBooking[]; readOnly?: boolean; }

const DAY_COLORS = [
  'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
];

const ClubBookingList: React.FC<ClubBookingListProps> = ({ bookings, readOnly = false }) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const confirmDelete = async () => { if (deleteId) { await remove(ref(db, `club-bookings/${deleteId}`)); setDeleteId(null); } };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 neu-raised rounded-3xl a-fade-up">
        <div className="w-16 h-16 rounded-full neu-inset flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#DC143C]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">אין הזמנות מועדון</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block neu-raised rounded-3xl overflow-hidden a-fade-up a-d2">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <th className="px-5 py-5 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-[0.15em]">שם</th>
              <th className="px-5 py-5 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-[0.15em]">דירה</th>
              <th className="px-5 py-5 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-[0.15em]">תאריך</th>
              <th className="px-5 py-5 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-[0.15em]">כסאות</th>
              <th className="px-5 py-5 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-[0.15em]">שולחנות</th>
              <th className="px-5 py-5 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-[0.15em]">מועדון</th>
              <th className="px-5 py-5 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-[0.15em]">הערה</th>
              {!readOnly && <th className="px-5 py-5 text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-[0.15em]">פעולות</th>}
            </tr>
          </thead>
          <tbody>
            {bookings.map((b, i) => (
              <tr key={b.id} className="row-hover border-b last:border-b-0 a-fade-up" style={{ borderColor: 'rgba(0,0,0,0.04)', animationDelay: `${(i + 1) * 50}ms` }}>
                <td className="px-5 py-4 font-bold text-base text-slate-700 dark:text-slate-100">{b.name}</td>
                <td className="px-5 py-4 font-semibold text-slate-500 dark:text-slate-300">{b.apartment}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`neu-inset ${DAY_COLORS[b.day]} text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider`}>{DAY_NAMES[b.day]}</span>
                    <span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">{b.scheduledDate}</span>
                  </div>
                </td>
                <td className="px-5 py-4 font-semibold text-slate-500 dark:text-slate-300">{b.chairs}</td>
                <td className="px-5 py-4 font-semibold text-slate-500 dark:text-slate-300">{b.tables}</td>
                <td className="px-5 py-4">{b.clubReserved ? <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full text-xs">שמור ✓</span> : <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>}</td>
                <td className="px-5 py-4 text-sm text-slate-400 font-medium max-w-[180px] truncate">{b.note ? <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>{b.note}</span> : '—'}</td>
                {!readOnly && (
                  <td className="px-5 py-4">
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
        {bookings.map((b, i) => (
          <div key={b.id} className="neu-flat p-4 rounded-2xl neu-hover a-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex justify-between items-center mb-2.5">
              <div>
                <h3 className="font-bold text-base text-slate-700 dark:text-slate-100">{b.name}</h3>
                <span className="text-xs font-semibold text-slate-400">דירה {b.apartment}</span>
              </div>
              {!readOnly && (
                <button onClick={() => setDeleteId(b.id)} className="p-1.5 text-slate-400 del-btn rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className={`neu-inset ${DAY_COLORS[b.day]} text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap`}>{DAY_NAMES[b.day]}</span>
                <span className="text-slate-500 dark:text-slate-300 text-xs font-semibold whitespace-nowrap">{b.scheduledDate}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 whitespace-nowrap">
                <span>{b.chairs} כסאות</span><span>·</span><span>{b.tables} שולחנות</span><span>·</span>
                <span>{b.clubReserved ? <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">שמור</span> : 'ללא שיריון'}</span>
              </div>
            </div>
            {b.note && <div className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-1.5 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/15 px-2.5 py-1.5 rounded-full"><svg className="w-3 h-3 text-amber-500 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>{b.note}</div>}
          </div>
        ))}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-6 z-[100] a-fade-in">
          <div className="neu-raised rounded-3xl p-6 max-w-xs w-full text-center a-scale-in">
            <div className="w-10 h-10 rounded-full neu-inset flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-[#DC143C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-lg font-extrabold mb-1.5 text-slate-700 dark:text-slate-100">בטוח?</h3>
            <p className="text-slate-400 mb-5 font-semibold text-xs">מחיקת ההזמנה היא פעולה סופית.</p>
            <div className="flex flex-col gap-2.5">
              <button onClick={confirmDelete} className="w-full font-bold py-2.5 rounded-full neu-btn-danger">כן, מחק</button>
              <button onClick={() => setDeleteId(null)} className="w-full font-bold py-2.5 rounded-full text-slate-500 neu-btn">לא, בטל</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClubBookingList;