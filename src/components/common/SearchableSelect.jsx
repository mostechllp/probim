import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown, FiPlus, FiSearch, FiX } from "react-icons/fi";

const SearchableSelect = ({
  value = "",
  onChange,
  options = [],
  label = "",
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  loading = false,
  error = false,
  disabled = false,
  required = false,
  emptyMessage = "No results found",
  onAddNew = null,
  addNewLabel = "Add new",
  clearable = true,
  name,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options - KEEPING isHeading property
  const normalizedOptions = useMemo(
    () =>
      (Array.isArray(options) ? options : [])
        .filter((o) => o && o.value !== undefined && o.value !== null)
        .map((o) => ({
          value: String(o.value),
          label: String(o.label ?? o.value),
          isHeading: o.isHeading || false, // <-- Preserve this!
        })),
    [options],
  );

  const selected = useMemo(
    () => normalizedOptions.find((o) => o.value === String(value ?? "")),
    [normalizedOptions, value],
  );

  // Filter by query - KEEPING headings visible if they have matching children
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedOptions;

    // If searching, only show matching items and their preceding heading
    const result = [];
    let currentHeading = null;

    for (let i = 0; i < normalizedOptions.length; i++) {
        const opt = normalizedOptions[i];
        if (opt.isHeading) {
            currentHeading = opt;
        } else if (opt.label.toLowerCase().includes(q)) {
            if (currentHeading && !result.includes(currentHeading)) {
                result.push(currentHeading);
            }
            result.push(opt);
        }
    }
    return result;
  }, [normalizedOptions, query]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Focus search box when opened
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
      // Set highlighted to the first non-heading item
      const firstSelectableIndex = filtered.findIndex(o => !o.isHeading);
      setHighlighted(firstSelectableIndex >= 0 ? firstSelectableIndex : 0);
    }
  }, [open]);

  // Keep highlighted item in view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[highlighted];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, open]);

  const commit = (opt) => {
    if (!opt || opt.isHeading) return;
    onChange?.(opt.value);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      let next = highlighted + 1;
      while (next < filtered.length && filtered[next].isHeading) next++;
      if (next < filtered.length) setHighlighted(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      let prev = highlighted - 1;
      while (prev >= 0 && filtered[prev].isHeading) prev--;
      if (prev >= 0) setHighlighted(prev);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[highlighted];
      if (opt && !opt.isHeading) commit(opt);
      else if (onAddNew && filtered.length === 0) {
        setOpen(false);
        onAddNew();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    }
  };

  const showAddButton = onAddNew && filtered.length === 0 && !loading;

  return (
    <div className="space-y-1.5" ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Trigger */}
        <button
          type="button"
          name={name}
          disabled={disabled || loading}
          onClick={() => !disabled && !loading && setOpen((o) => !o)}
          onKeyDown={handleKeyDown}
          className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-left transition-all duration-200 outline-none ${
            disabled || loading
              ? "opacity-60 cursor-not-allowed"
              : "cursor-pointer"
          } ${
            error
              ? "border-red-500 focus:ring-4 focus:ring-red-500/10"
              : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
          }`}
        >
          <span
            className={`truncate ${
              selected
                ? "text-gray-900 dark:text-white"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {loading
              ? "Loading..."
              : selected
                ? selected.label
                : placeholder}
          </span>

          <span className="flex items-center gap-1 flex-shrink-0">
            {clearable && selected && !disabled && !loading && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.("");
                  setQuery("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onChange?.("");
                  }
                }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                title="Clear"
              >
                <FiX size={12} />
              </span>
            )}
            <FiChevronDown
              size={16}
              className={`text-gray-400 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden animate-fadeIn">
            {/* Search box */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
              <FiSearch size={14} className="text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlighted(0); // Reset highlight on search
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  title="Clear search"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            {/* Options list */}
            <div
              ref={listRef}
              className="max-h-60 overflow-y-auto py-1"
              role="listbox"
            >
              {loading ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {emptyMessage}
                  </p>
                  {showAddButton && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                        onAddNew();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-full transition-colors"
                    >
                      <FiPlus size={12} strokeWidth={3} />
                      {addNewLabel}
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((opt, idx) => {
                  // Render Heading
                  if (opt.isHeading) {
                    return (
                      <div
                        key={opt.value}
                        className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/80 sticky top-0"
                      >
                        {opt.label}
                      </div>
                    );
                  }

                  // Render Selectable Option
                  const isSelected = opt.value === String(value ?? "");
                  const isHighlighted = idx === highlighted;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlighted(idx)}
                      onClick={() => commit(opt)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-semibold"
                          : isHighlighted
                            ? "bg-gray-100 dark:bg-gray-700/60 text-gray-900 dark:text-white"
                            : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <span className="text-green-500 flex-shrink-0">
                          <i className="fas fa-check text-xs"></i>
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer: add button when there are results but also want to add */}
            {onAddNew && filtered.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-700 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    onAddNew();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                >
                  <FiPlus size={12} strokeWidth={3} />
                  {addNewLabel}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && typeof error === "string" && (
        <p className="text-xs font-medium text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default SearchableSelect;