import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import projectService from "../../services/projectService";

// Helper to map backend format to frontend model
const mapProjectFromApi = (apiProj) => {
  if (!apiProj) return null;
  return {
    id: apiProj.id,
    name: apiProj.name,
    description: apiProj.description || "",
    status: apiProj.status ?? "Active",
    createdDate: apiProj.created_at ? apiProj.created_at.split("T")[0] : apiProj.createdDate || "",
    updatedDate: apiProj.updated_at ? apiProj.updated_at.split("T")[0] : apiProj.updatedDate || "",
    taggedEmployees: apiProj.taggedEmployees || apiProj.employees?.map(e => Number(e.id)) || [],
    managerId: apiProj.project_manager_id || apiProj.managerId || "",
    teamLeadId: apiProj.team_lead_id || apiProj.teamLeadId || "",
    // Keep raw data just in case
    raw: apiProj
  };
};

// Async Thunks
export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (_, { rejectWithValue }) => {
    try {
      const response = await projectService.getProjects();
      const list = response.data || response || [];
      return list.map(mapProjectFromApi);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch projects");
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  "projects/fetchProjectById",
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await projectService.getProjectById(projectId);
      const data = response.data || response;
      return mapProjectFromApi(data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch project details");
    }
  }
);

export const addProject = createAsyncThunk(
  "projects/addProject",
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await projectService.createProject(projectData);
      const data = response.data || response;
      return mapProjectFromApi(data);
    } catch (error) {
      if (error.errors) {
        return rejectWithValue(error);
      }
      return rejectWithValue(error.message || "Failed to create project");
    }
  }
);

export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async (projectData, { rejectWithValue }) => {
    try {
      const { id, ...data } = projectData;
      const response = await projectService.updateProject(id, data);
      const updated = response.data || response;
      return mapProjectFromApi(updated);
    } catch (error) {
      if (error.errors) {
        return rejectWithValue(error);
      }
      return rejectWithValue(error.message || "Failed to update project");
    }
  }
);

export const patchProjectInline = createAsyncThunk(
  "projects/patchProjectInline",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await projectService.patchProject(id, data);
      const updated = response.data || response;
      return mapProjectFromApi(updated);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to perform inline update");
    }
  }
);

export const deleteProject = createAsyncThunk(
  "projects/deleteProject",
  async (projectId, { rejectWithValue }) => {
    try {
      await projectService.deleteProject(projectId);
      return projectId;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete project");
    }
  }
);

export const fetchProjectEmployees = createAsyncThunk(
  "projects/fetchProjectEmployees",
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await projectService.getProjectEmployees(projectId);
      return response.data || response || [];
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch employees assigned to this project");
    }
  }
);

export const tagEmployeesToProject = createAsyncThunk(
  "projects/tagEmployeesToProject",
  async ({ projectId, employeeIds }, { rejectWithValue }) => {
    try {
      const response = await projectService.assignProjectsToEmployee(projectId, employeeIds);
      const data = response.data || response;
      return mapProjectFromApi(data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to tag employees");
    }
  }
);

const initialState = {
  projects: [],
  currentProject: null,
  projectEmployees: [],
  loading: false,
  actionLoading: false,
  error: null,
  validationErrors: null,
  _optimisticSnapshot: null, // snapshot before optimistic update for rollback
  stats: {
    totalProjects: 0,
    activeProjects: 0,
    taggedEmployeesCount: 0,
    recentlyAdded: 0
  }
};

const calculateStats = (projects) => {
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "Active").length;
  
  const allTaggedSet = new Set();
  projects.forEach((p) => {
    (p.taggedEmployees || []).forEach((id) => allTaggedSet.add(id));
  });
  const taggedEmployeesCount = allTaggedSet.size;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentlyAdded = projects.filter((p) => {
    if (!p.createdDate) return false;
    const createdDate = new Date(p.createdDate);
    return createdDate >= thirtyDaysAgo;
  }).length;

  return {
    totalProjects,
    activeProjects,
    taggedEmployeesCount,
    recentlyAdded
  };
};

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearProjectError: (state) => {
      state.error = null;
      state.validationErrors = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
        state.stats = calculateStats(action.payload);
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch projects";
      })
      
      // Fetch Single Project By ID
      .addCase(fetchProjectById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch project details";
      })

      // Fetch Employees assigned to project
      .addCase(fetchProjectEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.projectEmployees = action.payload;
      })
      .addCase(fetchProjectEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch project employees";
      })

      // Add Project
      .addCase(addProject.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
        state.validationErrors = null;
      })
      .addCase(addProject.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.projects.unshift(action.payload);
        state.stats = calculateStats(state.projects);
      })
      .addCase(addProject.rejected, (state, action) => {
        state.actionLoading = false;
        if (action.payload && action.payload.errors) {
          state.validationErrors = action.payload.errors;
          state.error = action.payload.message;
        } else {
          state.error = action.payload;
        }
      })

      // Update Project (with Optimistic UI update logic)
      .addCase(updateProject.pending, (state, action) => {
        state.actionLoading = true;
        state.error = null;
        state.validationErrors = null;
        
        // Optimistic UI updates — save snapshot for rollback
        if (action.meta?.arg) {
          const { id, name, description, status, managerId, teamLeadId } = action.meta.arg;
          const originalProject = state.projects.find((p) => p.id === id);
          if (originalProject) {
            state._optimisticSnapshot = { ...originalProject };
          }
          state.projects = state.projects.map((p) => {
            if (p.id === id) {
              return {
                ...p,
                name: name !== undefined ? name : p.name,
                description: description !== undefined ? description : p.description,
                status: status !== undefined ? status : p.status,
                managerId: managerId !== undefined ? managerId : p.managerId,
                teamLeadId: teamLeadId !== undefined ? teamLeadId : p.teamLeadId
              };
            }
            return p;
          });
        }
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.actionLoading = false;
        state._optimisticSnapshot = null; // clear snapshot on success
        state.projects = state.projects.map((p) => 
          p.id === action.payload.id ? action.payload : p
        );
        if (state.currentProject && state.currentProject.id === action.payload.id) {
          state.currentProject = action.payload;
        }
        state.stats = calculateStats(state.projects);
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.actionLoading = false;
        // Rollback optimistic update
        if (state._optimisticSnapshot) {
          state.projects = state.projects.map((p) =>
            p.id === state._optimisticSnapshot.id ? state._optimisticSnapshot : p
          );
          state._optimisticSnapshot = null;
        }
        if (action.payload && action.payload.errors) {
          state.validationErrors = action.payload.errors;
          state.error = action.payload.message;
        } else {
          state.error = action.payload;
        }
      })

      // Inline Patch Project
      .addCase(patchProjectInline.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(patchProjectInline.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.projects = state.projects.map((p) => 
          p.id === action.payload.id ? action.payload : p
        );
        if (state.currentProject && state.currentProject.id === action.payload.id) {
          state.currentProject = action.payload;
        }
        state.stats = calculateStats(state.projects);
      })
      .addCase(patchProjectInline.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Delete Project
      .addCase(deleteProject.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.projects = state.projects.filter((p) => p.id !== action.payload);
        if (state.currentProject && state.currentProject.id === action.payload) {
          state.currentProject = null;
        }
        state.stats = calculateStats(state.projects);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete project";
      })

      // Tag Employees
      .addCase(tagEmployeesToProject.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(tagEmployeesToProject.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.projects = state.projects.map((p) => 
          p.id === action.payload.id ? action.payload : p
        );
        if (state.currentProject && state.currentProject.id === action.payload.id) {
          state.currentProject = action.payload;
        }
        state.stats = calculateStats(state.projects);
      })
      .addCase(tagEmployeesToProject.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to tag employees";
      });
  }
});

export const { clearProjectError } = projectSlice.actions;
export default projectSlice.reducer;
