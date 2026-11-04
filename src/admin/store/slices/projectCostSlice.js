// src/admin/store/slices/projectCostSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

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
      return res.data?.data || res.data || {};
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch project cost summary"
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
      
      const projectData = res.data?.data?.project || res.data?.project || res.data?.data || res.data || {};
      
      return {
        projectId,
        employees: projectData.employees || [],
        // Make sure we grab daily_hours from the project object
        dailyHours: projectData.daily_hours || projectData.dailyHours || [],
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch employee breakdown"
      );
    }
  }
);

export const exportProjectCost = createAsyncThunk(
  "projectCost/export",
  async ({ format, filters }, { rejectWithValue }) => {
    try {
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
        error.response?.data?.message || error.message || "Failed to export project cost report"
      );
    }
  }
);

const initialState = {
  summary: {
    data: null,
    loading: false,
    error: null,
  },
  breakdown: {
    projectId: null,
    projectName: null,
    employees: [],
    dailyHours: [],
    loading: false,
    error: null,
  },
  exportLoading: false,
  error: null,
};

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
        projectName: null,
        employees: [],
        dailyHours: [],
        loading: false,
        error: null,
      };
    },
    setActiveProjectMeta: (state, action) => {
      state.breakdown.projectId = action.payload.id;
      state.breakdown.projectName = action.payload.name;
    }
  },
  extraReducers: (builder) => {
    builder
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
        state.summary.error = action.payload || "Failed to fetch project cost summary";
      })

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
        state.breakdown.error = action.payload || "Failed to fetch employee breakdown";
      })

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

export const { clearProjectCostError, clearBreakdown, setActiveProjectMeta } = projectCostSlice.actions;
export default projectCostSlice.reducer;