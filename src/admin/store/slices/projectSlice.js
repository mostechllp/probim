import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Helper to interact with LocalStorage
const STORAGE_KEY = "probim_projects_data";

const loadProjectsFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error loading projects from localStorage", e);
  }

  // Default seed projects
  const seedProjects = [
    {
      id: "proj-1",
      name: "Enterprise ERP Portal",
      description: "Re-platforming the legacy human resource portals and customer management system to a single core interface.",
      status: "Active",
      createdDate: "2026-02-15",
      taggedEmployees: [1, 2] // Seeded with employee IDs
    },
    {
      id: "proj-2",
      name: "Mobile Client App",
      description: "Developing the React Native application for field agents to register logs, reports, and attendance records.",
      status: "Active",
      createdDate: "2026-03-10",
      taggedEmployees: [3]
    },
    {
      id: "proj-3",
      name: "Cloud Migration Phase 2",
      description: "Transitioning database storage and background job runner networks from local hypervisors to secure cloud instances.",
      status: "Active",
      createdDate: "2026-04-01",
      taggedEmployees: [1, 3, 4]
    },
    {
      id: "proj-4",
      name: "Security Compliance Audit",
      description: "Reviewing firewall policies, access logs, and verifying role permissions meet data standard regulations.",
      status: "Inactive",
      createdDate: "2026-01-20",
      taggedEmployees: []
    }
  ];
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedProjects));
  return seedProjects;
};

const saveProjectsToStorage = (projects) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error("Error saving projects to localStorage", e);
  }
};

// Async Thunks simulating API actions
export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (_, { rejectWithValue }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const projects = loadProjectsFromStorage();
        resolve(projects);
      }, 500); // 500ms delay to show skeletons
    });
  }
);

export const addProject = createAsyncThunk(
  "projects/addProject",
  async (projectData, { rejectWithValue, getState }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const name = projectData.name.trim();
        const description = (projectData.description || "").trim();
        
        const projects = loadProjectsFromStorage();
        
        // Duplicate check
        const isDuplicate = projects.some(
          (p) => p.name.toLowerCase() === name.toLowerCase()
        );
        
        if (isDuplicate) {
          reject(rejectWithValue("A project with this name already exists."));
          return;
        }

        const newProject = {
          id: `proj-${Date.now()}`,
          name,
          description,
          status: projectData.status || "Active",
          createdDate: new Date().toISOString().split("T")[0],
          taggedEmployees: [],
          managerId: projectData.managerId || "",
          teamLeadId: projectData.teamLeadId || ""
        };

        const updatedProjects = [newProject, ...projects];
        saveProjectsToStorage(updatedProjects);
        resolve(newProject);
      }, 400);
    });
  }
);

export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async (projectData, { rejectWithValue }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const { id, name, description, status, managerId, teamLeadId } = projectData;
        const trimmedName = name.trim();
        const trimmedDesc = (description || "").trim();
        
        const projects = loadProjectsFromStorage();
        
        // Duplicate check (excluding self)
        const isDuplicate = projects.some(
          (p) => p.id !== id && p.name.toLowerCase() === trimmedName.toLowerCase()
        );
        
        if (isDuplicate) {
          reject(rejectWithValue("A project with this name already exists."));
          return;
        }

        const updatedProjects = projects.map((p) => {
          if (p.id === id) {
            return {
              ...p,
              name: trimmedName,
              description: trimmedDesc,
              status: status || p.status,
              managerId: managerId !== undefined ? managerId : p.managerId || "",
              teamLeadId: teamLeadId !== undefined ? teamLeadId : p.teamLeadId || ""
            };
          }
          return p;
        });

        saveProjectsToStorage(updatedProjects);
        const updated = updatedProjects.find((p) => p.id === id);
        resolve(updated);
      }, 400);
    });
  }
);

export const deleteProject = createAsyncThunk(
  "projects/deleteProject",
  async (projectId, { rejectWithValue }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const projects = loadProjectsFromStorage();
        const filtered = projects.filter((p) => p.id !== projectId);
        saveProjectsToStorage(filtered);
        resolve(projectId);
      }, 400);
    });
  }
);

export const tagEmployeesToProject = createAsyncThunk(
  "projects/tagEmployeesToProject",
  async ({ projectId, employeeIds }, { rejectWithValue }) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const projects = loadProjectsFromStorage();
        const exists = projects.some((p) => p.id === projectId);
        
        if (!exists) {
          reject(rejectWithValue("Project not found."));
          return;
        }

        const updatedProjects = projects.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              // Convert to numbers or keep as IDs depending on format
              taggedEmployees: employeeIds.map(Number)
            };
          }
          return p;
        });

        saveProjectsToStorage(updatedProjects);
        const updated = updatedProjects.find((p) => p.id === projectId);
        resolve(updated);
      }, 500);
    });
  }
);

const initialState = {
  projects: [],
  loading: false,
  actionLoading: false,
  error: null,
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
  
  // Calculate unique tagged employees
  const allTaggedSet = new Set();
  projects.forEach((p) => {
    (p.taggedEmployees || []).forEach((id) => allTaggedSet.add(id));
  });
  const taggedEmployeesCount = allTaggedSet.size;

  // Recently added projects (created within the last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentlyAdded = projects.filter((p) => {
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
      
      // Add Project
      .addCase(addProject.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(addProject.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.projects.unshift(action.payload);
        state.stats = calculateStats(state.projects);
      })
      .addCase(addProject.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // Update Project
      .addCase(updateProject.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.projects = state.projects.map((p) => 
          p.id === action.payload.id ? action.payload : p
        );
        state.stats = calculateStats(state.projects);
      })
      .addCase(updateProject.rejected, (state, action) => {
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
        state.stats = calculateStats(state.projects);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload || "Failed to delete project";
      })

      // Tag Employees to Project
      .addCase(tagEmployeesToProject.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(tagEmployeesToProject.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.projects = state.projects.map((p) => 
          p.id === action.payload.id ? action.payload : p
        );
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
