// src/admin/store/slices/dashboardSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

export const fetchDashboard = createAsyncThunk(
  "dashboard/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/admin/dashboard");
      console.log("Dashboard API Response:", res.data);
      
      const data = res.data?.data?.data || res.data?.data || res.data;
      
      return {
        stats: data.stats || null,
        charts: {
          punch_chart: data.charts?.punch_chart || null,
          weekly_attendance: data.weekly_attendance || null,
          today_status: data.today_status || null,
          avg_punch_time: data.avg_punch_time || null,
          recent_punches: data.recent_punches || null,
          punch_distribution: data.punch_distribution || null,
          project_allocation: data.project_allocation || null,
          project_hours: data.project_hours || null,
          project_stats: data.project_stats || null,
        },
        recent_data: data.recent_data || null,
        metadata: data.metadata || null,
      };
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      return rejectWithValue(err.response?.data || "Error fetching dashboard");
    }
  }
);

// ─── Fetch Monthly Hours by Project ──────────────────────────────────
// ─── Fetch Monthly Hours by Project ──────────────────────────────────
export const fetchMonthlyHoursByProject = createAsyncThunk(
  "dashboard/fetchMonthlyHoursByProject",
  async ({ projectId } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('project_id', projectId);
      
      const url = `/admin/project-assignments/monthly-hours${params.toString() ? '?' + params.toString() : ''}`;
      console.log("Fetching monthly hours for project:", url);
      
      const res = await apiClient.get(url);
      console.log("Monthly hours response:", res.data);
      
      // Return the entire data object which contains employees array
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error("Fetch monthly hours error:", err);
      return rejectWithValue(err.response?.data || "Error fetching monthly hours");
    }
  }
);

// ─── Fetch Employee Details by ID ────────────────────────────────────
export const fetchEmployeeDetails = createAsyncThunk(
  "dashboard/fetchEmployeeDetails",
  async (employeeId, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/admin/employees/${employeeId}`);
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error fetching employee details");
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    stats: null,
    charts: {
      punch_chart: null,
      weekly_attendance: null,
      today_status: null,
      avg_punch_time: null,
      recent_punches: null,
      punch_distribution: null,
      project_allocation: null,
      project_hours: null,
      project_stats: null,
    },
    recentData: null,
    metadata: null,
    loading: false,
    error: null,
    monthlyHours: {
      data: [],
      loading: false,
      error: null,
    },
    employeeDetails: {},
  },
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
    clearMonthlyHours: (state) => {
      state.monthlyHours.data = [];
      state.monthlyHours.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats || null;
        state.charts = action.payload.charts || null;
        state.recentData = action.payload.recent_data || null;
        state.metadata = action.payload.metadata || null;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch dashboard data";
      })
      .addCase(fetchMonthlyHoursByProject.pending, (state) => {
        state.monthlyHours.loading = true;
        state.monthlyHours.error = null;
      })
      .addCase(fetchMonthlyHoursByProject.fulfilled, (state, action) => {
        state.monthlyHours.loading = false;
        state.monthlyHours.data = action.payload || [];
      })
      .addCase(fetchMonthlyHoursByProject.rejected, (state, action) => {
        state.monthlyHours.loading = false;
        state.monthlyHours.error = action.payload || "Failed to fetch monthly hours";
      })
      .addCase(fetchEmployeeDetails.fulfilled, (state, action) => {
        const employee = action.payload;
        if (employee && employee.id) {
          state.employeeDetails[employee.id] = employee;
        }
      });
  },
});

// ─── Selectors ──────────────────────────────────────────────────────────
export const selectDashboardStats = (state) => state.dashboard.stats;
export const selectDashboardCharts = (state) => state.dashboard.charts;
export const selectDashboardRecentData = (state) => state.dashboard.recentData;
export const selectDashboardLoading = (state) => state.dashboard.loading;
export const selectDashboardError = (state) => state.dashboard.error;
export const selectMonthlyHours = (state) => state.dashboard.monthlyHours;
export const selectEmployeeDetails = (state) => state.dashboard.employeeDetails;

export const { clearDashboardError, clearMonthlyHours } = dashboardSlice.actions;
export default dashboardSlice.reducer;