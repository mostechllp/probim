import { forwardRef, useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DateInput = forwardRef(
  (
    {
      value,
      onChange,
      placeholder = "dd/mm/yyyy",
      className = "",
      error = false,
      onBlur,
      minDate,
      maxDate,
      type = "general",
      ...props
    },
    // eslint-disable-next-line no-unused-vars
    ref 
  ) => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [internalError, setInternalError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Helper function to parse date from string (DD/MM/YYYY) to Date object
    const parseDate = (dateValue) => {
      if (!dateValue) return null;
      
      // If it's already a Date object
      if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
        return dateValue;
      }
      
      // If it's a string in YYYY-MM-DD format
      if (typeof dateValue === "string" && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateValue.split("-");
        const date = new Date(year, month - 1, day);
        return isNaN(date.getTime()) ? null : date;
      }
      
      // If it's a string in DD/MM/YYYY format
      if (typeof dateValue === "string" && dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateValue.split("/");
        const date = new Date(year, month - 1, day);
        return isNaN(date.getTime()) ? null : date;
      }
      
      return null;
    };

    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate min and max dates based on type
    const getMinDate = () => {
      if (minDate) return minDate;
      if (type === "dob") {
        const hundredYearsAgo = new Date();
        hundredYearsAgo.setFullYear(today.getFullYear() - 100);
        return hundredYearsAgo;
      }
      if (type === "special_day") {
        const hundredYearsAgo = new Date();
        hundredYearsAgo.setFullYear(today.getFullYear() - 100);
        return hundredYearsAgo;
      }
      return null;
    };

    const getMaxDate = () => {
      if (maxDate) return maxDate;
      if (type === "dob") {
        // Age must be at least 18
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(today.getFullYear() - 18);
        return eighteenYearsAgo;
      }
      if (type === "special_day") {
        return today;
      }
      return null;
    };

    const validateDate = (date) => {
      if (!date) {
        setInternalError(false);
        setErrorMessage("");
        return true;
      }
      
      if (type === "dob") {
        // Check if date is in the future
        if (date > today) {
          setInternalError(true);
          setErrorMessage("Date of birth cannot be in the future");
          return false;
        }
        
        // Check if date is too old (more than 100 years)
        const hundredYearsAgo = new Date();
        hundredYearsAgo.setFullYear(today.getFullYear() - 100);
        if (date < hundredYearsAgo) {
          setInternalError(true);
          setErrorMessage("Date of birth seems too old (max 100 years)");
          return false;
        }
        
        // Check if age is reasonable (minimum 18 years for employment)
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(today.getFullYear() - 18);
        if (date > eighteenYearsAgo) {
          setInternalError(true);
          setErrorMessage("Employee must be at least 18 years old");
          return false;
        }
      }
      
      if (type === "special_day") {
        // Special days (birthdays, anniversaries) cannot be in the future
        if (date > today) {
          setInternalError(true);
          setErrorMessage("Date cannot be in the future");
          return false;
        }
      }
      
      setInternalError(false);
      setErrorMessage("");
      return true;
    };

    const handleDateChange = (date) => {
      setSelectedDate(date);
      
      if (validateDate(date)) {
        if (onChange) {
          if (date && date instanceof Date && !isNaN(date.getTime())) {
            // Format as YYYY-MM-DD for form state
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            onChange(`${year}-${month}-${day}`);
          } else {
            onChange("");
          }
        }
      } else {
        // Clear the form value when invalid date is selected
        if (onChange) {
          onChange("");
        }
      }
    };

    const handleBlur = (e) => {
      if (onBlur) onBlur(e);
    };

    // Update selectedDate when value changes externally
    useEffect(() => {
      const newDate = parseDate(value);
      setSelectedDate(newDate);
      
      if (newDate) {
        validateDate(newDate);
      } else {
        setInternalError(false);
        setErrorMessage("");
      }
    }, [value]);

    // Custom input component
    const CustomInput = forwardRef(({ value: inputValue, onClick, onChange: onInputChange, onBlur: inputOnBlur }, customRef) => {
      // Format the display value as DD/MM/YYYY
      let displayValue = "";
      if (inputValue) {
        // If inputValue is a Date object
        if (inputValue instanceof Date && !isNaN(inputValue.getTime())) {
          const day = String(inputValue.getDate()).padStart(2, "0");
          const month = String(inputValue.getMonth() + 1).padStart(2, "0");
          const year = inputValue.getFullYear();
          displayValue = `${day}/${month}/${year}`;
        } 
        // If inputValue is a string in YYYY-MM-DD format
        else if (typeof inputValue === "string" && inputValue.includes("-")) {
          const [year, month, day] = inputValue.split("-");
          displayValue = `${day}/${month}/${year}`;
        }
        // If inputValue is already in DD/MM/YYYY format
        else if (typeof inputValue === "string" && inputValue.includes("/")) {
          displayValue = inputValue;
        }
        // If it's something else, try to convert
        else if (typeof inputValue === "string") {
          displayValue = inputValue;
        }
      }

      const showError = error || internalError;

      // Determine placeholder text based on type
      const getPlaceholder = () => {
        if (type === "dob") return "dd/mm/yyyy";
        if (type === "special_day") return "dd/mm/yyyy";
        return placeholder;
      };

      return (
        <div className="relative w-full">
          <input
            ref={customRef}
            type="text"
            value={displayValue}
            onClick={onClick}
            onChange={onInputChange}
            onBlur={(e) => {
              inputOnBlur?.(e);
              handleBlur(e);
            }}
            placeholder={getPlaceholder()}
            readOnly
            className={`w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 transition-all focus:outline-none focus:ring-2 cursor-pointer ${
              showError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-green-500/20"
            } ${className}`}
            {...props}
          />
          {internalError && errorMessage && (
            <p className="absolute -bottom-5 left-0 text-xs text-red-500 whitespace-nowrap">
              <i className="fas fa-exclamation-circle mr-1"></i>
              {errorMessage}
            </p>
          )}
        </div>
      );
    });

    CustomInput.displayName = "CustomInput";

    // Inject custom styles for react-datepicker with proper dark mode support
    useEffect(() => {
      const styleId = "react-datepicker-custom-styles";
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
          /* Base variables that will be overridden by theme */
          :root {
            --datepicker-surface: #ffffff;
            --datepicker-surface2: #f9fafb;
            --datepicker-text: #1f2937;
            --datepicker-text-muted: #6b7280;
            --datepicker-border: #e5e7eb;
            --datepicker-primary: #2ecc71;
            --datepicker-primary-light: #d1fae5;
            --datepicker-primary-dark: #059669;
            --datepicker-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            --datepicker-shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
          
          .dark {
            --datepicker-surface: #1f2937;
            --datepicker-surface2: #374151;
            --datepicker-text: #f3f4f6;
            --datepicker-text-muted: #9ca3af;
            --datepicker-border: #4b5563;
            --datepicker-primary: #34d399;
            --datepicker-primary-light: #064e3b;
            --datepicker-primary-dark: #6ee7b7;
          }
          
          /* Apply theme variables to react-datepicker */
          .react-datepicker {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif !important;
            background-color: var(--datepicker-surface) !important;
            border: 1px solid var(--datepicker-border) !important;
            border-radius: 16px !important;
            box-shadow: var(--datepicker-shadow-lg) !important;
          }
          
          .react-datepicker__header {
            background-color: var(--datepicker-surface2) !important;
            border-bottom: 1px solid var(--datepicker-border) !important;
            border-radius: 16px 16px 0 0 !important;
            padding-top: 12px !important;
          }
          
          .react-datepicker__current-month,
          .react-datepicker-time__header,
          .react-datepicker-year-header {
            color: var(--datepicker-text) !important;
            font-weight: 600 !important;
            font-size: 0.95rem !important;
          }
          
          .react-datepicker__day-name,
          .react-datepicker__day,
          .react-datepicker__time-name {
            color: var(--datepicker-text) !important;
          }
          
          .react-datepicker__day-name {
            color: var(--datepicker-text-muted) !important;
            font-weight: 500 !important;
          }
          
          /* Normal day hover state */
          .react-datepicker__day:not(.react-datepicker__day--selected):not(.react-datepicker__day--disabled):hover,
          .react-datepicker__month-text:not(.react-datepicker__month-text--selected):hover,
          .react-datepicker__quarter-text:not(.react-datepicker__quarter-text--selected):hover,
          .react-datepicker__year-text:not(.react-datepicker__year-text--selected):hover {
            background-color: var(--datepicker-primary-light) !important;
            color: var(--datepicker-primary-dark) !important;
          }
          
          /* Selected day - FIXED for visibility */
          .react-datepicker__day--selected,
          .react-datepicker__day--in-selecting-range,
          .react-datepicker__day--in-range,
          .react-datepicker__month-text--selected,
          .react-datepicker__month-text--in-selecting-range,
          .react-datepicker__month-text--in-range,
          .react-datepicker__quarter-text--selected,
          .react-datepicker__quarter-text--in-selecting-range,
          .react-datepicker__quarter-text--in-range,
          .react-datepicker__year-text--selected,
          .react-datepicker__year-text--in-selecting-range,
          .react-datepicker__year-text--in-range {
            background-color: var(--datepicker-primary) !important;
            color: #ffffff !important;
          }
          
          /* Ensure selected date text is always white */
          .react-datepicker__day--selected {
            background-color: var(--datepicker-primary) !important;
            color: white !important;
            font-weight: 600 !important;
          }
          
          /* Dark mode specific selected date fix */
          .dark .react-datepicker__day--selected {
            background-color: var(--datepicker-primary) !important;
            color: white !important;
            font-weight: 600 !important;
          }
          
          /* Range selection hover */
          .react-datepicker__day--in-selecting-range:not(.react-datepicker__day--in-range) {
            background-color: var(--datepicker-primary-light) !important;
            color: var(--datepicker-primary-dark) !important;
          }
          
          .react-datepicker__day--keyboard-selected,
          .react-datepicker__month-text--keyboard-selected,
          .react-datepicker__quarter-text--keyboard-selected,
          .react-datepicker__year-text--keyboard-selected {
            background-color: var(--datepicker-primary-light) !important;
            color: var(--datepicker-primary-dark) !important;
          }
          
          /* Today's date styling */
          .react-datepicker__day--today {
            font-weight: bold !important;
            position: relative !important;
          }
          
          .react-datepicker__day--today:not(.react-datepicker__day--selected) {
            color: var(--datepicker-primary) !important;
          }
          
          /* Navigation arrows */
          .react-datepicker__navigation-icon::before {
            border-color: var(--datepicker-text-muted) !important;
          }
          
          .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
            border-color: var(--datepicker-primary) !important;
          }
          
          /* Dropdowns */
          .react-datepicker__year-dropdown,
          .react-datepicker__month-dropdown {
            background-color: var(--datepicker-surface) !important;
            border: 1px solid var(--datepicker-border) !important;
            border-radius: 10px !important;
            box-shadow: var(--datepicker-shadow) !important;
          }
          
          .react-datepicker__year-dropdown option,
          .react-datepicker__month-dropdown option,
          .react-datepicker__year-dropdown-container select,
          .react-datepicker__month-dropdown-container select {
            background-color: var(--datepicker-surface) !important;
            color: var(--datepicker-text) !important;
          }
          
          .react-datepicker__year-option:hover,
          .react-datepicker__month-option:hover {
            background-color: var(--datepicker-primary-light) !important;
            color: var(--datepicker-primary-dark) !important;
          }
          
          /* Close icon */
          .react-datepicker__close-icon::after {
            background-color: var(--datepicker-primary) !important;
          }
          
          /* Remove triangle arrow */
          .react-datepicker__triangle {
            display: none !important;
          }
          
          .react-datepicker-popper[data-placement^="bottom"] .react-datepicker__triangle,
          .react-datepicker-popper[data-placement^="top"] .react-datepicker__triangle {
            display: none !important;
          }
          
          /* Month/year dropdown header */
          .react-datepicker__header__dropdown {
            margin-top: 8px !important;
          }
          
          .react-datepicker__header__dropdown--scroll select {
            background-color: var(--datepicker-surface2) !important;
            border: 1px solid var(--datepicker-border) !important;
            color: var(--datepicker-text) !important;
            padding: 6px 10px !important;
            border-radius: 8px !important;
            font-size: 0.85rem !important;
            cursor: pointer !important;
          }
          
          .react-datepicker__header__dropdown--scroll select:focus {
            outline: none !important;
            border-color: var(--datepicker-primary) !important;
            box-shadow: 0 0 0 2px rgba(46, 204, 113, 0.2) !important;
          }
          
          /* Month container */
          .react-datepicker__month-container {
            background-color: var(--datepicker-surface) !important;
            border-radius: 16px !important;
            overflow: hidden !important;
          }
          
          /* Week days header */
          .react-datepicker__day-names {
            background-color: var(--datepicker-surface2) !important;
            padding: 8px 0 4px 0 !important;
          }
          
          /* Disabled days */
          .react-datepicker__day--disabled,
          .react-datepicker__month-text--disabled,
          .react-datepicker__quarter-text--disabled,
          .react-datepicker__year-text--disabled {
            color: var(--datepicker-text-muted) !important;
            opacity: 0.5 !important;
            cursor: not-allowed !important;
          }
          
          /* Outside month days */
          .react-datepicker__day--outside-month {
            color: var(--datepicker-text-muted) !important;
            opacity: 0.6 !important;
          }
          
          /* Week numbers */
          .react-datepicker__week-number {
            color: var(--datepicker-text-muted) !important;
          }
          
          /* Time picker */
          .react-datepicker__time-container {
            border-left: 1px solid var(--datepicker-border) !important;
          }
          
          .react-datepicker__time-container .react-datepicker__time {
            background-color: var(--datepicker-surface) !important;
          }
          
          .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item {
            color: var(--datepicker-text) !important;
          }
          
          .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
            background-color: var(--datepicker-primary-light) !important;
          }
          
          .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
            background-color: var(--datepicker-primary) !important;
            color: white !important;
          }
          
          /* Scrollbar styling for dark mode */
          .dark .react-datepicker__month-dropdown,
          .dark .react-datepicker__year-dropdown {
            scrollbar-width: thin;
            scrollbar-color: var(--datepicker-primary) var(--datepicker-border);
          }
          
          .dark .react-datepicker__month-dropdown::-webkit-scrollbar,
          .dark .react-datepicker__year-dropdown::-webkit-scrollbar {
            width: 6px;
          }
          
          .dark .react-datepicker__month-dropdown::-webkit-scrollbar-track,
          .dark .react-datepicker__year-dropdown::-webkit-scrollbar-track {
            background: var(--datepicker-border);
            border-radius: 3px;
          }
          
          .dark .react-datepicker__month-dropdown::-webkit-scrollbar-thumb,
          .dark .react-datepicker__year-dropdown::-webkit-scrollbar-thumb {
            background: var(--datepicker-primary);
            border-radius: 3px;
          }
        `;
        document.head.appendChild(style);
      }
    }, []);

    return (
      <div className="relative w-full">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          onBlur={handleBlur}
          dateFormat="dd/MM/yyyy"
          placeholderText={type === "dob" ? "dd/mm/yyyy" : type === "special_day" ? "dd/mm/yyyy" : placeholder}
          customInput={<CustomInput />}
          minDate={getMinDate()}
          maxDate={getMaxDate()}
          showYearDropdown
          showMonthDropdown
          dropdownMode="select"
          className="w-full"
          calendarClassName="shadow-soft-lg rounded-lg border border-gray-200 dark:border-gray-700"
          popperClassName="z-50"
          {...props}
        />
      </div>
    );
  }
);

DateInput.displayName = "DateInput";

export default DateInput;