// src/admin/store/slices/projectCostSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

// ────────────────────────────────────────────────────────────
// Async Thunks
// ────────────────────────────────────────────────────────────

/**
 * Financial summary per project for a period.
 * Params: { start_date, end_date, preset }
 */
export const fetchProjectCostSummary = createAsyncThunk(
  "projectCost/fetchSummary",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/admin/projects/financial-summary", {
        params,
      });
      const data = res.data?.data || res.data || {};
      return {
        records: data.records || data.projects || [],
        totals: data.totals || {},
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch project cost summary"
      );
    }
  }
);

/**
 * Per-employee hours/cost breakdown for a project.
 * Response: { employees: [...], daily_hours: [...] }
 */
export const fetchProjectCostBreakdown = createAsyncThunk(
  "projectCost/fetchBreakdown",
  async ({ projectId, start_date, end_date }, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(
        `/admin/projects/${projectId}/employee-breakdown`,
        { params: { start_date, end_date } }
      );
      const data = res.data?.data || res.data || {};
      return {
        projectId,
        employees: data.employees || [],
        dailyHours: data.daily_hours || data.dailyHours || [],
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch employee breakdown"
      );
    }
  }
);

/**
 * Export project cost report as Excel or PDF.
 * Payload: { format: 'excel' | 'pdf', filters }
 */
export const exportProjectCost = createAsyncThunk(
  "projectCost/export",
  async ({ format, filters }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(
        "/admin/projects/export",
        { format, filters },
        { responseType: "blob" }
      );

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ext = format === "excel" ? "xlsx" : "pdf";
      link.download = `project-cost-report-${new Date()
        .toISOString()
        .slice(0, 10)}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to export project cost report"
      );
    }
  }
);

// ────────────────────────────────────────────────────────────
// Initial State
// ────────────────────────────────────────────────────────────

const initialState = {
  summary: {
    records: [],
    totals: {},
    loading: false,
    error: null,
  },
  breakdown: {
    projectId: null,
    employees: [],
    dailyHours: [],
    loading: false,
    error: null,
  },
  exportLoading: false,
  error: null,
};

// ────────────────────────────────────────────────────────────
// Slice
// ────────────────────────────────────────────────────────────

const projectCostSlice = createSlice({
  name: "projectCost",
  initialState,
  reducers: {
    clearProjectCostError: (state) => {
      state.error = null;
    },
    clearBreakdown: (state) => {
      state.breakdown = {
        projectId: null,
        employees: [],
        dailyHours: [],
        loading: false,
        error: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Summary
      .addCase(fetchProjectCostSummary.pending, (state) => {
        state.summary.loading = true;
        state.summary.error = null;
      })
      .addCase(fetchProjectCostSummary.fulfilled, (state, action) => {
        state.summary.loading = false;
        state.summary.records = action.payload.records;
        state.summary.totals = action.payload.totals;
      })
      .addCase(fetchProjectCostSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error =
          action.payload || "Failed to fetch project cost summary";
      })

      // Breakdown
      .addCase(fetchProjectCostBreakdown.pending, (state) => {
        state.breakdown.loading = true;
        state.breakdown.error = null;
      })
      .addCase(fetchProjectCostBreakdown.fulfilled, (state, action) => {
        state.breakdown.loading = false;
        state.breakdown.projectId = action.payload.projectId;
        state.breakdown.employees = action.payload.employees;
        state.breakdown.dailyHours = action.payload.dailyHours;
      })
      .addCase(fetchProjectCostBreakdown.rejected, (state, action) => {
        state.breakdown.loading = false;
        state.breakdown.error =
          action.payload || "Failed to fetch employee breakdown";
      })

      // Export
      .addCase(exportProjectCost.pending, (state) => {
        state.exportLoading = true;
        state.error = null;
      })
      .addCase(exportProjectCost.fulfilled, (state) => {
        state.exportLoading = false;
      })
      .addCase(exportProjectCost.rejected, (state, action) => {
        state.exportLoading = false;
        state.error = action.payload || "Failed to export project cost";
      });
  },
});

export const { clearProjectCostError, clearBreakdown } =
  projectCostSlice.actions;
export default projectCostSlice.reducer;