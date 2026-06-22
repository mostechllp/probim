import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

const handleApiError = (error) => {
  if (error.response) {
    return error.response.data?.message || `Server error: ${error.response.status}`;
  }
  if (error.request) return "Network error: Unable to connect to server";
  return error.message || "An unexpected error occurred";
};

const isValidPunch = (value) => value && value !== "-" && value.trim() !== "";

const extractAttendanceRecords = (response) => {
  try {
    const attendance = response.data?.data?.attendance;

    if (attendance?.data && Array.isArray(attendance.data)) {
      const records = attendance.data.map((record, idx) => {
        const hasPunchOut = isValidPunch(record.punch_out);
        const punchIn = isValidPunch(record.punch_in) ? record.punch_in : "-";

        // Derive present/absent from punch_in
        const isPresent = isValidPunch(record.punch_in);

        // ✅ FIX: Get employee name from the correct nested path
        const employeeName = record.user?.employee
          ? `${record.user.employee.first_name || ""} ${record.user.employee.last_name || ""}`.trim()
          : record.user?.username || `Employee ${record.userid}`;

        // ✅ FIX: Get department from the correct path
        const department = record.user?.department?.name || "-";

        return {
          id: record.userid || idx,
          employee_id: record.userid,
          employeeName: employeeName || `Employee ${record.userid}`,
          company: record.company?.company_name || "N/A",
          company_id: record.company_id || null,
          department: department,
          date: record.log_date || "-",
          punchIn,
          punchOut: hasPunchOut ? record.punch_out : null,
          punch_in_raw: record.punch_in,
          punch_out_raw: record.punch_out,
          status: isPresent ? "Present" : "Absent",
          isLate: false,
          hasPunchOut,
          // Keep raw data for debugging
          raw: record,
        };
      });

      const meta = {
        total: attendance.total,
        current_page: attendance.current_page,
        last_page: attendance.last_page,
        per_page: attendance.per_page,
      };

      // ✅ FIX: Use stats from API response
      const apiStats = response.data?.data?.stats || {};
      
      const stats = {
        totalActiveEmployees: apiStats.total_active_employees || meta.total || records.length,
        presentToday: apiStats.present_today || records.filter((r) => r.status === "Present").length,
        absentToday: apiStats.absent_today || records.filter((r) => r.status === "Absent").length,
        punchedInOnTime: apiStats.punched_in_on_time || 0,
        punchedLate: apiStats.punched_late || 0,
        punchedOutToday: apiStats.punched_out_today || 0,
      };

      return {
        records,
        total: meta.total || records.length,
        currentPage: meta.current_page || 1,
        lastPage: meta.last_page || 1,
        perPage: meta.per_page || 15,
        stats,
      };
    }

    return { records: [], total: 0, stats: {} };
  } catch (error) {
    console.error("Error extracting attendance records:", error);
    return { records: [], total: 0, stats: {} };
  }
};

const extractData = (response) => {
  if (response.data?.data?.data && Array.isArray(response.data.data.data)) return response.data.data.data;
  if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
  if (Array.isArray(response.data)) return response.data;
  return [];
};

export const fetchAttendanceRecords = createAsyncThunk(
  "attendance/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/admin/attendance`, { params });
      console.log("Result: ", response)
      return extractAttendanceRecords(response);
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const uploadAttendanceFile = createAsyncThunk(
  "attendance/upload",
  async ({ file }, { rejectWithValue }) => {  // ← remove company_id
    try {
      const formData = new FormData();
      // ❌ Remove this line: formData.append("company_id", company_id);
      formData.append("file", file);  // ← only file

      const response = await apiClient.post(`/admin/attendance/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Upload response full:", JSON.stringify(response.data, null, 2));

      const uploadId = response.data?.data?.id || null;
      const rawStatus = response.data?.data?.status || "pending";
      const processingStatus = ["completed", "done", "success", "processed"].includes(rawStatus)
        ? "completed"
        : "processing";

      return {
        id: uploadId,
        status: processingStatus,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Upload error:", error.response?.data);
      if (error.response?.data?.errors) {
        const msgs = Object.values(error.response.data.errors).flat();
        return rejectWithValue(msgs.join(", "));
      }
      return rejectWithValue(error.response?.data?.message || "Failed to upload attendance file");
    }
  }
);

export const fetchUploadStatus = createAsyncThunk(
  "attendance/fetchUploadStatus",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/admin/attendance/upload-status/${id}`);
      console.log("Upload status response:", JSON.stringify(response.data, null, 2));

      // API returns: { data: { id, status: "pending"|"completed"|"failed", progress, ... }, message, status: "success" }
      // NOTE: response.data.status is the HTTP wrapper ("success") — NOT the processing status
      // The actual processing status is inside response.data.data.status
      const processingStatus = response.data?.data?.status || "pending";

      // Normalize to our internal values
      let normalizedStatus;
      if (["completed", "done", "processed"].includes(processingStatus)) {
        normalizedStatus = "completed";
      } else if (processingStatus === "failed") {
        normalizedStatus = "failed";
      } else {
        normalizedStatus = "processing"; // "pending" and anything else = still going
      }

      return { id, status: normalizedStatus };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchPunchInToday = createAsyncThunk("attendance/fetchPunchInToday", async () => {
  try { return extractData(await apiClient.get(`/admin/attendance/punch-in-today`)); }
  catch { return []; }
});

export const fetchPunchInYesterday = createAsyncThunk("attendance/fetchPunchInYesterday", async () => {
  try { return extractData(await apiClient.get(`/admin/attendance/punch-in-yesterday`)); }
  catch { return []; }
});

export const fetchPunchOutToday = createAsyncThunk("attendance/fetchPunchOutToday", async () => {
  try { return extractData(await apiClient.get(`/admin/attendance/punch-out-today`)); }
  catch { return []; }
});

export const fetchLateComers = createAsyncThunk("attendance/fetchLateComers", async () => {
  try { return extractData(await apiClient.get(`/admin/attendance/late-comers`)); }
  catch { return []; }
});

export const fetchAbsentees = createAsyncThunk("attendance/fetchAbsentees", async () => {
  try { return extractData(await apiClient.get(`/admin/attendance/absentees`)); }
  catch { return []; }
});

const attendanceSlice = createSlice({
  name: "attendance",
  initialState: {
    records: [],
    stats: {
      totalActiveEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      punchedInOnTime: 0,
      punchedLate: 0,
      punchedOutToday: 0,
    },
    uploadStatus: null,       // null | "processing" | "completed" | "failed"
    uploadStatusId: null,
    uploads: [],
    punchInToday: [],
    punchInYesterday: [],
    punchOutToday: [],
    lateComers: [],
    absentees: [],
    loading: false,
    uploadLoading: false,
    error: null,
    totalCount: 0,
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
  },
  reducers: {
    clearUploadStatus: (state) => {
      state.uploadStatus = null;
      state.uploadStatusId = null;
    },
    clearErrors: (state) => { state.error = null; },
    updateUploadStatus: (state, action) => {
      const { id, status } = action.payload;
      const upload = state.uploads.find((u) => u.id === id);
      if (upload) { upload.status = status; upload.updatedAt = new Date().toISOString(); }
      if (state.uploadStatusId === id) state.uploadStatus = status;
    },
    removeUpload: (state, action) => {
      state.uploads = state.uploads.filter((u) => u.id !== action.payload);
      if (state.uploadStatusId === action.payload) {
        state.uploadStatus = null;
        state.uploadStatusId = null;
      }
    },
    clearCompletedUploads: (state) => {
      state.uploads = state.uploads.filter((u) => u.status === "processing");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceRecords.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAttendanceRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload.records;
        state.totalCount = action.payload.total;
        state.currentPage = action.payload.currentPage || 1;
        state.lastPage = action.payload.lastPage || 1;
        state.perPage = action.payload.perPage || 15;
        if (action.payload.stats) state.stats = action.payload.stats;
      })
      .addCase(fetchAttendanceRecords.rejected, (state, action) => {
        state.loading = false; state.error = action.payload; state.records = []; state.totalCount = 0;
      })

      .addCase(uploadAttendanceFile.pending, (state) => {
        state.uploadLoading = true; state.error = null; state.uploadStatus = null;
      })
      .addCase(uploadAttendanceFile.fulfilled, (state, action) => {
        state.uploadLoading = false;
        state.uploadStatus = action.payload.status; // "processing" or "completed"
        state.uploadStatusId = action.payload.id;
        state.uploads.push({
          id: action.payload.id,
          status: action.payload.status,
          fileName: action.payload.fileName,
          company_id: action.payload.company_id,
          uploadedAt: action.payload.uploadedAt,
        });
      })
      .addCase(uploadAttendanceFile.rejected, (state, action) => {
        state.uploadLoading = false; state.error = action.payload; state.uploadStatus = "failed";
      })

      .addCase(fetchUploadStatus.fulfilled, (state, action) => {
        const { id, status } = action.payload;
        const upload = state.uploads.find((u) => u.id === id);
        if (upload) upload.status = status;
        if (state.uploadStatusId === id) state.uploadStatus = status;
      })
      .addCase(fetchUploadStatus.rejected, (state, action) => { state.error = action.payload; })

      .addCase(fetchPunchInToday.fulfilled, (state, action) => { state.punchInToday = action.payload; })
      .addCase(fetchPunchInToday.rejected, (state) => { state.punchInToday = []; })
      .addCase(fetchPunchInYesterday.fulfilled, (state, action) => { state.punchInYesterday = action.payload; })
      .addCase(fetchPunchInYesterday.rejected, (state) => { state.punchInYesterday = []; })
      .addCase(fetchPunchOutToday.fulfilled, (state, action) => { state.punchOutToday = action.payload; })
      .addCase(fetchPunchOutToday.rejected, (state) => { state.punchOutToday = []; })
      .addCase(fetchLateComers.fulfilled, (state, action) => { state.lateComers = action.payload; })
      .addCase(fetchLateComers.rejected, (state) => { state.lateComers = []; })
      .addCase(fetchAbsentees.fulfilled, (state, action) => { state.absentees = action.payload; })
      .addCase(fetchAbsentees.rejected, (state) => { state.absentees = []; });
  },
});

export const { clearUploadStatus, clearErrors, updateUploadStatus, removeUpload, clearCompletedUploads } =
  attendanceSlice.actions;
export default attendanceSlice.reducer;