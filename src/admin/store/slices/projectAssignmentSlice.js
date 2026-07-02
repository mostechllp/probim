// src/admin/store/slices/projectAssignmentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import projectService from "../../services/projectService";

// src/admin/store/slices/projectAssignmentSlice.js

// Update the mapAssignmentFromApi function in projectAssignmentSlice.js
const mapAssignmentFromApi = (
  apiAssign,
  fallbackEmployeeId = null,
  includeEmpty = false,
) => {
  if (!apiAssign) return null;

  // Try to find employee ID - but now also handle if the employee ID is the same as user_id
  // For employee assignments, the employeeId might be the employee record ID, not the user_id
  let employeeId = null;
  let userId = null;
  
  // First try to get user_id
  if (apiAssign.user_id) {
    userId = Number(apiAssign.user_id);
  } else if (apiAssign.user?.id) {
    userId = Number(apiAssign.user.id);
  }
  
  // Get employee ID from various sources
  const idCandidates = [
    apiAssign.employee_id, // This is the employee ID from the API
    apiAssign.id,
    apiAssign.employeeId,
    apiAssign.employee?.id,
    userId, // Fallback to user_id if no employee_id found
    fallbackEmployeeId,
  ];

  for (const candidate of idCandidates) {
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

  // Get project IDs
  let projectIds = [];
  if (apiAssign.project_ids) {
    projectIds = apiAssign.project_ids;
  } else if (apiAssign.projectIds) {
    projectIds = apiAssign.projectIds;
  } else if (Array.isArray(apiAssign.projects)) {
    projectIds = apiAssign.projects.map((p) => String(p.id || p));
  }

  // If includeEmpty is false, filter out empty assignments
  if (!includeEmpty && projectIds.length === 0) {
    return null;
  }

  return {
    employeeId, // This should be the employee record ID
    userId: userId || null,
    employeeCode: apiAssign.employee_id || `EMP-${employeeId}`, // Store the employee_id from API
    firstName: apiAssign.first_name || null,
    lastName: apiAssign.last_name || null,
    projectIds: projectIds.map(String),
    lastUpdated: apiAssign.updated_at
      ? apiAssign.updated_at.split("T")[0]
      : apiAssign.lastUpdated || new Date().toISOString().split("T")[0],
    raw: apiAssign,
  };
};

// Update fetchAssignments to include empty assignments if needed
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
        .map((item) => mapAssignmentFromApi(item, null, true)) // Pass true to include empty assignments
        .filter((a) => a !== null && !isNaN(a.employeeId));

      // Only keep assignments that have at least one project, or keep all if we want to show empty ones
      // For now, filter out empty ones for the main list
      return mapped.filter((a) => a.projectIds.length > 0);
    } catch (error) {
      console.error("[API ERROR] fetchAssignments:", error);
      return rejectWithValue(
        error.message || "Failed to load project assignments",
      );
    }
  },
);

// src/admin/store/slices/projectAssignmentSlice.js

export const saveAssignment = createAsyncThunk(
  "projectAssignments/saveAssignment",
  async (
    { employeeId, projectIds },
    { rejectWithValue, dispatch, getState },
  ) => {
    try {
      const ids = projectIds.map(Number);
      const response = await projectService.assignProjectsToEmployee(
        employeeId,
        ids,
      );

      console.log("Save assignment response:", response);

      // Get the updated projects from the response
      let updatedProjectIds = [];
      let userId = null;

      if (response?.data) {
        const data = response.data;
        userId = data.user_id || null;

        if (data.projects && Array.isArray(data.projects)) {
          updatedProjectIds = data.projects.map((p) => String(p.id));
        }
      }

      console.log("Updated project IDs:", updatedProjectIds);

      // Create the updated assignment object
      const updatedAssignment = {
        employeeId: Number(employeeId),
        userId: userId,
        projectIds: updatedProjectIds,
        lastUpdated: new Date().toISOString().split("T")[0],
        raw: response?.data || response,
      };

      // If there are no projects, we need to remove the assignment from the list
      if (updatedProjectIds.length === 0) {
        // Return empty assignment to indicate removal
        return {
          ...updatedAssignment,
          projectIds: [],
          _remove: true, // Flag to indicate this should be removed
        };
      }

      return updatedAssignment;
    } catch (error) {
      console.error("[API ERROR] saveAssignment:", error);
      return rejectWithValue(
        error.message || "Failed to save project assignment",
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

// src/admin/store/slices/projectAssignmentSlice.js

export const fetchEmployeeProjectWorkingTime = createAsyncThunk(
  "projectAssignments/fetchEmployeeProjectWorkingTime",
  async (userId, { rejectWithValue }) => {
    try {
      const response =
        await projectService.getEmployeeProjectWorkingTime(userId);
      console.log("Working time API response:", response);

      // Extract project_times from the response - FIXED
      let projectTimes = [];

      // Check the actual response structure
      if (response?.data?.project_times) {
        projectTimes = response.data.project_times;
      } else if (response?.data && Array.isArray(response.data)) {
        projectTimes = response.data;
      } else if (Array.isArray(response)) {
        projectTimes = response;
      } else if (response?.project_times) {
        projectTimes = response.project_times;
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

export const deleteAllEmployeeProjects = createAsyncThunk(
  "projectAssignments/deleteAllEmployeeProjects",
  async (employeeId, { rejectWithValue, dispatch }) => {
    try {
      // Call the new API to remove all assignments
      await projectService.removeAllEmployeeProjects(employeeId);

      // After successful deletion, fetch the updated assignments
      await dispatch(fetchAssignments()).unwrap();

      return Number(employeeId);
    } catch (error) {
      console.error("[API ERROR] deleteAllEmployeeProjects:", error);
      return rejectWithValue(
        error.message || "Failed to remove all project assignments",
      );
    }
  },
);

// Update the deleteAssignment thunk to use the new API
export const deleteAssignment = createAsyncThunk(
  "projectAssignments/deleteAssignment",
  async (employeeId, { rejectWithValue, dispatch }) => {
    try {
      // Use the new API to remove all assignments
      await projectService.removeAllEmployeeProjects(employeeId);

      // After successful delete, fetch the updated assignments
      const updatedAssignments = await dispatch(fetchAssignments()).unwrap();

      return Number(employeeId);
    } catch (error) {
      console.error("[API ERROR] deleteAssignment:", error);
      return rejectWithValue(
        error.message || "Failed to remove project assignments",
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
      // In the extraReducers, update the saveAssignment.fulfilled case

      .addCase(saveAssignment.fulfilled, (state, action) => {
        state.actionLoading = false;

        const payload = action.payload;
        if (payload && payload.employeeId) {
          // Check if this is a removal (empty projectIds with _remove flag)
          if (
            payload._remove ||
            (payload.projectIds && payload.projectIds.length === 0)
          ) {
            // Remove the assignment entirely
            state.assignments = state.assignments.filter(
              (a) => Number(a.employeeId) !== Number(payload.employeeId),
            );
            return;
          }

          const exists = state.assignments.some(
            (a) => Number(a.employeeId) === Number(payload.employeeId),
          );

          if (exists) {
            state.assignments = state.assignments.map((a) =>
              Number(a.employeeId) === Number(payload.employeeId)
                ? { ...payload, _remove: undefined } // Remove the flag
                : a,
            );
          } else {
            state.assignments.unshift({ ...payload, _remove: undefined });
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
      })
      .addCase(deleteAllEmployeeProjects.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteAllEmployeeProjects.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.assignments = state.assignments.filter(
          (a) => Number(a.employeeId) !== Number(action.payload),
        );
      })
      .addCase(deleteAllEmployeeProjects.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete all assignments";
      });
  },
});

export const { clearAssignmentError, updateAssignmentLocally } =
  projectAssignmentSlice.actions;
export default projectAssignmentSlice.reducer;
