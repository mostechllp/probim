// src/admin/store/slices/dashboardSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

export const fetchDashboard = createAsyncThunk(
  "dashboard/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/admin/dashboard");
      console.log("Dashboard API Response:", res.data);
      
      // ✅ Extract data from the correct nested structure
      const responseData = res.data?.data?.data || res.data?.data || res.data || {};
      
      // ✅ Map the data to match the component's expected structure
      return {
        stats: {
          today: {
            punched_in: responseData.today_status?.punched_in || 0,
            on_time: responseData.today_status?.["On time"] || 0,
            late: responseData.today_status?.Late || 0,
            absent: responseData.today_status?.Absent || 0,
            wfh: responseData.today_status?.WFH || 0,
            leave: responseData.today_status?.Leave || 0,
          },
          project_stats: responseData.project_stats || null,
        },
        charts: {
          today_status: responseData.today_status || null,
          weekly_attendance: responseData.weekly_attendance || null,
          avg_punch_time: responseData.avg_punch_time || null,
          recent_punches: responseData.recent_punches || null,
          punch_distribution: responseData.punch_distribution || null,
          project_allocation: responseData.project_allocation || null,
          project_hours: responseData.project_hours || null,
          project_stats: responseData.project_stats || null,
        },
        recent_data: responseData.recent_data || null,
        metadata: responseData.metadata || null,
      };
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      return rejectWithValue(err.response?.data || "Error fetching dashboard");
    }
  }
);

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
      today_status: null,
      weekly_attendance: null,
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