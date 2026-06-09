/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, X, CheckSquare } from 'lucide-react';
import { Company, AppLanguage } from '../types';
import { TRANSLATIONS } from '../i18n';

interface CalendarTabProps {
  companies: Company[];
  pendingItems: {
    c: Company;
    ci: number;
    fyL: string;
    r: {
      form: string;
      desc: string;
      dueDate: Date;
    };
    diff: number;
    key: string;
  }[];
  lang: AppLanguage;
}

export default function CalendarTab({ companies, pendingItems, lang }: CalendarTabProps) {
  const t = TRANSLATIONS[lang];

  // Calendar State
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-indexed
  const [selectedCellDate, setSelectedCellDate] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Navigate Months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(new Date().getFullYear());
    setCurrentMonth(new Date().getMonth());
  };

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl min-h-[300px]">
        <Calendar className="w-12 h-12 text-gray-300 dark:text-neutral-700 mb-3 animate-pulse" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t.dashNoCompaniesTitle}
        </p>
        <p className="text-[10px] text-gray-400 mt-1 max-w-xs leading-relaxed">
          Add profiles inside the Company Tracker tab to render your interactive monthly regulatory dashboard.
        </p>
      </div>
    );
  }

  // Pre-calculate filing items map grouped by date: 'YYYY-MM-DD'
  const datePillsMap: Record<string, typeof pendingItems> = {};
  pendingItems.forEach(item => {
    const dStr = item.r.dueDate.toISOString().split('T')[0];
    if (!datePillsMap[dStr]) {
      datePillsMap[dStr] = [];
    }
    datePillsMap[dStr].push(item);
  });

  // Calculate calendar grid metrics
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const cells: { dateStr: string | null; dayNum: number | null; isToday: boolean }[] = [];

  // Filled slots for previous month offset
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push({ dateStr: null, dayNum: null, isToday: false });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Core days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(d).padStart(2, '0');
    const dStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    const isToday = dStr === todayStr;

    cells.push({
      dateStr: dStr,
      dayNum: d,
      isToday
    });
  }

  // Trailing slots for complete 7-col alignment
  const totalCellsLength = cells.length;
  const trailingCells = totalCellsLength % 7 === 0 ? 0 : 7 - (totalCellsLength % 7);
  for (let i = 0; i < trailingCells; i++) {
    cells.push({ dateStr: null, dayNum: null, isToday: false });
  }

  // Selected date cell items
  const activeCellItems = selectedCellDate ? (datePillsMap[selectedCellDate] || []) : [];

  return (
    <div className="space-y-4 leading-relaxed relative">
      {/* Month Navigation Row */}
      <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 p-3 rounded-xl shadow-2xs flex-wrap gap-2.5">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 border border-gray-200 dark:border-neutral-800 text-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer dark:text-gray-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-gray-801 dark:text-white min-w-[120px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 border border-gray-200 dark:border-neutral-800 text-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer dark:text-gray-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGoToday}
            className="text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 border border-gray-200 dark:border-neutral-800 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* Main Grid Calendar Container */}
      <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xs">
        {/* Day name headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-neutral-850 bg-gray-50/50 dark:bg-neutral-905">
          {daysOfWeek.map((day, idx) => (
            <div
              key={idx}
              className="text-center py-2 text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest border-r last:border-r-0 border-gray-100 dark:border-neutral-850"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 border-collapse">
          {cells.map((cell, idx) => {
            const items = cell.dateStr ? (datePillsMap[cell.dateStr] || []) : [];
            const hasItems = items.length > 0;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (cell.dateStr && hasItems) {
                    setSelectedCellDate(cell.dateStr);
                  }
                }}
                className={`min-h-[72px] sm:min-h-[85px] border-r border-b last-row-custom last:border-r-0 border-gray-100 dark:border-neutral-850 p-1.5 flex flex-col justify-between transition-colors relative ${
                  !cell.dayNum
                    ? 'bg-gray-50/20 dark:bg-neutral-950/20 opacity-30 select-none'
                    : 'bg-white dark:bg-neutral-900 hover:bg-gray-50/15 dark:hover:bg-neutral-800/10 cursor-pointer'
                } ${cell.isToday ? 'bg-blue-50/10 dark:bg-neutral-800/20 ring-1 ring-inset ring-blue-500/30' : ''}`}
              >
                {/* Date number */}
                {cell.dayNum && (
                  <span className={`text-[10px] font-extrabold ${
                    cell.isToday
                      ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-100/50 dark:bg-blue-900/35 px-1.5 py-0.5 rounded-full shrink-0 block w-max'
                      : 'text-gray-400 dark:text-neutral-500'
                  }`}>
                    {cell.dayNum}
                  </span>
                )}

                {/* Day compliance pills */}
                {cell.dayNum && hasItems && (
                  <div className="space-y-1 mt-1 flex-1 flex flex-col justify-end">
                    {items.slice(0, 2).map((item, pIdx) => {
                      const pillCls = item.diff < 0
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/35'
                        : item.diff <= 7
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100/50 dark:border-neutral-800';

                      return (
                        <span
                          key={pIdx}
                          className={`text-[8.5px] font-bold py-0.5 px-1.5 rounded-md block leading-tight truncate text-left max-w-full ${pillCls}`}
                          title={`${item.r.form} — ${item.c.name}`}
                        >
                          {item.r.form}
                        </span>
                      );
                    })}

                    {items.length > 2 && (
                      <span className="text-[8px] font-extrabold text-blue-600 dark:text-blue-400 block text-right">
                        +{items.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day filings detail Overlay Modal */}
      {selectedCellDate && activeCellItems.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-fade-in relative text-left">
            <button
              onClick={() => setSelectedCellDate(null)}
              className="absolute top-3.5 right-3.5 p-1 text-gray-400 hover:text-rose-500 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Filing Deadlines for
              </span>
              <h4 className="text-sm font-bold text-gray-901 dark:text-white flex items-center gap-1.5 bg-gray-50 dark:bg-neutral-800 p-2 rounded-md border border-gray-150 dark:border-neutral-800/80 mt-1">
                <Clock className="w-4 h-4 text-blue-500" />
                {new Date(selectedCellDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </h4>
            </div>

            {/* List items */}
            <div className="space-y-3 overflow-y-auto max-h-[220px] pr-1">
              {activeCellItems.map((item, idx) => {
                const isOverdue = item.diff < 0;
                const badgeCls = isOverdue
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-450 border border-rose-100 dark:border-rose-900/35'
                  : item.diff <= 7
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-100 dark:border-amber-900/30'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450 border border-blue-150/40 dark:border-neutral-800';

                return (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50/30 dark:bg-neutral-905 border border-gray-100 dark:border-neutral-850 rounded-lg flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-901 dark:text-white">
                        {item.r.form}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badgeCls}`}>
                        {isOverdue ? `Overdue by ${Math.abs(item.diff)}d` : `Due in ${item.diff}d`}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-650 dark:text-gray-300">
                      {item.c.name}
                    </p>
                    <p className="text-[10px] text-gray-400 leading-snug">
                      {item.r.desc} &middot; {item.fyL}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
