// src/admin/store/slices/timesheetSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

// ────────────────────────────────────────────────────────────
// Async Thunks
// ────────────────────────────────────────────────────────────

export const fetchTimesheets = createAsyncThunk(
  "timesheets/fetchTimesheets",
  async (params, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/admin/timesheets", { params });
      return res.data?.data || res.data || {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch timesheets"
      );
    }
  }
);

export const updateTimesheetStatus = createAsyncThunk(
  "timesheets/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await apiClient.patch(`/admin/timesheets/${id}/status`, { status });
      return res.data?.data || res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to update status"
      );
    }
  }
);

export const exportTimesheets = createAsyncThunk(
  "timesheets/export",
  async ({ format, filters }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(
        "/admin/timesheets/export",
        { format, filters },
        { responseType: "blob" }
      );

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
      .addCase(fetchTimesheets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimesheets.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload.records || action.payload.data || [];
        state.stats = action.payload.stats || initialState.stats;
      })
      .addCase(fetchTimesheets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateTimesheetStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateTimesheetStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Optimistically update the record in state
        const idx = state.records.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) {
          state.records[idx] = { ...state.records[idx], status: action.payload.status };
        }
      })
      .addCase(updateTimesheetStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
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