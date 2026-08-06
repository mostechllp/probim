// components/common/TimeInputForWorkingHrs.jsx
import React, { useState, useEffect, useRef } from "react";

export const TimeInputWorking = ({
  value,
  onChange,
  className = "",
  required = false,
  maxHours = 24,
  disabled = false,
}) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [error, setError] = useState("");
  const hoursRef = useRef(null);
  const minutesRef = useRef(null);

  // Parse the value (which could be in decimal hours like "2.42")
  const parseTime = (val) => {
    if (!val || val === "" || val === "0") return { hours: 0, minutes: 0 };

    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return { hours: 0, minutes: 0 };

    const h = Math.floor(num);
    const m = Math.round((num - h) * 60);
    return { hours: h, minutes: m };
  };

  // Update internal state when value changes externally
  useEffect(() => {
    const parsed = parseTime(value);
    setHours(parsed.hours);
    setMinutes(parsed.minutes);
  }, [value]);

  // Convert hours and minutes to decimal for parent
  const updateParent = (h, m) => {
    const totalMinutes = h * 60 + m;
    const decimalHours = totalMinutes / 60;
    const rounded = Math.round(decimalHours * 100) / 100;
    onChange?.({ target: { value: String(rounded) } });
  };

  const handleHoursChange = (e) => {
    let val = e.target.value;
    if (val === "") {
      setHours(0);
      updateParent(0, minutes);
      return;
    }

    let h = parseInt(val);
    if (isNaN(h)) h = 0;
    if (h < 0) h = 0;

    const maxH = Math.floor(maxHours);
    if (h > maxH) h = maxH;

    setHours(h);
    updateParent(h, minutes);
    setError("");
  };

  const handleMinutesChange = (e) => {
    let val = e.target.value;
    if (val === "") {
      setMinutes(0);
      updateParent(hours, 0);
      return;
    }

    let m = parseInt(val);
    if (isNaN(m)) m = 0;
    if (m < 0) m = 0;
    if (m > 59) m = 59;

    const totalMinutes = hours * 60 + m;
    const maxTotalMinutes = Math.floor(maxHours * 60);
    if (totalMinutes > maxTotalMinutes && maxHours > 0) {
      setError(`Max ${maxHours} hrs`);
      const cappedMinutes = maxTotalMinutes - hours * 60;
      if (cappedMinutes >= 0) {
        setMinutes(cappedMinutes);
        updateParent(hours, cappedMinutes);
      }
      return;
    }

    setMinutes(m);
    updateParent(hours, m);
    setError("");
  };

  const handleHoursBlur = () => {
    if (isNaN(hours) || hours < 0) {
      setHours(0);
      updateParent(0, minutes);
    }
    const maxH = Math.floor(maxHours);
    if (hours > maxH) {
      setHours(maxH);
      updateParent(maxH, minutes);
    }
    setError("");
  };

  const handleMinutesBlur = () => {
    if (isNaN(minutes) || minutes < 0) {
      setMinutes(0);
      updateParent(hours, 0);
    }
    if (minutes > 59) {
      setMinutes(59);
      updateParent(hours, 59);
    }
    setError("");
  };

  const isMaxedOut =
    maxHours > 0 && hours * 60 + minutes >= Math.floor(maxHours * 60);

  return (
    <div className={`relative w-full ${className}`}>
      <div className="flex items-center gap-1 bg-[var(--surface2)] border border-[var(--border)] rounded-lg focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20 transition-all">
        <input
          ref={hoursRef}
          type="number"
          value={hours}
          onChange={handleHoursChange}
          onBlur={handleHoursBlur}
          min="0"
          max={Math.floor(maxHours)}
          disabled={disabled}
          className="w-12 px-1 py-2 bg-transparent border-0 text-center text-sm text-[var(--text)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0"
        />
        <span className="text-xs text-[var(--muted)]">h</span>
        <input
          ref={minutesRef}
          type="number"
          value={minutes}
          onChange={handleMinutesChange}
          onBlur={handleMinutesBlur}
          min="0"
          max="59"
          disabled={disabled || isMaxedOut}
          className="w-12 px-1 py-2 bg-transparent border-0 text-center text-sm text-[var(--text)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="00"
        />
        <span className="text-xs text-[var(--muted)]">m</span>
      </div>

      {error && (
        <p className="absolute -bottom-5 left-0 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};
