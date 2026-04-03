"use client";
import { useState } from "react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isBefore,
  isSameMonth, isSameDay, startOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "13:00", "13:30", "14:00", "14:30", "15:00",
  "15:30", "16:00", "16:30", "17:00", "17:30",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DateTimeStep({
  onNext,
  onBack,
  selectedDate,
  selectedTime,
}: {
  onNext: (data: { date: string; time: string; notes: string }) => void;
  onBack: () => void;
  selectedDate?: string;
  selectedTime?: string;
}) {
  const today     = startOfDay(new Date());
  const [month, setMonth]   = useState(today);
  const [date, setDate]     = useState<Date | null>(selectedDate ? startOfDay(new Date(selectedDate + "T00:00:00")) : null);
  const [time, setTime]     = useState<string | undefined>(selectedTime);
  const [notes, setNotes]   = useState("");

  // Build full calendar grid (Sun–Sat rows covering the whole month)
  const monthStart  = startOfMonth(month);
  const monthEnd    = endOfMonth(month);
  const calStart    = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd      = endOfWeek(monthEnd,   { weekStartsOn: 0 });
  const calDays     = eachDayOfInterval({ start: calStart, end: calEnd });

  const dateStr = (d: Date) => format(d, "yyyy-MM-dd");

  const handleNext = () => {
    if (!date || !time) return;
    onNext({ date: dateStr(date), time, notes });
  };

  return (
    <div>
      <h2 className="font-[Playfair_Display] text-2xl text-[#0a0a0a] mb-1">Pick a Date & Time</h2>
      <p className="text-sm text-[#0a0a0a]/45 mb-8">Choose your preferred appointment slot.</p>

      {/* ── Month calendar ─────────────────────────────── */}
      <div className="mb-8 bg-white border border-black/8 rounded-2xl overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/8">
          <button
            onClick={() => setMonth((m) => subMonths(m, 1))}
            disabled={isBefore(endOfMonth(subMonths(month, 1)), today)}
            className="p-1.5 rounded-lg hover:bg-black/5 disabled:opacity-25 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-[#0a0a0a]">
            {format(month, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-black/6">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold tracking-widest uppercase text-[#0a0a0a]/35">
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7">
          {calDays.map((day, idx) => {
            const isPast        = isBefore(day, today);
            const isOtherMonth  = !isSameMonth(day, month);
            const isSelected    = date ? isSameDay(day, date) : false;
            const isToday       = isSameDay(day, today);

            return (
              <button
                key={idx}
                disabled={isPast || isOtherMonth}
                onClick={() => { setDate(day); setTime(undefined); }}
                className={cn(
                  "relative h-10 flex items-center justify-center text-sm transition-all duration-150",
                  // grid lines
                  idx % 7 !== 6 && "border-r border-black/5",
                  Math.floor(idx / 7) < Math.floor((calDays.length - 1) / 7) && "border-b border-black/5",
                  // states
                  isSelected
                    ? "bg-[#0a0a0a] text-white font-semibold"
                    : isToday && !isPast
                    ? "text-[#b22222] font-semibold hover:bg-black/5"
                    : isPast || isOtherMonth
                    ? "text-[#0a0a0a]/15 cursor-not-allowed"
                    : "text-[#0a0a0a]/75 hover:bg-[#f9f7f2] hover:text-[#0a0a0a]"
                )}
              >
                {format(day, "d")}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#b22222]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Time slots ─────────────────────────────────── */}
      {date && (
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#0a0a0a]/40 mb-3">
            Available Times — {format(date, "EEEE, MMMM d")}
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                onClick={() => setTime(slot)}
                className={cn(
                  "py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150",
                  time === slot
                    ? "bg-[#b22222] text-white shadow-sm"
                    : "bg-white border border-black/10 text-[#0a0a0a]/60 hover:border-[#d4af37] hover:text-[#0a0a0a]"
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Notes ──────────────────────────────────────── */}
      <div className="mb-10">
        <label className="block text-xs font-semibold tracking-widest uppercase text-[#0a0a0a]/40 mb-2">
          Special Requests <span className="normal-case tracking-normal font-normal">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Allergies, style references, anything we should know…"
          className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-sm text-[#0a0a0a] placeholder:text-[#0a0a0a]/30 resize-none focus:outline-none focus:ring-2 focus:ring-[#d4af37]/40 focus:border-[#d4af37] transition-all"
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">Back</Button>
        <Button onClick={handleNext} disabled={!date || !time} size="lg" className="gap-2">
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
