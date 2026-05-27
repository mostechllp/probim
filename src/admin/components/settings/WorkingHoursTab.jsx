import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "../../../components/common/Toast";
import { fetchWorkingHours, saveWorkingHours, clearUpdateSuccess } from "../../store/slices/settingsSlice";

const WorkingHoursTab = () => {
  const dispatch = useDispatch();
  const { workingHours: savedWorkingHours, loading, updateSuccess, error } = useSelector(
    (state) => state.settings
  );
  
  const [localWorkingHours, setLocalWorkingHours] = useState(null);
  const [saving, setSaving] = useState(false);

  const days = [
    { id: "monday", label: "Monday" },
    { id: "tuesday", label: "Tuesday" },
    { id: "wednesday", label: "Wednesday" },
    { id: "thursday", label: "Thursday" },
    { id: "friday", label: "Friday" },
    { id: "saturday", label: "Saturday" },
    { id: "sunday", label: "Sunday" },
  ];

  // Fetch working hours on mount
  useEffect(() => {
    dispatch(fetchWorkingHours());
  }, [dispatch]);

  // Update local state when Redux working hours change
  useEffect(() => {
    if (savedWorkingHours) {
      setLocalWorkingHours(savedWorkingHours);
    }
  }, [savedWorkingHours]);

  // Handle save success
  useEffect(() => {
    if (updateSuccess) {
      showToast("Working hours saved successfully!", "success");
      dispatch(clearUpdateSuccess());
      setSaving(false);
    }
  }, [updateSuccess, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      showToast(error, "error");
      setSaving(false);
    }
  }, [error]);

  const handleDayToggle = (dayId) => {
    setLocalWorkingHours((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        enabled: !prev[dayId].enabled,
      },
    }));
  };

  const handleTimeChange = (dayId, field, value) => {
    setLocalWorkingHours((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!localWorkingHours) return;
    
    setSaving(true);
    await dispatch(saveWorkingHours(localWorkingHours));
  };

  // Show loading state
  if (loading && !localWorkingHours) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="h-10 w-10 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Show fallback if no data
  if (!localWorkingHours) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
        <div className="text-center py-10 text-gray-500">No working hours data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <i className="fas fa-clock text-green-500"></i>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Working Hours Settings
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure working hours for each day of the week
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {days.map((day) => {
          const dayData = localWorkingHours[day.id];
          
          if (!dayData) return null;

          return (
            <div
              key={day.id}
              className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-xl p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                {/* Day */}
                <div className="font-semibold text-gray-700 dark:text-gray-300">
                  {day.label}
                </div>

                {/* Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleDayToggle(day.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      dayData.enabled
                        ? "bg-green-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        dayData.enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>

                  <span
                    className={`text-sm font-medium ${
                      dayData.enabled ? "text-green-500" : "text-gray-400"
                    }`}
                  >
                    {dayData.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                    Start Time
                  </label>

                  <input
                    type="time"
                    value={dayData.start || "09:00"}
                    onChange={(e) =>
                      handleTimeChange(day.id, "start", e.target.value)
                    }
                    disabled={!dayData.enabled}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                    End Time
                  </label>

                  <input
                    type="time"
                    value={dayData.end || "18:00"}
                    onChange={(e) =>
                      handleTimeChange(day.id, "end", e.target.value)
                    }
                    disabled={!dayData.enabled}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold transition-all disabled:opacity-70 flex items-center gap-2"
        >
          {saving ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save"></i>
              Save Working Hours
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default WorkingHoursTab;