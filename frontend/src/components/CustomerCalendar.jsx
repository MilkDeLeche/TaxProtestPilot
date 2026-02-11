import { useState } from 'react';
import { format, addMonths, subMonths, setMonth } from 'date-fns';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Calendar } from './ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function CustomerCalendar({
  selected,
  onSelect,
  modifiers = {},
  modifiersClassNames = {},
  className,
}) {
  const today = new Date();
  const [displayMonth, setDisplayMonth] = useState(selected || today);
  const [viewMode, setViewMode] = useState('month');

  const goPrev = () =>
    setDisplayMonth((d) => (viewMode === 'year' ? subMonths(d, 12) : subMonths(d, 1)));
  const goNext = () =>
    setDisplayMonth((d) => (viewMode === 'year' ? addMonths(d, 12) : addMonths(d, 1)));
  const goToday = () => {
    setDisplayMonth(today);
    setViewMode('month');
  };

  const handleSelectMonth = (monthIndex) => {
    setDisplayMonth((d) => setMonth(d, monthIndex));
    setViewMode('month');
  };

  const displayYear = displayMonth.getFullYear();

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header: Tailwind-style */}
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-600 px-1 py-2 mb-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          <time dateTime={format(displayMonth, 'yyyy-MM')}>
            {viewMode === 'month'
              ? format(displayMonth, 'MMMM yyyy')
              : format(displayMonth, 'yyyy')}
          </time>
        </h2>
        <div className="flex items-center gap-2">
          {/* Prev / Today / Next */}
          <div className="relative flex items-center rounded-md border border-slate-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={goPrev}
              className="flex h-9 w-9 items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-l-md transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="hidden md:block px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 border-x border-slate-200 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex h-9 w-9 items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-r-md transition-colors"
              aria-label="Next month"
            >
              <ChevronRightIcon className="size-5" />
            </button>
          </div>
          {/* View dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-x-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 transition-colors"
              >
                {viewMode === 'month' ? 'Month view' : 'Year view'}
                <ChevronDownIcon className="-mr-1 size-5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setViewMode('month')}>
                Month view
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('year')}>
                Year view
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Body */}
      {viewMode === 'month' ? (
        <Calendar
          mode="single"
          selected={selected ?? undefined}
          onSelect={onSelect}
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          components={{ Caption: () => null }}
          className="p-0 [&_.rdp-months]:justify-start"
          classNames={{
            head_cell: "text-slate-500 dark:text-slate-400 rounded-md w-10 font-normal text-xs",
            row: "flex w-full mt-2",
            cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
            day: "h-10 w-10 p-0 font-normal rounded-full hover:bg-slate-100",
            day_selected: "bg-[#1e3a8a] text-white hover:bg-[#1e3a8a] hover:text-white focus:bg-[#1e3a8a] focus:text-white",
            day_today: "bg-slate-100 font-semibold text-[#1e3a8a]",
          }}
        />
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {MONTH_NAMES.map((name, i) => {
            const isCurrentMonth = today.getMonth() === i && today.getFullYear() === displayYear;
            return (
              <button
                key={name}
                type="button"
                onClick={() => handleSelectMonth(i)}
                className={cn(
                  'rounded-md px-4 py-3 text-sm font-medium transition-colors',
                  isCurrentMonth
                    ? 'bg-[#1e3a8a] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                )}
              >
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
