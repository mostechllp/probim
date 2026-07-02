// src/admin/store/slices/attendanceSlice.js

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

// FIXED: Improved extractData function
const extractData = (response) => {
  try {
    console.log("Extracting data from response:", response);
    
    // Check for nested structure: response.data.data.data (for paginated responses)
    if (response?.data?.data?.data && Array.isArray(response.data.data.data)) {
      return response.data.data.data;
    }
    
    // Check for: response.data.data (direct array in data)
    if (response?.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    // Check for: response.data (array)
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    
    // Check if response itself is an array
    if (Array.isArray(response)) {
      return response;
    }
    
    console.warn("No array data found in response, returning empty array");
    return [];
  } catch (error) {
    console.error("Error extracting data:", error);
    return [];
  }
};

// FIXED: Improved extractAttendanceRecords function
const extractAttendanceRecords = (response) => {
  try {
    console.log("Extracting attendance records from response:", response);
    
    let attendanceData = [];
    let meta = {};
    let apiStats = {};
    
    // Handle different response structures
    if (response?.data?.data?.data && Array.isArray(response.data.data.data)) {
      attendanceData = response.data.data.data;
      meta = response.data.data.meta || {};
      apiStats = response.data.data.stats || response.data.data.statistics || {};
    } else if (response?.data?.data && Array.isArray(response.data.data)) {
      attendanceData = response.data.data;
      meta = response.data.meta || {};
      apiStats = response.data.stats || response.data.statistics || {};
    } else if (response?.data && Array.isArray(response.data)) {
      attendanceData = response.data;
      apiStats = response.stats || response.statistics || {};
    } else if (Array.isArray(response)) {
      attendanceData = response;
    } else {
      attendanceData = [];
    }

    console.log("Attendance data extracted:", attendanceData);
    console.log("Meta:", meta);
    console.log("Stats from API:", apiStats);

    // Map the records
    const records = attendanceData.map((record, idx) => {
      const employeeName = record.name || 
                          record.employee_name || 
                          record.employeeName || 
                          record.user?.username || 
                          `Employee ${record.userid || record.employee_id || record.id || idx}`;
      
      const department = record.department || 
                        record.user?.department?.name || 
                        record.user?.department_id || 
                        "-";
      
      const designation = record.designation || 
                         record.user?.designation?.name || 
                         "-";
      
      const company = record.company || 
                     record.user?.company?.name || 
                     "N/A";
      
      const punchIn = record.punch_in && record.punch_in !== "-" ? record.punch_in : "--";
      const punchOut = record.punch_out && record.punch_out !== "-" ? record.punch_out : "--";
      
      // Determine status based on available data
      let status = record.status || record.attendance_status || "Absent";
      
      // If status is 'present' or 'ontime', set to 'Present'
      if (status.toLowerCase() === 'present' || 
          status.toLowerCase() === 'ontime' || 
          status.toLowerCase() === 'on time') {
        status = "Present";
      } else if (status.toLowerCase() === 'absent' || status.toLowerCase() === 'absentee') {
        status = "Absent";
      } else if (status.toLowerCase() === 'late') {
        status = "Late";
      }
      
      // If no status but has punch_in, consider present
      if ((!status || status === "Absent") && 
          punchIn && punchIn !== "--" && punchIn !== "-") {
        // Check if late
        if (record.lateBy && record.lateBy > 0) {
          status = "Late";
        } else {
          status = "Present";
        }
      }
      
      const workedHours = record.worked_hours !== undefined ? record.worked_hours : 0;
      const standardHours = record.standard_hours || 9;
      const overtime = record.overtime || "-";
      
      let date = record.date || record.log_date || record.attendance_date || "-";
      if (date && date.includes('-') && date !== "-") {
        const parts = date.split('-');
        if (parts.length === 3) {
          date = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }

      return {
        id: record.employee_id || record.userid || record.id || idx,
        employee_id: record.employee_id || record.userid || record.id || idx,
        user_id: record.userid || record.user_id || record.user?.id || null,
        employeeName: employeeName,
        name: employeeName,
        employee_name: employeeName,
        department: department,
        designation: designation,
        company: company,
        date: date,
        log_date: date,
        attendance_date: date,
        punch_in: punchIn,
        punch_out: punchOut,
        punchIn: punchIn,
        punchOut: punchOut,
        worked_hours: workedHours,
        working_hours: workedHours,
        workingHours: workedHours,
        standard_hours: standardHours,
        overtime: overtime,
        status: status,
        isLate: status === "Late" || status === "late",
        hasPunchOut: punchOut !== "--",
        raw: record,
      };
    });

    // Calculate stats
    const stats = {
      total_active_employees: apiStats.total_active_employees || 
                              apiStats.totalActiveEmployees || 
                              records.length,
      totalActiveEmployees: apiStats.totalActiveEmployees || 
                           apiStats.total_active_employees || 
                           records.length,
      present_today: apiStats.present_today || 
                     apiStats.presentToday || 
                     records.filter((r) => r.status === "Present").length,
      presentToday: apiStats.presentToday || 
                   apiStats.present_today || 
                   records.filter((r) => r.status === "Present").length,
      absent_today: apiStats.absent_today || 
                    apiStats.absentToday || 
                    records.filter((r) => r.status === "Absent").length,
      absentToday: apiStats.absentToday || 
                  apiStats.absent_today || 
                  records.filter((r) => r.status === "Absent").length,
      punched_late: apiStats.punched_late || 
                   apiStats.punchedLate || 
                   records.filter((r) => r.isLate).length,
      punchedLate: apiStats.punchedLate || 
                  apiStats.punched_late || 
                  records.filter((r) => r.isLate).length,
      punched_out_today: apiStats.punched_out_today || 
                        apiStats.punchedOutToday || 
                        records.filter((r) => r.hasPunchOut).length,
      punchedOutToday: apiStats.punchedOutToday || 
                      apiStats.punched_out_today || 
                      records.filter((r) => r.hasPunchOut).length,
      punched_in_on_time: apiStats.punched_in_on_time || 
                         apiStats.punchedInOnTime || 
                         records.filter((r) => r.status === "Present" && !r.isLate).length,
      punchedInOnTime: apiStats.punchedInOnTime || 
                      apiStats.punched_in_on_time || 
                      records.filter((r) => r.status === "Present" && !r.isLate).length,
    };

    const total = meta.total || records.length;
    const currentPage = meta.current_page || 1;
    const lastPage = meta.last_page || 1;
    const perPage = meta.per_page || 1000;

    console.log("Calculated stats:", stats);

    return {
      records,
      total,
      currentPage,
      lastPage,
      perPage,
      stats,
    };
  } catch (error) {
    console.error("Error extracting attendance records:", error);
    return { records: [], total: 0, stats: {} };
  }
};

// Async thunks
export const fetchAttendanceRecords = createAsyncThunk(
  "attendance/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/admin/attendance`, { params });
      console.log("Fetch attendance response:", response.data);
      const result = extractAttendanceRecords(response);
      console.log("Extracted attendance result:", result);
      return result;
    } catch (error) {
      console.error("Fetch attendance error:", error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

export const uploadAttendanceFile = createAsyncThunk(
  "attendance/upload",
  async ({ file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

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

      const processingStatus = response.data?.data?.status || "pending";

      let normalizedStatus;
      if (["completed", "done", "processed"].includes(processingStatus)) {
        normalizedStatus = "completed";
      } else if (processingStatus === "failed") {
        normalizedStatus = "failed";
      } else {
        normalizedStatus = "processing";
      }

      return { id, status: normalizedStatus };
    } catch (error) {
      return rejectWithValue(handleApiError(error));
    }
  }
);

// These thunks now use the fixed extractData function
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
  try { 
    const response = await apiClient.get(`/admin/attendance/late-comers`);
    console.log("Late comers response:", response.data);
    return extractData(response);
  } 
  catch (error) {
    console.error("Error fetching late comers:", error);
    return [];
  }
});

export const fetchAbsentees = createAsyncThunk("attendance/fetchAbsentees", async () => {
  try { 
    const response = await apiClient.get(`/admin/attendance/absentees`);
    console.log("Absentees response:", response.data);
    return extractData(response);
  } 
  catch (error) {
    console.error("Error fetching absentees:", error);
    return [];
  }
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
    uploadStatus: null,
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
        state.uploadStatus = action.payload.status;
        state.uploadStatusId = action.payload.id;
        state.uploads.push({
          id: action.payload.id,
          status: action.payload.status,
          fileName: action.payload.fileName,
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
      .addCase(fetchLateComers.fulfilled, (state, action) => { 
        console.log("Late comers data set:", action.payload);
        state.lateComers = action.payload; 
      })
      .addCase(fetchLateComers.rejected, (state) => { state.lateComers = []; })
      .addCase(fetchAbsentees.fulfilled, (state, action) => { 
        console.log("Absentees data set:", action.payload);
        state.absentees = action.payload; 
      })
      .addCase(fetchAbsentees.rejected, (state) => { state.absentees = []; });
  },
});

export const { clearUploadStatus, clearErrors, updateUploadStatus, removeUpload, clearCompletedUploads } =
  attendanceSlice.actions;
export default attendanceSlice.reducer;