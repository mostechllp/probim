import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const STORAGE_KEY = "probim_project_assignments_data";

const loadAssignmentsFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error loading assignments from localStorage", e);
  }

  // Default seeded project assignments (Employee ID -> Project IDs mapping)
  const seedAssignments = [
    {
      employeeId: 1, // Seeded Employee ID
      projectIds: ["proj-1", "proj-3"],
      lastUpdated: "2026-05-12"
    },
    {
      employeeId: 2,
      projectIds: ["proj-1"],
      lastUpdated: "2026-05-15"
    },
    {
      employeeId: 3,
      projectIds: ["proj-2", "proj-3"],
      lastUpdated: "2026-05-20"
    },
    {
      employeeId: 4,
      projectIds: ["proj-3"],
      lastUpdated: "2026-05-24"
    }
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAssignments));
  return seedAssignments;
};

const saveAssignmentsToStorage = (assignments) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  } catch (e) {
    console.error("Error saving assignments to localStorage", e);
  }
};

// Async Thunks
export const fetchAssignments = createAsyncThunk(
  "projectAssignments/fetchAssignments",
  async (_, { rejectWithValue }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const assignments = loadAssignmentsFromStorage();
        resolve(assignments);
      }, 500); // simulated API delay
    });
  }
);

export const saveAssignment = createAsyncThunk(
  "projectAssignments/saveAssignment",
  async ({ employeeId, projectIds }, { rejectWithValue }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const assignments = loadAssignmentsFromStorage();
        const empId = Number(employeeId);
        
        // Remove duplicates in selected projects
        const uniqueProjectIds = [...new Set(projectIds)];

        const existingIdx = assignments.findIndex((a) => Number(a.employeeId) === empId);

        const newAssignment = {
          employeeId: empId,
          projectIds: uniqueProjectIds,
          lastUpdated: new Date().toISOString().split("T")[0]
        };

        let updatedAssignments;
        if (existingIdx !== -1) {
          updatedAssignments = assignments.map((a, idx) => 
            idx === existingIdx ? newAssignment : a
          );
        } else {
          updatedAssignments = [newAssignment, ...assignments];
        }

        saveAssignmentsToStorage(updatedAssignments);
        resolve(newAssignment);
      }, 400);
    });
  }
);

export const deleteAssignment = createAsyncThunk(
  "projectAssignments/deleteAssignment",
  async (employeeId, { rejectWithValue }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const assignments = loadAssignmentsFromStorage();
        const empId = Number(employeeId);
        const filtered = assignments.filter((a) => Number(a.employeeId) !== empId);
        saveAssignmentsToStorage(filtered);
        resolve(empId);
      }, 400);
    });
  }
);

const initialState = {
  assignments: [],
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
        state.error = action.payload;
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
      });
  }
});

export const { clearAssignmentError } = projectAssignmentSlice.actions;
export default projectAssignmentSlice.reducer;
