// components/settings/PublicHolidaysTab.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCalendar,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { showToast } from "../../components/common/Toast";
import DateInput from "../../components/common/DateInput";
import {
  fetchPublicHolidays,
  addPublicHoliday,
  updatePublicHoliday,
  deletePublicHoliday,
} from "../../store/slices/publicHolidaySlice";
import { createPortal } from "react-dom";

// Calendar Component
const Calendar = ({
  selectedDate,
  onDateSelect,
  holidays,
  onAddClick,
  onEditHoliday,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentMonth);

  // Get ALL holidays for a specific date (returns array)
  const getHolidaysForDate = (day) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateStr = `${year}-${month}-${dayStr}`;
    
    return holidays.filter((h) => h.date === dateStr);
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const handleDateClick = (day) => {
    const dateObj = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    onDateSelect(dateObj);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FiChevronLeft />
        </button>
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            onClick={() => {
              const today = new Date();
              setCurrentMonth(
                new Date(today.getFullYear(), today.getMonth(), 1),
              );
              onDateSelect(today);
            }}
            className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Today
          </button>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FiChevronRight />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="aspect-square"></div>
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const holidaysForDate = getHolidaysForDate(day);
          const isSelected =
            selectedDate &&
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentMonth.getMonth() &&
            selectedDate.getFullYear() === currentMonth.getFullYear();
          const isTodayDate = isToday(day);

          return (
            <div
              key={day}
              className={`aspect-square relative cursor-pointer rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                isSelected
                  ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20"
                  : ""
              } ${isTodayDate ? "border-2 border-green-500" : ""}`}
              onClick={() => handleDateClick(day)}
            >
              <div className="flex items-center justify-center h-full">
                <span
                  className={`text-sm ${isTodayDate ? "font-bold text-green-500" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {day}
                </span>
              </div>
              {/* Show multiple dots if there are multiple holidays */}
              {holidaysForDate.length > 0 && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                  {holidaysForDate.map((_, index) => (
                    <div
                      key={index}
                      className="w-1.5 h-1.5 bg-red-500 rounded-full"
                    ></div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Holiday Details for Selected Date */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {selectedDate ? (
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              {(() => {
                const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
                const holidaysForDate = holidays.filter((h) => h.date === dateStr);
                
                if (holidaysForDate.length > 0) {
                  return (
                    <div className="mt-1 space-y-1">
                      {holidaysForDate.map((holiday, index) => (
                        <div key={holiday.id} className="flex items-center gap-2">
                          <span className="text-sm text-red-500 font-medium">
                            🎉 {holiday.name}
                          </span>
                          <button
                            onClick={() => onEditHoliday(holiday)}
                            className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <div className="text-xs text-gray-400 mt-1">
                      No holiday on this date
                    </div>
                  );
                }
              })()}
            </div>
            <button
              onClick={() => {
                // Pass the selected date to prefilled
                onAddClick(selectedDate, true);
              }}
              className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-1 flex-shrink-0 ml-2"
            >
              <FiPlus size={14} />
              Add Holiday
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-400 text-center">
            Select a date to view or add holidays
          </div>
        )}
      </div>
    </div>
  );
};

// Holiday Modal Component - Updated to accept prefilled date
const HolidayModal = ({ isOpen, onClose, onSave, holiday, loading, prefilledDate }) => {
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    description: "",
  });

  useEffect(() => {
    if (holiday) {
      setFormData({
        name: holiday.name || "",
        date: holiday.date || "",
        description: holiday.description || "",
      });
    } else if (prefilledDate) {
      // Prefill the date when adding a new holiday from selected date
      const year = prefilledDate.getFullYear();
      const month = String(prefilledDate.getMonth() + 1).padStart(2, "0");
      const day = String(prefilledDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      setFormData({
        name: "",
        date: dateStr,
        description: "",
      });
    } else {
      // No prefilled date - user selects from date picker
      setFormData({
        name: "",
        date: "",
        description: "",
      });
    }
  }, [holiday, prefilledDate, isOpen]);

  const handleDateChange = (dateValue) => {
    setFormData({ ...formData, date: dateValue });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.date) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl animate-slide-up mx-4">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            {holiday ? "Edit Holiday" : "Add New Holiday"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Holiday Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., New Year's Day"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <DateInput
              value={formData.date}
              onChange={handleDateChange}
              type="general"
              placeholder="Select date"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Add any additional details about this holiday..."
              rows="3"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiCheck size={16} />
                  {holiday ? "Update Holiday" : "Add Holiday"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// Delete Confirmation Modal - Keep as is
const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  holidayName,
  loading,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 text-2xl">
              <FiAlertCircle />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Delete Holiday
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete this holiday?
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
            "<span className="font-semibold">{holidayName}</span>" will be
            permanently removed.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <FiTrash2 size={16} />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Main PublicHolidaysTab Component
const PublicHolidaysTab = () => {
  const dispatch = useDispatch();
  const { holidays, loading } = useSelector(
    (state) => state.publicHolidays || { holidays: [], loading: false },
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [prefilledDate, setPrefilledDate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingHoliday, setDeletingHoliday] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchPublicHolidays());
  }, [dispatch]);

  const handleAddClick = (date, shouldPrefill = false) => {
    setEditingHoliday(null);
    // Only prefill if shouldPrefill is true and a date is provided
    setPrefilledDate(shouldPrefill && date ? date : null);
    setShowModal(true);
  };

  const handleEditHoliday = (holiday) => {
    setEditingHoliday(holiday);
    setPrefilledDate(null);
    setShowModal(true);
  };

  const handleSaveHoliday = async (data) => {
    setSaving(true);
    try {
      if (editingHoliday) {
        await dispatch(
          updatePublicHoliday({ id: editingHoliday.id, data }),
        ).unwrap();
        showToast("Holiday updated successfully!", "success");
      } else {
        await dispatch(addPublicHoliday(data)).unwrap();
        showToast("Holiday added successfully!", "success");
      }
      setShowModal(false);
      setEditingHoliday(null);
      setPrefilledDate(null);
      dispatch(fetchPublicHolidays());
    } catch (error) {
      showToast(error || "Failed to save holiday", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (holiday) => {
    setDeletingHoliday(holiday);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingHoliday) return;
    setDeleting(true);
    try {
      await dispatch(deletePublicHoliday(deletingHoliday.id)).unwrap();
      showToast("Holiday deleted successfully!", "success");
      setShowDeleteModal(false);
      setDeletingHoliday(null);
      dispatch(fetchPublicHolidays());
    } catch (error) {
      showToast(error || "Failed to delete holiday", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Get holidays for the current month
  const getHolidaysForMonth = () => {
    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();
    return holidays.filter((h) => {
      if (!h.date) return false;
      const date = new Date(h.date);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });
  };

  const monthHolidays = getHolidaysForMonth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <FiCalendar className="inline mr-2 text-green-500" />
            Public Holidays
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage public holidays for the organization
          </p>
        </div>
        <button
          onClick={() => handleAddClick(null, false)} // No date prefilled
          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
        >
          <FiPlus size={16} />
          Add Holiday
        </button>
      </div>

      {/* Calendar and Holidays List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            holidays={holidays}
            onAddClick={handleAddClick}
            onEditHoliday={handleEditHoliday}
          />
        </div>

        {/* Holidays List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center justify-between">
            <span>
              <FiCalendar className="inline mr-2 text-green-500" />
              Holidays in{" "}
              {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="text-xs text-gray-400">
              {monthHolidays.length} holidays
            </span>
          </h4>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : monthHolidays.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FiCalendar className="text-4xl mx-auto mb-2 opacity-50" />
              <p className="text-sm">No holidays this month</p>
              <button
                onClick={() => handleAddClick(selectedDate, true)}
                className="mt-2 text-sm text-green-500 hover:text-green-600 font-medium"
              >
                Add a holiday
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {monthHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">🎉</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {holiday.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(holiday.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    {holiday.description && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">
                        {holiday.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEditHoliday(holiday)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(holiday)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Holiday Modal */}
      <HolidayModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingHoliday(null);
          setPrefilledDate(null);
        }}
        onSave={handleSaveHoliday}
        holiday={editingHoliday}
        loading={saving}
        prefilledDate={prefilledDate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingHoliday(null);
        }}
        onConfirm={handleConfirmDelete}
        holidayName={deletingHoliday?.name}
        loading={deleting}
      />
    </div>
  );
};

export default PublicHolidaysTab;