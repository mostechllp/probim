import { useRef, useState } from "react";

export const TimeInputWorking = ({ value, onChange, className = "", required = false }) => {
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    let v = e.target.value.replace(/[^0-9.]/g, "");
    const parts = v.split(".");
    if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
    if (parts.length === 2 && parts[1].length > 2) {
      v = parts[0] + "." + parts[1].slice(0, 2);
    }

    e.target.value = v;

    const n = parseFloat(v);
    if (v === "" || v === ".") {
      setError("");
    } else if (isNaN(n) || n < 0) {
      setError("Enter a positive number");
    } else if (n > 24) {
      setError("Max 24 hrs");
    } else {
      setError("");
    }

    onChange({ ...e, target: { ...e.target, value: v } });
  };

  const handleBlur = (e) => {
    const n = parseFloat(e.target.value);
    if (!isNaN(n) && n >= 0 && n <= 24) {
      const cleaned = n.toString();
      inputRef.current.value = cleaned;
      onChange({ ...e, target: { ...e.target, value: cleaned } });
    }
    setError("");
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        defaultValue={value}
        placeholder="0"
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white
          ${error ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}
          ${className}`}
        required={required}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      {error && (
        <p className="absolute -bottom-5 left-0 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};