import React, { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subMonths,
  addMonths,
  isSameMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";

export const ActivityHeatmap = ({ data, compact = false }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate days for current month view
  const monthData = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Add padding days at the start (to align with day of week)
    const startDayOfWeek = getDay(start); // 0 = Sunday
    const paddingDays = Array(startDayOfWeek).fill(null);

    return paddingDays.concat(
      days.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return {
          date,
          dateStr,
          count: data?.[dateStr] || 0,
        };
      }),
    );
  }, [currentMonth, data]);

  // Calculate total activity for the month
  const monthTotal = useMemo(() => {
    return monthData
      .filter((d) => d !== null)
      .reduce((sum, d) => sum + (d?.count || 0), 0);
  }, [monthData]);

  // Calculate streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = format(date, "yyyy-MM-dd");
      if (data?.[dateStr] > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [data]);

  const getColor = (count) => {
    if (count === 0) return "bg-gray-100";
    if (count <= 1) return "bg-emerald-200";
    if (count <= 3) return "bg-emerald-400";
    return "bg-emerald-600";
  };

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  const weekDays = compact
    ? ["S", "M", "T", "W", "T", "F", "S"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full">
      {/* Header with Month Selector and Stats */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span
            className={`font-semibold text-gray-800 ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            {format(currentMonth, compact ? "MMM yyyy" : "MMMM yyyy")}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isSameMonth(currentMonth, new Date())}
          >
            <ChevronRight
              className={`w-4 h-4 ${
                isSameMonth(currentMonth, new Date())
                  ? "text-gray-300"
                  : "text-gray-500"
              }`}
            />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{monthTotal} this month</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
            <Flame className="w-3 h-3 text-orange-500" />
            <span className="text-xs font-bold text-orange-600">
              {currentStreak}
            </span>
          </div>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`text-center font-medium text-gray-400 ${
              compact ? "text-[9px]" : "text-[10px]"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid - Compact boxes */}
      <div className="grid grid-cols-7 gap-0.5">
        {monthData.map((dayData, index) => {
          if (dayData === null) {
            return (
              <div
                key={`empty-${index}`}
                className={`${compact ? "w-4 h-4" : "w-5 h-5"} rounded-sm`}
              />
            );
          }

          const isToday =
            format(dayData.date, "yyyy-MM-dd") ===
            format(new Date(), "yyyy-MM-dd");

          return (
            <div
              key={dayData.dateStr}
              className={`${
                compact ? "w-4 h-4" : "w-5 h-5"
              } rounded-sm ${getColor(dayData.count)} 
                ${isToday ? "ring-1 ring-primary-500" : ""}
                cursor-default transition-transform hover:scale-110`}
              title={`${format(dayData.date, "MMM d")}: ${
                dayData.count
              } activities`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 text-[9px] text-gray-400 justify-end">
        <span>Less</span>
        <div className="w-2.5 h-2.5 bg-gray-100 rounded-sm" />
        <div className="w-2.5 h-2.5 bg-emerald-200 rounded-sm" />
        <div className="w-2.5 h-2.5 bg-emerald-400 rounded-sm" />
        <div className="w-2.5 h-2.5 bg-emerald-600 rounded-sm" />
        <span>More</span>
      </div>
    </div>
  );
};
