// store/slices/publicHolidaysSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

// Fetch all public holidays
export const fetchPublicHolidays = createAsyncThunk(
  "publicHolidays/fetchPublicHolidays",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/admin/public-holidays");
      console.log("Public holidays response:", res.data);
      return res.data?.data || res.data || [];
    } catch (err) {
      console.error("Fetch public holidays error:", err);
      return rejectWithValue(err.response?.data?.message || "Failed to fetch public holidays");
    }
  }
);

// Add a public holiday
export const addPublicHoliday = createAsyncThunk(
  "publicHolidays/addPublicHoliday",
  async (holidayData, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/admin/public-holidays", holidayData);
      console.log("Add public holiday response:", res.data);
      return res.data?.data || res.data;
    } catch (err) {
      console.error("Add public holiday error:", err);
      return rejectWithValue(err.response?.data?.message || "Failed to add public holiday");
    }
  }
);

// Update a public holiday
export const updatePublicHoliday = createAsyncThunk(
  "publicHolidays/updatePublicHoliday",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/admin/public-holidays/${id}`, data);
      console.log("Update public holiday response:", res.data);
      return res.data?.data || res.data;
    } catch (err) {
      console.error("Update public holiday error:", err);
      return rejectWithValue(err.response?.data?.message || "Failed to update public holiday");
    }
  }
);

// Delete a public holiday
export const deletePublicHoliday = createAsyncThunk(
  "publicHolidays/deletePublicHoliday",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/admin/public-holidays/${id}`);
      return id;
    } catch (err) {
      console.error("Delete public holiday error:", err);
      return rejectWithValue(err.response?.data?.message || "Failed to delete public holiday");
    }
  }
);

const initialState = {
  holidays: [],
  loading: false,
  error: null,
};

const publicHolidaysSlice = createSlice({
  name: "publicHolidays",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch holidays
      .addCase(fetchPublicHolidays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicHolidays.fulfilled, (state, action) => {
        state.loading = false;
        state.holidays = action.payload;
      })
      .addCase(fetchPublicHolidays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add holiday
      .addCase(addPublicHoliday.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPublicHoliday.fulfilled, (state, action) => {
        state.loading = false;
        state.holidays.push(action.payload);
      })
      .addCase(addPublicHoliday.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update holiday
      .addCase(updatePublicHoliday.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePublicHoliday.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.holidays.findIndex((h) => h.id === action.payload.id);
        if (index !== -1) {
          state.holidays[index] = action.payload;
        }
      })
      .addCase(updatePublicHoliday.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete holiday
      .addCase(deletePublicHoliday.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePublicHoliday.fulfilled, (state, action) => {
        state.loading = false;
        state.holidays = state.holidays.filter((h) => h.id !== action.payload);
      })
      .addCase(deletePublicHoliday.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = publicHolidaysSlice.actions;
export default publicHolidaysSlice.reducer;