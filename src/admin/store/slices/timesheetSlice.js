// src/admin/store/slices/timesheetSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

// ────────────────────────────────────────────────────────────
// Async Thunks
// ────────────────────────────────────────────────────────────

export const fetchTimesheets = createAsyncThunk(
  "timesheets/fetchTimesheets",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/admin/timesheets", { params });
      // Assuming standard API response format: { data: { records: [], stats: {} } } or { data: [] }
      const payload = res.data?.data || res.data || {};
      return {
        records: payload.records || payload.data || payload || [],
        stats: payload.stats || {},
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch timesheets"
      );
    }
  }
);

export const approveTimesheet = createAsyncThunk(
  "timesheets/approve",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/admin/timesheets/${id}/approve`);
      return res.data?.data || res.data || { id, status: "Approved" };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to approve timesheet"
      );
    }
  }
);

export const rejectTimesheet = createAsyncThunk(
  "timesheets/reject",
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/admin/timesheets/${id}/reject`, { reason });
      return res.data?.data || res.data || { id, status: "Rejected" };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to reject timesheet"
      );
    }
  }
);

export const exportTimesheets = createAsyncThunk(
  "timesheets/export",
  async ({ format, filters }, { rejectWithValue }) => {
    try {
      // Using GET for export as per the API docs
      const res = await apiClient.get("/admin/timesheets/export", {
        params: { format: format === "excel" ? "xlsx" : format, ...filters },
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `timesheets-${new Date().toISOString().slice(0, 10)}.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to export timesheets"
      );
    }
  }
);

// ────────────────────────────────────────────────────────────
// Slice
// ────────────────────────────────────────────────────────────

const initialState = {
  records: [],
  stats: { totalHours: 0, pendingApprovals: 0, approvedHours: 0 },
  loading: false,
  actionLoading: false,
  exportLoading: false,
  error: null,
};

const timesheetSlice = createSlice({
  name: "timesheets",
  initialState,
  reducers: {
    clearTimesheetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchTimesheets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimesheets.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload.records;
        state.stats = action.payload.stats;
      })
      .addCase(fetchTimesheets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Approve
      .addCase(approveTimesheet.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(approveTimesheet.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.records.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.records[idx] = { ...state.records[idx], status: "Approved" };
      })
      .addCase(approveTimesheet.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Reject
      .addCase(rejectTimesheet.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(rejectTimesheet.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.records.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.records[idx] = { ...state.records[idx], status: "Rejected" };
      })
      .addCase(rejectTimesheet.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Export
      .addCase(exportTimesheets.pending, (state) => {
        state.exportLoading = true;
      })
      .addCase(exportTimesheets.fulfilled, (state) => {
        state.exportLoading = false;
      })
      .addCase(exportTimesheets.rejected, (state, action) => {
        state.exportLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearTimesheetError } = timesheetSlice.actions;
export default timesheetSlice.reducer;