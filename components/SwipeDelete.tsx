import React, { useState, useEffect, useRef } from 'react';

interface SwipeDeleteProps {
  onDelete: () => void;
  children: React.ReactNode;
  timeout?: number;
}

const SwipeDelete: React.FC<SwipeDeleteProps> = ({ onDelete, children, timeout = 3000 }) => {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      timerRef.current = setTimeout(() => setOpen(false), timeout);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [open, timeout]);

  // Remove left rounding from the card inside when open
  useEffect(() => {
    const el = contentRef.current?.querySelector('.glass-card-subtle, .glass-card') as HTMLElement | null;
    if (el) {
      el.style.borderTopLeftRadius = open ? '0' : '';
      el.style.borderBottomLeftRadius = open ? '0' : '';
      el.style.transition = 'border-radius 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
    }
  }, [open]);

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Delete action behind */}
      <div
        className={`absolute inset-y-0 left-0 flex items-center transition-all duration-300 spring ${
          open ? 'w-20 opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <button
          onClick={() => { setOpen(false); onDelete(); }}
          className="w-full h-full bg-red-500 rounded-l-3xl flex items-center justify-center text-white font-bold text-xs active:bg-red-600 transition-colors"
        >
          מחק
        </button>
      </div>
      {/* Card content */}
      <div
        ref={contentRef}
        className={`relative transition-transform duration-300 spring cursor-pointer ${
          open ? 'translate-x-20' : 'translate-x-0'
        }`}
        onClick={() => setOpen(!open)}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeDelete;
