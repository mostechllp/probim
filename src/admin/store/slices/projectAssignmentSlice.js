// src/admin/store/slices/projectAssignmentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import projectService from "../../services/projectService";

const mapAssignmentFromApi = (apiAssign, fallbackEmployeeId = null) => {
  if (!apiAssign) return null;

  // Try to find a NUMERIC employee ID from various fields
  const candidates = [
    apiAssign.id,
    apiAssign.employee_id,
    apiAssign.employeeId,
    apiAssign.employee?.id,
    fallbackEmployeeId,
  ];

  let employeeId = null;
  for (const candidate of candidates) {
    if (
      candidate !== null &&
      candidate !== undefined &&
      candidate !== "" &&
      !isNaN(Number(candidate))
    ) {
      employeeId = Number(candidate);
      break;
    }
  }

  if (!employeeId || isNaN(employeeId)) {
    return null;
  }

  // Get user_id from the API response
  let userId = null;
  if (apiAssign.user_id) {
    userId = Number(apiAssign.user_id);
  } else if (apiAssign.user?.id) {
    userId = Number(apiAssign.user.id);
  } else if (apiAssign.employee?.user_id) {
    userId = Number(apiAssign.employee.user_id);
  } else if (apiAssign.employee?.user?.id) {
    userId = Number(apiAssign.employee.user.id);
  }

  // Calculate project IDs array from projects relation
  let projectIds = [];
  if (apiAssign.project_ids) {
    projectIds = apiAssign.project_ids;
  } else if (apiAssign.projectIds) {
    projectIds = apiAssign.projectIds;
  } else if (Array.isArray(apiAssign.projects)) {
    projectIds = apiAssign.projects.map((p) => p.id || p);
  }

  return {
    employeeId,
    userId, // Store the user_id for API calls
    employeeCode: apiAssign.employee_id || null,
    firstName: apiAssign.first_name || null,
    lastName: apiAssign.last_name || null,
    projectIds: projectIds.map(String),
    lastUpdated: apiAssign.updated_at
      ? apiAssign.updated_at.split("T")[0]
      : apiAssign.lastUpdated || new Date().toISOString().split("T")[0],
    raw: apiAssign,
  };
};

// Async Thunks
export const fetchAssignments = createAsyncThunk(
  "projectAssignments/fetchAssignments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await projectService.getProjectAssignments();

      let list = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (Array.isArray(response?.data)) {
        list = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        list = response.data.data;
      } else if (response?.data && typeof response.data === "object") {
        list = [response.data];
      } else {
        list = [];
      }

      const mapped = list
        .map((item) => mapAssignmentFromApi(item))
        .filter(
          (a) => a !== null && !isNaN(a.employeeId) && a.projectIds.length > 0,
        );
      return mapped;
    } catch (error) {
      console.error("[API ERROR] fetchAssignments:", error);
      return rejectWithValue(
        error.message || "Failed to load project assignments",
      );
    }
  },
);

export const saveAssignment = createAsyncThunk(
  "projectAssignments/saveAssignment",
  async ({ employeeId, projectIds }, { rejectWithValue, dispatch }) => {
    try {
      const ids = projectIds.map(Number);
      await projectService.assignProjectsToEmployee(employeeId, ids);

      // After successful save, fetch the updated assignments
      const updatedAssignments = await dispatch(fetchAssignments()).unwrap();

      // Find the specific employee's updated assignment
      const updatedAssignment = updatedAssignments.find(
        (a) => Number(a.employeeId) === Number(employeeId),
      );

      if (updatedAssignment) {
        return updatedAssignment;
      }

      // If the employee has no projects assigned anymore, return empty assignment
      return {
        employeeId: Number(employeeId),
        projectIds: [],
        lastUpdated: new Date().toISOString().split("T")[0],
      };
    } catch (error) {
      console.error("[API ERROR] saveAssignment:", error);
      return rejectWithValue(
        error.message || "Failed to save project assignment",
      );
    }
  },
);

export const deleteAssignment = createAsyncThunk(
  "projectAssignments/deleteAssignment",
  async (employeeId, { rejectWithValue, dispatch }) => {
    try {
      await projectService.assignProjectsToEmployee(employeeId, []);

      // After successful delete, fetch the updated assignments
      await dispatch(fetchAssignments()).unwrap();

      return Number(employeeId);
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to remove project assignments",
      );
    }
  },
);

export const fetchEmployeeProjects = createAsyncThunk(
  "projectAssignments/fetchEmployeeProjects",
  async (employeeId, { rejectWithValue }) => {
    try {
      const response = await projectService.getEmployeeProjects(employeeId);
      return response.data || response || [];
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch projects assigned to employee",
      );
    }
  },
);

export const removeEmployeeSingleProject = createAsyncThunk(
  "projectAssignments/removeEmployeeSingleProject",
  async ({ employeeId, projectId }, { rejectWithValue, dispatch }) => {
    try {
      await projectService.removeEmployeeProject(employeeId, projectId);

      // After successful removal, fetch the updated assignments
      await dispatch(fetchAssignments()).unwrap();

      return { employeeId: Number(employeeId), projectId: String(projectId) };
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to remove assignment details",
      );
    }
  },
);

export const fetchEmployeeProjectWorkingTime = createAsyncThunk(
  "projectAssignments/fetchEmployeeProjectWorkingTime",
  async (userId, { rejectWithValue }) => {
    try {
      const response =
        await projectService.getEmployeeProjectWorkingTime(userId);
      console.log("Working time API response:", response);

      // Extract project_times from the response
      let projectTimes = [];
      if (response?.data?.project_times) {
        projectTimes = response.data.project_times;
      } else if (Array.isArray(response?.data)) {
        projectTimes = response.data;
      } else if (Array.isArray(response)) {
        projectTimes = response;
      }

      console.log("Extracted project times:", projectTimes);
      return { userId, data: projectTimes };
    } catch (error) {
      console.error("Error fetching working time:", error);
      return rejectWithValue(
        error.message || "Failed to fetch employee project working time",
      );
    }
  },
);

const initialState = {
  assignments: [],
  employeeProjects: [],
  employeeWorkingTime: {},
  loading: false,
  actionLoading: false,
  error: null,
};

const projectAssignmentSlice = createSlice({
  name: "projectAssignments",
  initialState,
  reducers: {
    clearAssignmentError: (state) => {
      state.error = null;
    },
    updateAssignmentLocally: (state, action) => {
      const { employeeId, projectIds } = action.payload;
      const exists = state.assignments.some(
        (a) => Number(a.employeeId) === Number(employeeId),
      );

      if (exists) {
        state.assignments = state.assignments.map((a) =>
          Number(a.employeeId) === Number(employeeId)
            ? { ...a, projectIds: projectIds.map(String) }
            : a,
        );
      } else if (projectIds && projectIds.length > 0) {
        state.assignments.unshift({
          employeeId: Number(employeeId),
          projectIds: projectIds.map(String),
          lastUpdated: new Date().toISOString().split("T")[0],
        });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Assignments
      .addCase(fetchAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = action.payload;
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load project assignments";
      })

      // Save Assignment (Create / Edit)
      .addCase(saveAssignment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(saveAssignment.fulfilled, (state, action) => {
        state.actionLoading = false;

        const payload = action.payload;
        if (payload && payload.employeeId) {
          const exists = state.assignments.some(
            (a) => Number(a.employeeId) === Number(payload.employeeId),
          );

          if (payload.projectIds && payload.projectIds.length === 0) {
            state.assignments = state.assignments.filter(
              (a) => Number(a.employeeId) !== Number(payload.employeeId),
            );
          } else if (exists) {
            state.assignments = state.assignments.map((a) =>
              Number(a.employeeId) === Number(payload.employeeId) ? payload : a,
            );
          } else {
            state.assignments.unshift(payload);
          }
        }
      })
      .addCase(saveAssignment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to save project mappings";
      })

      // Delete Assignment
      .addCase(deleteAssignment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.assignments = state.assignments.filter(
          (a) => Number(a.employeeId) !== Number(action.payload),
        );
      })
      .addCase(deleteAssignment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete assignment mapping";
      })

      // Fetch Employee Assigned Projects
      .addCase(fetchEmployeeProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.employeeProjects = action.payload;
      })
      .addCase(fetchEmployeeProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Remove single project assignment from employee
      .addCase(removeEmployeeSingleProject.fulfilled, (state, action) => {
        const { employeeId, projectId } = action.payload;
        state.assignments = state.assignments.map((a) => {
          if (Number(a.employeeId) === employeeId) {
            return {
              ...a,
              projectIds: a.projectIds.filter((id) => String(id) !== projectId),
            };
          }
          return a;
        });
        state.employeeProjects = state.employeeProjects.filter(
          (p) => String(p.id) !== projectId,
        );
      })

      // Fetch Employee Project Working Time
      .addCase(fetchEmployeeProjectWorkingTime.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeProjectWorkingTime.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, data } = action.payload;
        console.log("Storing working time for userId:", userId, "data:", data);
        state.employeeWorkingTime[userId] = data;
      })
      .addCase(fetchEmployeeProjectWorkingTime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAssignmentError, updateAssignmentLocally } =
  projectAssignmentSlice.actions;
export default projectAssignmentSlice.reducer;
