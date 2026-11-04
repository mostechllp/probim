// src/admin/store/slices/timesheetSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

// ────────────────────────────────────────────────────────────
// Thunks
// ────────────────────────────────────────────────────────────

export const fetchTimesheets = createAsyncThunk(
  "timesheets/fetchTimesheets",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/admin/timesheets", { params });
      const payload = res.data?.data || res.data || {};
      return {
        records: payload.timesheets || payload.records || [],
        stats: payload.kpis || payload.stats || {},
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch timesheets");
    }
  }
);

export const fetchTimesheetById = createAsyncThunk(
  "timesheets/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/admin/timesheets/${id}`);
      return res.data?.data || res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to fetch timesheet details");
    }
  }
);

export const createTimesheet = createAsyncThunk(
  "timesheets/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/admin/timesheets", data);
      return res.data?.data || res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to create timesheet");
    }
  }
);

export const updateTimesheet = createAsyncThunk(
  "timesheets/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/admin/timesheets/${id}`, data);
      return res.data?.data || res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to update timesheet");
    }
  }
);

export const deleteTimesheet = createAsyncThunk(
  "timesheets/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/admin/timesheets/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to delete timesheet");
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
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to approve timesheet");
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
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to reject timesheet");
    }
  }
);

// ────────────────────────────────────────────────────────────
// NEW: Bulk Actions
// ────────────────────────────────────────────────────────────

export const bulkApproveTimesheets = createAsyncThunk(
  "timesheets/bulkApprove",
  async (ids, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/admin/timesheets/bulk-approve`, { ids });
      return res.data?.data || res.data || { ids };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to bulk approve timesheets");
    }
  }
);

export const bulkRejectTimesheets = createAsyncThunk(
  "timesheets/bulkReject",
  async ({ ids, reason }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/admin/timesheets/bulk-reject`, { ids, reason });
      return res.data?.data || res.data || { ids };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to bulk reject timesheets");
    }
  }
);

export const exportTimesheets = createAsyncThunk(
  "timesheets/export",
  async ({ format, filters }, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/admin/timesheets/export", {
        params: { format: format === "excel" ? "xlsx" : format, ...filters },
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `timesheets-${new Date().toISOString().slice(0, 10)}.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || "Failed to export timesheets");
    }
  }
);

// ────────────────────────────────────────────────────────────
// Slice
// ────────────────────────────────────────────────────────────

const initialState = {
  records: [],
  stats: { total_logged_hours: 0, pending_approvals_count: 0, approved_hours: 0 },
  selectedTimesheet: null,
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
    clearSelectedTimesheet: (state) => {
      state.selectedTimesheet = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch List
      .addCase(fetchTimesheets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimesheets.fulfilled, (state, action) => {
        state.loading = false;
        state.records = Array.isArray(action.payload.records) ? action.payload.records : [];
        state.stats = action.payload.stats || initialState.stats;
      })
      .addCase(fetchTimesheets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Single
      .addCase(fetchTimesheetById.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(fetchTimesheetById.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.selectedTimesheet = action.payload;
      })
      .addCase(fetchTimesheetById.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createTimesheet.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createTimesheet.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createTimesheet.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateTimesheet.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateTimesheet.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateTimesheet.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteTimesheet.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(deleteTimesheet.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.records = state.records.filter((r) => r.id !== action.payload);
        if (state.selectedTimesheet?.id === action.payload) {
          state.selectedTimesheet = null;
        }
      })
      .addCase(deleteTimesheet.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Approve/Reject Single
      .addCase(approveTimesheet.fulfilled, (state, action) => {
        const idx = state.records.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.records[idx].status = "Approved";
        if (state.selectedTimesheet?.id === action.payload.id) state.selectedTimesheet.status = "Approved";
      })
      .addCase(rejectTimesheet.fulfilled, (state, action) => {
        const idx = state.records.findIndex((r) => r.id === action.payload.id);
        if (idx !== -1) state.records[idx].status = "Rejected";
        if (state.selectedTimesheet?.id === action.payload.id) state.selectedTimesheet.status = "Rejected";
      })
      
      // Approve/Reject Bulk
      .addCase(bulkApproveTimesheets.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(bulkApproveTimesheets.fulfilled, (state, action) => {
        state.actionLoading = false;
        const ids = action.payload.ids || action.meta.arg;
        state.records = state.records.map((r) => ids.includes(r.id) ? { ...r, status: "Approved" } : r);
      })
      .addCase(bulkApproveTimesheets.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(bulkRejectTimesheets.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(bulkRejectTimesheets.fulfilled, (state, action) => {
        state.actionLoading = false;
        const ids = action.payload.ids || action.meta.arg.ids;
        state.records = state.records.map((r) => ids.includes(r.id) ? { ...r, status: "Rejected" } : r);
      })
      .addCase(bulkRejectTimesheets.rejected, (state, action) => {
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

export const { clearTimesheetError, clearSelectedTimesheet } = timesheetSlice.actions;
export default timesheetSlice.reducer;