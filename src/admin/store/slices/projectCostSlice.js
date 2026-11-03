// src/admin/store/slices/projectCostSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

// ────────────────────────────────────────────────────────────
// Async Thunks
// ────────────────────────────────────────────────────────────

export const fetchProjectCostSummary = createAsyncThunk(
  "projectCost/fetchSummary",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/admin/projects/cost", {
        params: {
          filter: params.filter,
          start_date: params.start_date,
          end_date: params.end_date,
          search: params.search,
        },
      });
      // API returns { status, message, data: { summary, projects, currency, period_label } }
      return res.data?.data || res.data || {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to fetch project cost summary"
      );
    }
  }
);

export const fetchProjectCostBreakdown = createAsyncThunk(
  "projectCost/fetchBreakdown",
  async ({ projectId, filter, start_date, end_date }, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/admin/projects/cost/${projectId}`, {
        params: { filter, start_date, end_date },
      });
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

export const exportProjectCost = createAsyncThunk(
  "projectCost/export",
  async ({ format, filters }, { rejectWithValue }) => {
    try {
      // API expects GET /api/admin/projects/cost/export?format=xlsx
      const res = await apiClient.get("/admin/projects/cost/export", {
        params: {
          format: format === "excel" ? "xlsx" : format,
          ...filters,
        },
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const ext = format === "excel" ? "xlsx" : "pdf";
      link.download = `project-cost-report-${new Date().toISOString().slice(0, 10)}.${ext}`;
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
    data: null, // Will hold the full { summary, projects, currency, period_label } object
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
        state.summary.data = action.payload;
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

export const { clearProjectCostError, clearBreakdown } = projectCostSlice.actions;
export default projectCostSlice.reducer;