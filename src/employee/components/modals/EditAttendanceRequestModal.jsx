import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../common/Toast";
import BaseModal from "./BaseModal";
import { updateAttendanceRequest, fetchAttendanceRequestDetails } from "../../store/slices/attendanceTypeSlice";
import DateInput from "../../../admin/components/common/DateInput";
import { TimeInput } from "../common/TimeInput";

const EditAttendanceRequestModal = ({ isOpen, onClose, request }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);

  const [fetchingDetails, setFetchingDetails] = useState(false);

  useEffect(() => {
    if (request && isOpen) {
      setFetchingDetails(true);
      
      const fetchDetails = async () => {
        try {
          const details = await dispatch(fetchAttendanceRequestDetails(request.id)).unwrap();
          if (details) {
            let formattedTime = details.request_time || details.time || request.request_time || request.time || "";
            if (formattedTime && formattedTime.includes(':')) {
              const parts = formattedTime.split(':');
              if (parts.length >= 2) {
                formattedTime = `${parts[0]}:${parts[1]}`;
              }
            }
            
            setFormData({
              date: details.request_date || details.date || request.request_date || request.date || "",
              time: formattedTime,
              reason: details.reason || request.reason || "",
            });
          }
        } catch (error) {
          console.error("Failed to fetch request details for editing:", error);
          // Fallback to whatever is available
          setFormData({
            date: request.request_date || request.date || "",
            time: request.request_time || request.time || "",
            reason: request.reason || "",
          });
        } finally {
          setFetchingDetails(false);
        }
      };
      
      fetchDetails();
    }
  }, [request, isOpen, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.date || !formData.time || !formData.reason) {
      showToast("Please fill all required fields", "error");
      return;
    }

    setLoading(true);
    try {
      await dispatch(updateAttendanceRequest({
        id: request.id,
        payload: {
          type: request.type,
          request_date: formData.date,
          request_time: formData.time,
          reason: formData.reason,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
      })).unwrap();

      showToast("Attendance request updated successfully", "success");
      onClose();
    } catch (error) {
      showToast(error || "Failed to update request", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!request) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Attendance Request"
      loading={loading}
      onSubmit={handleSubmit}
    >
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">
          Date <span className="text-red-500">*</span>
        </label>
        <DateInput
          value={formData.date}
          onChange={(date) => setFormData({ ...formData, date })}
          placeholder="dd/mm/yyyy"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">
          Time <span className="text-red-500">*</span>
        </label>
        <TimeInput
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-1">
          Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          rows="4"
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-[var(--surface)] text-[var(--text)]"
          placeholder="Provide a valid reason..."
          required
        />
      </div>
    </BaseModal>
  );
};

export default EditAttendanceRequestModal;
