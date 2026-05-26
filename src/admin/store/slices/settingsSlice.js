import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

export const updateProfile = createAsyncThunk(
  "settings/updateProfile",
  async (profileData, { rejectWithValue, dispatch }) => {
    console.log("=== updateProfile thunk called ===");
    
    try {
      const isFormData = profileData instanceof FormData;
      const headers = isFormData ? { "Content-Type": "multipart/form-data" } : {};
      
      const response = await apiClient.post("/employee/update-profile", profileData, { headers });
      
      console.log("Update successful:", response.data);
      
      // After successful update, fetch fresh user data
      const userResponse = await apiClient.get("/auth/me");
      const userDataFromResponse = userResponse.data.data || userResponse.data;
      const updatedUser = userDataFromResponse.user || userDataFromResponse;
      
      const userData = {
        id: updatedUser.id,
        name: updatedUser.name || updatedUser.employee?.name,
        email: updatedUser.email,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        type: updatedUser.type,
        ...updatedUser
      };
      
      // Update auth state
      dispatch({
        type: "auth/updateUser",
        payload: userData
      });
      
      return userData;
    } catch (error) {
      console.error("Update Profile Error:", error.response?.data);
      
      // Handle validation errors
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        return rejectWithValue(errorMessage);
      }
      
      return rejectWithValue(
        error.response?.data?.message || "Failed to update profile"
      );
    }
  }
);
// Change password
export const changePassword = createAsyncThunk(
  "settings/changePassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/employee/change-password", passwordData);
      return response.data.data || response.data;
    } catch (error) {
      console.error("Change password error:", error);
      
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;
        if (errors) {
          const firstError = Object.values(errors)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          return rejectWithValue(errorMessage);
        }
      }
      
      if (error.response?.status === 401) {
        return rejectWithValue("Current password is incorrect");
      }
      
      return rejectWithValue(
        error.response?.data?.message || "Failed to change password"
      );
    }
  }
);

// Fetch current user profile
export const fetchUserProfile = createAsyncThunk(
  "settings/fetchProfile",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.get("/auth/me");
      const userData = response.data.data || response.data;
      
      const formattedUser = {
        name: userData.name || userData.employee?.name,
        email: userData.email,
        username: userData.username,
        ...userData
      };
      
      // Dispatch action to update auth state
      dispatch({
        type: "auth/updateUser",
        payload: formattedUser
      });
      
      return formattedUser;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch profile"
      );
    }
  }
);

const initialState = {
  profile: null,
  loading: false,
  error: null,
  updateSuccess: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearUpdateSuccess: (state) => {
      state.updateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.updateSuccess = true;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.updateSuccess = false;
      })
      
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.updateSuccess = true;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearUpdateSuccess } = settingsSlice.actions;
export default settingsSlice.reducer;