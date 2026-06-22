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
      const response = await apiClient.post("/admin/modules", data);
      return response.data.data || response.data;
    } catch (error) {
      const valErrors = error.response?.data?.errors;
      const errorMsg = valErrors ? Object.values(valErrors).flat().join(", ") : (error.response?.data?.message || "Failed to add module");
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
      const response = await apiClient.put(`/admin/modules/${id}`, data);
      return response.data.data || response.data;
    } catch (error) {
      const valErrors = error.response?.data?.errors;
      const errorMsg = valErrors ? Object.values(valErrors).flat().join(", ") : (error.response?.data?.message || "Update failed");
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
      .addCase(addModule.fulfilled, (state, action) => {
        state.modules.push(action.payload);
      })
      // Update Module
      .addCase(updateModule.fulfilled, (state, action) => {
        const index = state.modules.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) {
          state.modules[index] = action.payload;
        }
      })
      // Delete Module
      .addCase(deleteModule.fulfilled, (state, action) => {
        state.modules = state.modules.filter((m) => m.id !== action.payload);
      });
  },
});

export default moduleSlice.reducer;
