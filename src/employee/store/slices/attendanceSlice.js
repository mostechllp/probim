import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

// Fetch Dashboard Data
export const fetchDashboardData = createAsyncThunk(
  "attendance/fetchDashboardData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/employee/dashboard");
      console.log("Dashboard data:", response.data);

      if (response.data && response.data.status === "success") {
        return response.data.data;
      } else {
        return rejectWithValue(response.data?.message || "Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard data"
      );
    }
  }
);

export const punchIn = createAsyncThunk(
  "attendance/punchIn",
  async (data, { rejectWithValue }) => {
    try {
      const payload = {
        ...(data?.location && { location: data.location })
      };

      const response = await apiClient.post("/employee/punch-in", payload);

      if (response.data && response.data.status === "success") {
        // Save to localStorage
        localStorage.setItem("attendance-punched-in", "true");
        localStorage.setItem("attendance-punch-in-time", response.data.data.punch_in);
        if (data?.location) {
          localStorage.setItem("attendance-punch-location", JSON.stringify(data.location));
        }

        return response.data.data;
      } else {
        return rejectWithValue(response.data?.message || "Punch in failed");
      }
    } catch (error) {
      console.error("Punch in error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Punch in failed"
      );
    }
  }
);

// empAttendanceSlice.js
export const punchOut = createAsyncThunk(
  "attendance/punchOut",
  async ({ project_times, total_hours, location }, { rejectWithValue }) => {
    try {
      // Convert { "7": "05:00" } → [{ project_id: 7, time_minutes: 300 }]
      const formattedProjectTimes = Object.entries(project_times || {}).map(
        ([projectId, time]) => {
          const [hours, minutes] = time.split(":").map(Number);
          return {
            project_id: parseInt(projectId),
            time_minutes: hours * 60 + minutes,
          };
        }
      );

      const payload = {
        project_times: formattedProjectTimes,
        total_hours,
        ...(location && { location }),
      };

      console.log("PUNCH OUT PAYLOAD:", JSON.stringify(payload, null, 2));
      const response = await apiClient.post("/employee/punch-out", payload);
      // ...rest unchanged

      if (response.data && response.data.status === "success") {
        const data = response.data.data;
        localStorage.removeItem("attendance-punched-in");
        localStorage.removeItem("attendance-punch-in-time");
        localStorage.removeItem("attendance-punch-location");
        return {
          punch_out: data.punch_out,
          log_date: data.log_date,
          log_status: data.log_status,
          id: data.id
        };
      } else {
        return rejectWithValue(response.data?.message || "Punch out failed");
      }
    } catch (error) {
      console.error("Punch out error:", error);
      console.error("Validation errors:", JSON.stringify(error.response?.data, null, 2)); // ← HERE
      return rejectWithValue(
        error.response?.data?.message || "Punch out failed"
      );
    }
  }
);

const initialState = {
  isPunchedIn: localStorage.getItem("attendance-punched-in") === "true",
  punchInTime: localStorage.getItem("attendance-punch-in-time") || null,
  punchOutTime: null,
  loading: false,
  error: null,
  dashboardData: null, // Store dashboard data
};

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    clearAttendanceState: (state) => {
      state.isPunchedIn = false;
      state.punchInTime = null;
      state.punchOutTime = null;
      state.error = null;
      localStorage.removeItem("attendance-punched-in");
      localStorage.removeItem("attendance-punch-in-time");
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Fetch Dashboard Data
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardData = action.payload;
        // Update punch status from dashboard data if not already set
        if (action.payload.today_attendance) {
          state.isPunchedIn = action.payload.today_attendance.punched_in || false;
          state.punchInTime = action.payload.today_attendance.punch_in_time || null;
        }
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Punch In
      .addCase(punchIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(punchIn.fulfilled, (state, action) => {
        state.loading = false;
        state.isPunchedIn = true;
        state.punchInTime = action.payload.punch_in;
        state.error = null;
      })
      .addCase(punchIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Punch Out
      .addCase(punchOut.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(punchOut.fulfilled, (state, action) => {
        state.loading = false;
        state.isPunchedIn = false;
        state.punchOutTime = action.payload.punch_out;
        state.punchInTime = null;
        state.error = null;
      })
      .addCase(punchOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAttendanceState } = attendanceSlice.actions;
export default attendanceSlice.reducer;