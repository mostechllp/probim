import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import projectService from "../../services/projectService";

const mapAssignmentFromApi = (apiAssign, fallbackEmployeeId = null) => {
  if (!apiAssign) return null;

  // Try to find a NUMERIC employee ID from various fields
  // Priority: id (database PK) > employee_id (if numeric) > employee.id > fallback
  const candidates = [
    apiAssign.id,                  // Database primary key (most reliable for employee objects)
    apiAssign.employee_id,         // Could be numeric FK or string HR code
    apiAssign.employeeId,          // camelCase variant
    apiAssign.employee?.id,        // Nested relation
    fallbackEmployeeId             // Passed from caller
  ];

  let employeeId = null;
  for (const candidate of candidates) {
    if (candidate !== null && candidate !== undefined && candidate !== '' && !isNaN(Number(candidate))) {
      employeeId = Number(candidate);
      break;
    }
  }

  if (!employeeId || isNaN(employeeId)) {
    return null;
  }

  // Calculate project IDs array
  let projectIds = [];
  if (apiAssign.project_ids) {
    projectIds = apiAssign.project_ids;
  } else if (apiAssign.projectIds) {
    projectIds = apiAssign.projectIds;
  } else if (Array.isArray(apiAssign.projects)) {
    projectIds = apiAssign.projects.map(p => p.id || p);
  }

  return {
    employeeId,
    employeeCode: apiAssign.employee_id || null,  // Preserve the string HR code for display
    firstName: apiAssign.first_name || null,
    lastName: apiAssign.last_name || null,
    projectIds: projectIds.map(String),
    lastUpdated: apiAssign.updated_at ? apiAssign.updated_at.split("T")[0] : apiAssign.lastUpdated || new Date().toISOString().split("T")[0],
    raw: apiAssign
  };
};

// Async Thunks
export const fetchAssignments = createAsyncThunk(
  "projectAssignments/fetchAssignments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await projectService.getProjectAssignments();

      // Handle nested API response: { status: 'success', data: [...] }
      // Also handle: { data: { data: [...] } } or just [...]
      let list = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (Array.isArray(response?.data)) {
        list = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        list = response.data.data;
      } else if (response?.data && typeof response.data === 'object') {
        // If data is a single object (not array), wrap it
        list = [response.data];
      } else {
        list = [];
      }

      // Filter: valid employeeId AND has at least one project assigned
      const mapped = list
        .map(item => mapAssignmentFromApi(item))
        .filter(a => a !== null && !isNaN(a.employeeId) && a.projectIds.length > 0);
      return mapped;
    } catch (error) {
      console.error('[API ERROR] fetchAssignments:', error);
      return rejectWithValue(error.message || "Failed to load project assignments");
    }
  }
);

export const saveAssignment = createAsyncThunk(
  "projectAssignments/saveAssignment",
  async ({ employeeId, projectIds }, { rejectWithValue }) => {
    try {
      // Cast list to numbers to meet database exists validations
      const ids = projectIds.map(Number);
      const response = await projectService.assignProjectsToEmployee(employeeId, ids);

      // Try to map from response, but pass employeeId as fallback
      const data = response.data || response;
      let mapped = mapAssignmentFromApi(data, employeeId);

      // If mapping from response failed entirely, construct from known input
      if (!mapped || isNaN(mapped.employeeId)) {
        mapped = {
          employeeId: Number(employeeId),
          projectIds: ids.map(String),
          lastUpdated: new Date().toISOString().split("T")[0],
          raw: data
        };
      }

      // Ensure projectIds are synced with what we sent (response may not echo them)
      if (!mapped.projectIds || mapped.projectIds.length === 0) {
        mapped.projectIds = ids.map(String);
      }

      return mapped;
    } catch (error) {
      console.error('[API ERROR] saveAssignment:', error);
      return rejectWithValue(error.message || "Failed to save project assignment");
    }
  }
);

export const deleteAssignment = createAsyncThunk(
  "projectAssignments/deleteAssignment",
  async (employeeId, { rejectWithValue }) => {
    try {
      // Deleting assignments by employee involves removing all projects
      await projectService.assignProjectsToEmployee(employeeId, []);
      return Number(employeeId);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to remove project assignments");
    }
  }
);

export const fetchEmployeeProjects = createAsyncThunk(
  "projectAssignments/fetchEmployeeProjects",
  async (employeeId, { rejectWithValue }) => {
    try {
      const response = await projectService.getEmployeeProjects(employeeId);
      return response.data || response || [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch projects assigned to employee");
    }
  }
);

export const removeEmployeeSingleProject = createAsyncThunk(
  "projectAssignments/removeEmployeeSingleProject",
  async ({ employeeId, projectId }, { rejectWithValue }) => {
    try {
      await projectService.removeEmployeeProject(employeeId, projectId);
      return { employeeId: Number(employeeId), projectId: String(projectId) };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to remove assignment details");
    }
  }
);

const initialState = {
  assignments: [],
  employeeProjects: [],
  loading: false,
  actionLoading: false,
  error: null
};

const projectAssignmentSlice = createSlice({
  name: "projectAssignments",
  initialState,
  reducers: {
    clearAssignmentError: (state) => {
      state.error = null;
    }
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

        const exists = state.assignments.some(
          (a) => Number(a.employeeId) === Number(action.payload.employeeId)
        );

        if (exists) {
          state.assignments = state.assignments.map((a) =>
            Number(a.employeeId) === Number(action.payload.employeeId) ? action.payload : a
          );
        } else {
          state.assignments.unshift(action.payload);
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
          (a) => Number(a.employeeId) !== Number(action.payload)
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
              projectIds: a.projectIds.filter(id => String(id) !== projectId)
            };
          }
          return a;
        });
        state.employeeProjects = state.employeeProjects.filter(
          (p) => String(p.id) !== projectId
        );
      });
  }
});

export const { clearAssignmentError } = projectAssignmentSlice.actions;
export default projectAssignmentSlice.reducer;
