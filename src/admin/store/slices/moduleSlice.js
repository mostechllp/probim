import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

export const fetchModules = createAsyncThunk(
  "modules/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/modules");
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch modules"
      );
    }
  }
);

export const addModule = createAsyncThunk(
  "modules/add",
  async (data, { rejectWithValue }) => {
    try {
      // Ensure route is included - just /slug
      const payload = {
        name: data.name,
        slug: data.slug,
        route: data.route || `/${data.slug}`,
        icon: data.icon || "bx-folder",
        status: data.status || "active",
      };
      const response = await apiClient.post("/admin/modules", payload);
      return response.data.data || response.data;
    } catch (error) {
      const valErrors = error.response?.data?.errors;
      const errorMsg = valErrors 
        ? Object.values(valErrors).flat().join(", ") 
        : (error.response?.data?.message || "Failed to add module");
      return rejectWithValue(errorMsg);
    }
  }
);

export const fetchModuleById = createAsyncThunk(
  "modules/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/admin/modules/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch module"
      );
    }
  }
);

export const updateModule = createAsyncThunk(
  "modules/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // Ensure route is included - just /slug
      const payload = {
        name: data.name,
        slug: data.slug,
        route: data.route || `/${data.slug}`,
        icon: data.icon || "bx-folder",
        status: data.status || "active",
      };
      const response = await apiClient.put(`/admin/modules/${id}`, payload);
      return response.data.data || response.data;
    } catch (error) {
      const valErrors = error.response?.data?.errors;
      const errorMsg = valErrors 
        ? Object.values(valErrors).flat().join(", ") 
        : (error.response?.data?.message || "Update failed");
      return rejectWithValue(errorMsg);
    }
  }
);

export const deleteModule = createAsyncThunk(
  "modules/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/admin/modules/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Delete failed");
    }
  }
);

const moduleSlice = createSlice({
  name: "modules",
  initialState: {
    modules: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Modules
      .addCase(fetchModules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.loading = false;
        state.modules = action.payload || [];
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add Module
      .addCase(addModule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addModule.fulfilled, (state, action) => {
        state.loading = false;
        state.modules.push(action.payload);
      })
      .addCase(addModule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Module
      .addCase(updateModule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateModule.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.modules.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) {
          state.modules[index] = action.payload;
        }
      })
      .addCase(updateModule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Module
      .addCase(deleteModule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteModule.fulfilled, (state, action) => {
        state.loading = false;
        state.modules = state.modules.filter((m) => m.id !== action.payload);
      })
      .addCase(deleteModule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default moduleSlice.reducer;