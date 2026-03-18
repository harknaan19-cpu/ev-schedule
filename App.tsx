import React, { useState, useEffect, useMemo } from 'react';
import { Shift, ClubBooking } from './types';
import { onValue, shiftsRef, clubBookingsRef } from './firebase';
import ShiftForm from './components/ShiftForm';
import ShiftList from './components/ShiftList';
import ClubBookingForm from './components/ClubBookingForm';
import ClubBookingList from './components/ClubBookingList';
import { getShiftTimes } from './utils/dateTime';

type Tab = 'charging' | 'club';

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('charging');
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [allBookings, setAllBookings] = useState<ClubBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyMonth, setHistoryMonth] = useState<number | null>(new Date().getMonth());
  const [historyYear, setHistoryYear] = useState<number | null>(new Date().getFullYear());
  const [showStats, setShowStats] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    const color = isDarkMode ? '#2a2d3e' : '#e0e5ec';
    metas.forEach(m => m.setAttribute('content', color));
  }, [isDarkMode]);

  useEffect(() => {
    const unsub = onValue(shiftsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) { const list: Shift[] = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })); list.sort((a, b) => a.timestamp - b.timestamp); setAllShifts(list); }
      else setAllShifts([]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onValue(clubBookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) { const list: ClubBooking[] = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })); list.sort((a, b) => a.timestamp - b.timestamp); setAllBookings(list); }
      else setAllBookings([]);
      setLoadingBookings(false);
    });
    return () => unsub();
  }, []);

  const handleSuccess = () => setIsModalOpen(false);
  const now = new Date();
  const currentShifts = allShifts.filter(s => { const { end } = getShiftTimes(s.scheduledDate, s.startTime, s.endTime); return end > now; });
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const currentBookings = allBookings.filter(b => { const [dd, mm, yy] = b.scheduledDate.split('/').map(Number); return new Date(yy, mm - 1, dd) >= todayStart; });
  const matchesMonthYear = (dateStr: string) => { const [, mm, yy] = dateStr.split('/').map(Number); if (historyYear !== null && yy !== historyYear) return false; if (historyMonth !== null && mm - 1 !== historyMonth) return false; return true; };
  const historyShifts = useMemo(() => allShifts.filter(s => { const { end } = getShiftTimes(s.scheduledDate, s.startTime, s.endTime); return end <= now && matchesMonthYear(s.scheduledDate); }).reverse(), [allShifts, historyMonth, historyYear]);
  const historyBookings = useMemo(() => allBookings.filter(b => { const [dd, mm, yy] = b.scheduledDate.split('/').map(Number); return new Date(yy, mm - 1, dd) < todayStart && matchesMonthYear(b.scheduledDate); }).reverse(), [allBookings, historyMonth, historyYear]);
  const shifts = showHistory ? historyShifts : currentShifts;
  const bookings = showHistory ? historyBookings : currentBookings;
  const usageStats = useMemo(() => { const items = activeTab === 'charging' ? historyShifts : historyBookings; const c: Record<string, number> = {}; for (const item of items) { const n = activeTab === 'charging' ? (item as Shift).username : (item as ClubBooking).name; c[n] = (c[n] || 0) + 1; } return Object.entries(c).sort((a, b) => b[1] - a[1]); }, [activeTab, historyShifts, historyBookings]);
  const maxUsage = usageStats.length > 0 ? usageStats[0][1] : 0;
  const availableYears = useMemo(() => { const y = new Set<number>(); for (const s of allShifts) { const v = parseInt(s.scheduledDate.split('/')[2]); if (v) y.add(v); } for (const b of allBookings) { const v = parseInt(b.scheduledDate.split('/')[2]); if (v) y.add(v); } y.add(new Date().getFullYear()); return [...y].sort(); }, [allShifts, allBookings]);
  const isLoading = activeTab === 'charging' ? loading : loadingBookings;
  const count = activeTab === 'charging' ? shifts.length : bookings.length;

  // Color palette for stat bars
  const barColors = [
    'bg-[#DC143C]',
    'bg-cyan-500 dark:bg-cyan-400',
    'bg-amber-500 dark:bg-amber-400',
    'bg-[#DC143C]/80',
    'bg-emerald-500 dark:bg-emerald-400',
    'bg-sky-500 dark:bg-sky-400',
    'bg-orange-500 dark:bg-orange-400',
    'bg-pink-500 dark:bg-pink-400',
  ];

  return (
    <div className="neu-bg min-h-screen pb-20 text-slate-700 dark:text-slate-200 transition-colors duration-500">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full neu-header a-fade-in" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <svg className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0" viewBox="0 0 64 64" fill="none">
              <rect x="6" y="6" width="23" height="23" rx="5" fill="currentColor" className="text-slate-600 dark:text-slate-300"/>
              <rect x="35" y="6" width="23" height="23" rx="5" fill="currentColor" className="text-slate-600 dark:text-slate-300"/>
              <rect x="6" y="35" width="23" height="23" rx="5" fill="currentColor" className="text-slate-600 dark:text-slate-300"/>
              <rect x="35" y="35" width="23" height="23" rx="5" fill="#DC143C"/>
            </svg>
            <h1 className="text-base md:text-xl font-extrabold tracking-tight text-slate-700 dark:text-slate-100 truncate">
              הר כנען <span className="text-[#DC143C]">19</span>
            </h1>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 rounded-full neu-btn flex items-center justify-center">
            {isDarkMode ? (
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg>
            ) : (
              <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
            )}
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-5 md:py-8">
        {/* Tabs */}
        <div className="neu-raised p-1.5 rounded-full mb-6 md:mb-8 a-fade-up a-d1 bg-gradient-to-r from-[#DC143C]/5 via-transparent to-[#DC143C]/5">
          <div className="flex gap-1.5">
            <button onClick={() => { setActiveTab('charging'); setShowHistory(false); setShowStats(false); }}
              className={`flex-1 py-2.5 md:py-3 px-4 rounded-full font-bold text-sm md:text-base transition-all duration-300 spring flex items-center justify-center gap-2 ${
                activeTab === 'charging' ? 'neu-concave text-slate-800 dark:text-[#E8556D] bg-amber-50/50 dark:bg-amber-900/10' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}>
              <svg className={`w-4 h-4 ${activeTab === 'charging' ? 'text-amber-500 dark:text-amber-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              עמדת טעינה
            </button>
            <button onClick={() => { setActiveTab('club'); setShowHistory(false); setShowStats(false); }}
              className={`flex-1 py-2.5 md:py-3 px-4 rounded-full font-bold text-sm md:text-base transition-all duration-300 spring flex items-center justify-center gap-2 ${
                activeTab === 'club' ? 'neu-concave text-slate-800 dark:text-[#E8556D] bg-[#DC143C]/5 dark:bg-[#DC143C]/10' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}>
              <svg className={`w-4 h-4 ${activeTab === 'club' ? 'text-[#DC143C]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              מועדון דיירים
            </button>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4 md:mb-6 a-fade-up a-d2">
            <h2 className="text-lg md:text-2xl font-extrabold text-slate-700 dark:text-slate-100 tracking-tight">
              {showHistory ? (activeTab === 'charging' ? 'היסטוריית משמרות' : 'היסטוריית הזמנות') : (activeTab === 'charging' ? 'משמרות קרובות' : 'הזמנות מועדון')}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => { const next = !showHistory; setShowHistory(next); setShowStats(next); }}
                className={`text-[10px] md:text-xs font-bold px-3.5 py-1.5 rounded-full transition-all duration-300 spring flex items-center gap-1.5 ${
                  showHistory ? 'neu-concave text-[#DC143C] bg-[#DC143C]/5 dark:bg-[#DC143C]/10' : 'neu-btn text-slate-400'
                }`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                היסטוריה
              </button>
              <div className="text-[9px] md:text-[10px] font-bold text-slate-600 dark:text-slate-300 neu-pill px-3 py-1.5 rounded-full uppercase tracking-[0.15em]">
                {count} רשומות
              </div>
            </div>
          </div>

          {showHistory && (
            <div className="mb-4 md:mb-6 space-y-3 a-fade-up">
              <div className="flex items-center gap-2 flex-wrap">
                <select value={historyMonth === null ? 'all' : historyMonth} onChange={(e) => setHistoryMonth(e.target.value === 'all' ? null : Number(e.target.value))}
                  className="px-3.5 py-2 neu-inset rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none appearance-none">
                  <option value="all">כל השנה</option>
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={historyYear === null ? 'all' : historyYear} onChange={(e) => setHistoryYear(e.target.value === 'all' ? null : Number(e.target.value))}
                  className="px-3.5 py-2 neu-inset rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none appearance-none">
                  <option value="all">כל השנים</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button onClick={() => setShowStats(!showStats)}
                  className={`mr-auto text-[10px] md:text-xs font-bold px-3.5 py-1.5 rounded-full transition-all duration-300 spring flex items-center gap-1.5 ${
                    showStats ? 'neu-concave text-cyan-600 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/15' : 'neu-btn text-slate-400'
                  }`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  סטטיסטיקה
                </button>
              </div>
              {showStats && (
                <div className="neu-raised rounded-3xl p-4 md:p-6 a-scale-in">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-100 mb-4 tracking-tight flex items-center gap-2">
                    <svg className="w-4 h-4 text-cyan-500 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    שימוש לפי דייר — {historyMonth !== null ? MONTH_NAMES[historyMonth] : 'כל החודשים'} {historyYear !== null ? historyYear : 'כל השנים'}
                  </h3>
                  {usageStats.length === 0 ? (
                    <p className="text-xs text-slate-400 font-semibold a-fade-in">אין נתונים לתקופה זו</p>
                  ) : (
                    <div className="space-y-2.5">
                      {usageStats.map(([name, count], i) => (
                        <div key={name} className="flex items-center gap-3 a-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-20 md:w-28 truncate text-right flex-shrink-0">{name}</span>
                          <div className="flex-1 h-6 neu-inset rounded-full overflow-hidden">
                            <div className={`h-full ${barColors[i % barColors.length]} rounded-full flex items-center justify-end px-2 transition-all duration-700`}
                              style={{ width: `${Math.max((count / maxUsage) * 100, 12)}%`, transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
                              <span className="text-[10px] font-bold text-white leading-none">{count}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-5 a-fade-in">
              <div className="relative w-14 h-14 neu-concave rounded-full flex items-center justify-center">
                <div className="w-9 h-9 border-3 border-slate-300/30 dark:border-slate-600/20 rounded-full"></div>
                <div className="absolute w-9 h-9 border-3 border-t-[#DC143C] rounded-full animate-spin"></div>
              </div>
              <span className="text-slate-400 font-bold text-xs tracking-[0.2em] uppercase">טוען נתונים</span>
            </div>
          ) : activeTab === 'charging' ? (
            <ShiftList shifts={shifts} readOnly={showHistory} />
          ) : (
            <ClubBookingList bookings={bookings} readOnly={showHistory} />
          )}

          {activeTab === 'club' && (
            <div className="mt-5 p-4 rounded-2xl flex items-start gap-3 a-fade-up a-d4 bg-amber-50 dark:bg-amber-900/20 neu-flat">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              <div className="text-sm font-semibold text-amber-800 dark:text-amber-300 leading-relaxed">
                <p>בשביל המפתח למועדון יש ליצור קשר עם אביב</p>
                <p className="text-xs font-medium text-amber-700/60 dark:text-amber-400/50 mt-1">
                  קומה 2, דירה 10 · טלפון{' '}
                  <a href="tel:0545455203" className="underline underline-offset-2 transition-colors duration-200 hover:text-amber-600 dark:hover:text-amber-200" dir="ltr">054-5455203</a>
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* FAB */}
      {!showHistory && (
        <div className="fixed bottom-6 md:bottom-8 inset-x-0 flex justify-center z-40 a-scale-in a-d6">
          <button onClick={() => setIsModalOpen(true)}
            className="relative w-14 h-14 md:w-16 md:h-16 rounded-full neu-fab flex items-center justify-center group"
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <svg className="w-7 h-7 md:w-8 md:h-8 text-[#DC143C] dark:text-[#E8556D] transition-transform duration-500 group-hover:rotate-90" style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 a-fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl neu-raised rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto a-scale-in">
            {activeTab === 'charging' ? (
              <ShiftForm existingShifts={currentShifts} onSuccess={handleSuccess} onCancel={() => setIsModalOpen(false)} />
            ) : (
              <ClubBookingForm existingBookings={currentBookings} onSuccess={handleSuccess} onCancel={() => setIsModalOpen(false)} />
            )}
          </div>
        </div>
      )}

      <footer className="relative z-10 max-w-5xl mx-auto px-6 pt-8 flex justify-center a-fade-in a-d8">
        <p className="text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
          הר כנען 19 &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default App;
