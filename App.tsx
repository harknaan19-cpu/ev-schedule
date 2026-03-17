import React, { useState, useEffect } from 'react';
import { Shift, ClubBooking } from './types';
import { onValue, shiftsRef, clubBookingsRef } from './firebase';
import ShiftForm from './components/ShiftForm';
import ShiftList from './components/ShiftList';
import ClubBookingForm from './components/ClubBookingForm';
import ClubBookingList from './components/ClubBookingList';
import { getShiftTimes } from './utils/dateTime';

type Tab = 'charging' | 'club';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('charging');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [bookings, setBookings] = useState<ClubBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const unsubscribe = onValue(shiftsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = new Date();
        const shiftList: Shift[] = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
        const filtered = shiftList.filter(shift => {
          const { end } = getShiftTimes(shift.scheduledDate, shift.startTime, shift.endTime);
          return end > now;
        });
        filtered.sort((a, b) => a.timestamp - b.timestamp);
        setShifts(filtered);
      } else {
        setShifts([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onValue(clubBookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const list: ClubBooking[] = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));
        const filtered = list.filter(b => {
          const [dd, mm, yy] = b.scheduledDate.split('/').map(Number);
          return new Date(yy, mm - 1, dd) >= now;
        });
        filtered.sort((a, b) => a.timestamp - b.timestamp);
        setBookings(filtered);
      } else {
        setBookings([]);
      }
      setLoadingBookings(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSuccess = () => setIsModalOpen(false);

  const isLoading = activeTab === 'charging' ? loading : loadingBookings;
  const count = activeTab === 'charging' ? shifts.length : bookings.length;

  return (
    <div className="min-h-screen pb-20 transition-colors duration-500 bg-slate-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 dark:bg-zinc-900/90 border-b border-slate-200/60 dark:border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <svg className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="12" y="8" width="40" height="50" rx="3" fill="currentColor" className="text-slate-900 dark:text-white"/>
              <rect x="8" y="52" width="48" height="6" rx="2" fill="currentColor" className="text-slate-900 dark:text-white"/>
              <rect x="18" y="14" width="8" height="7" rx="1.5" fill="currentColor" className="text-white dark:text-zinc-900"/>
              <rect x="30" y="14" width="8" height="7" rx="1.5" fill="currentColor" className="text-white dark:text-zinc-900"/>
              <rect x="42" y="14" width="8" height="7" rx="1.5" fill="currentColor" className="text-sky-400 dark:text-sky-400" opacity="0.7"/>
              <rect x="18" y="26" width="8" height="7" rx="1.5" fill="currentColor" className="text-white dark:text-zinc-900"/>
              <rect x="30" y="26" width="8" height="7" rx="1.5" fill="currentColor" className="text-sky-400 dark:text-sky-400" opacity="0.7"/>
              <rect x="42" y="26" width="8" height="7" rx="1.5" fill="currentColor" className="text-white dark:text-zinc-900"/>
              <rect x="18" y="38" width="8" height="7" rx="1.5" fill="currentColor" className="text-sky-400 dark:text-sky-400" opacity="0.7"/>
              <rect x="30" y="38" width="8" height="7" rx="1.5" fill="currentColor" className="text-white dark:text-zinc-900"/>
              <rect x="42" y="38" width="8" height="7" rx="1.5" fill="currentColor" className="text-white dark:text-zinc-900"/>
              <rect x="27" y="46" width="10" height="12" rx="2" fill="currentColor" className="text-sky-500 dark:text-sky-400"/>
            </svg>
            <h1 className="text-lg md:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
              הר כנען <span className="text-sky-500 dark:text-sky-400">19</span>
            </h1>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all border border-slate-200 dark:border-zinc-800 shadow-sm"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 md:mb-8 bg-white dark:bg-zinc-800 p-1.5 rounded-2xl border border-slate-200/60 dark:border-zinc-700/50 shadow-sm">
          <button
            onClick={() => setActiveTab('charging')}
            className={`flex-1 py-2.5 md:py-3 px-4 rounded-xl font-black text-sm md:text-base transition-all ${
              activeTab === 'charging'
                ? 'bg-slate-900 dark:bg-sky-500 text-white shadow-lg'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-700'
            }`}
          >
            ⚡ עמדת טעינה
          </button>
          <button
            onClick={() => setActiveTab('club')}
            className={`flex-1 py-2.5 md:py-3 px-4 rounded-xl font-black text-sm md:text-base transition-all ${
              activeTab === 'club'
                ? 'bg-slate-900 dark:bg-sky-500 text-white shadow-lg'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-700'
            }`}
          >
            🏠 מועדון דיירים
          </button>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {activeTab === 'charging' ? 'משמרות קרובות' : 'הזמנות מועדון'}
            </h2>
            <div className="text-[9px] md:text-[10px] font-black text-sky-500 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl border border-sky-100 dark:border-sky-900/30 uppercase tracking-[0.2em]">
              {count} רשומות
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-slate-100 dark:border-zinc-800 rounded-full"></div>
                <div className="absolute top-0 left-0 w-12 h-12 border-4 border-t-sky-500 dark:border-t-sky-400 rounded-full animate-spin"></div>
              </div>
              <span className="text-slate-400 dark:text-slate-500 font-black text-xs tracking-[0.3em] uppercase">טוען נתונים</span>
            </div>
          ) : activeTab === 'charging' ? (
            <ShiftList shifts={shifts} />
          ) : (
            <ClubBookingList bookings={bookings} />
          )}

          {activeTab === 'club' && (
            <div className="mt-6 p-4 md:p-5 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/30 flex items-start gap-3">
              <span className="text-lg leading-none mt-0.5">🔑</span>
              <div className="text-sm font-bold text-amber-800 dark:text-amber-300 leading-relaxed">
                <p>בשביל המפתח למועדון יש ליצור קשר עם אביב</p>
                <p className="text-xs font-medium text-amber-700/80 dark:text-amber-400/70 mt-1">
                  קומה 2, דירה 10 · טלפון{' '}
                  <a href="tel:0545455203" className="underline underline-offset-2" dir="ltr">054-5455203</a>
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 dark:bg-sky-500 text-white rounded-full shadow-2xl shadow-slate-900/40 dark:shadow-sky-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group"
        >
          <svg className="w-8 h-8 md:w-10 md:h-10 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-800 rounded-[2.5rem] shadow-2xl border border-slate-200/60 dark:border-zinc-700/50 overflow-hidden animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] overflow-y-auto">
            {activeTab === 'charging' ? (
              <ShiftForm existingShifts={shifts} onSuccess={handleSuccess} onCancel={() => setIsModalOpen(false)} />
            ) : (
              <ClubBookingForm existingBookings={bookings} onSuccess={handleSuccess} onCancel={() => setIsModalOpen(false)} />
            )}
          </div>
        </div>
      )}

      <footer className="max-w-5xl mx-auto px-6 pt-10 border-t border-slate-100 dark:border-zinc-800/50 flex justify-center">
        <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
          הר כנען 19 &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default App;
