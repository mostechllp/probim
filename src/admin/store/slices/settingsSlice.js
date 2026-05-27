import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

export const updateProfile = createAsyncThunk(
  "settings/updateProfile",
  async ({ formData, constructedAvatarUrl }, { rejectWithValue, dispatch }) => {
    console.log("=== updateProfile thunk called ===");
    
    try {
      const isFormData = formData instanceof FormData;
      const headers = isFormData ? { "Content-Type": "multipart/form-data" } : {};
      
      const response = await apiClient.post("/employee/update-profile", formData, { headers });
      
      console.log("Update successful:", response.data);
      
      // Get the updated user data from the response
      const responseData = response.data.data || response.data;
      const updatedUser = responseData.user || responseData;
      
      // Use the constructed avatar URL if the backend didn't return one
      let avatarUrl = updatedUser.avatar;
      
      if (!avatarUrl && constructedAvatarUrl) {
        avatarUrl = constructedAvatarUrl;
        console.log("📸 Using constructed avatar URL:", avatarUrl);
      }
      
      const userData = {
        id: updatedUser.id,
        name: updatedUser.name || updatedUser.employee?.name,
        email: updatedUser.email,
        username: updatedUser.username,
        avatar: avatarUrl,
        type: updatedUser.type,
        role: updatedUser.role,
        employee: updatedUser.employee,
        ...updatedUser
      };
      
      console.log("Final userData with avatar:", userData.avatar);
      
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
      console.log("=== CALLING /auth/me ===");
      const response = await apiClient.get("/auth/me");
      
      console.log("=== RAW /auth/me RESPONSE ===");
      console.log("Response data:", response.data);
      
      // Extract the user data correctly
      const responseData = response.data.data || response.data;
      
      // The user data is inside the 'user' property
      const userData = responseData.user || responseData;
      
      console.log("Extracted user data:", userData);
      console.log("User avatar:", userData.avatar);
      
      const formattedUser = {
        id: userData.id,
        name: userData.name || userData.employee?.name,
        email: userData.email,
        username: userData.username,
        avatar: userData.avatar,  // Now this will have the correct value
        type: userData.type,
        role: userData.role,
        employee: userData.employee,
        permissions: userData.permissions,
        ...userData
      };
      
      console.log("Formatted user with avatar:", formattedUser.avatar);
      
      // Dispatch action to update auth state
      dispatch({
        type: "auth/updateUser",
        payload: formattedUser
      });
      
      return formattedUser;
    } catch (error) {
      console.error("Fetch profile error:", error);
      console.error("Error response:", error.response?.data);
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