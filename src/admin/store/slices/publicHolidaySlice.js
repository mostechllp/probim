// store/slices/publicHolidaysSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

// Fetch all public holidays
export const fetchPublicHolidays = createAsyncThunk(
  "publicHolidays/fetchPublicHolidays",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/admin/holidays");
      
      let holidaysData = [];
      
      // Handle the actual response structure: { success: true, data: { data: [...] } }
      if (res.data?.success && res.data?.data?.data && Array.isArray(res.data.data.data)) {
        holidaysData = res.data.data.data;
      } 
      // Handle: { success: true, data: [...] }
      else if (res.data?.success && res.data?.data && Array.isArray(res.data.data)) {
        holidaysData = res.data.data;
      }
      // Handle: { data: [...] }
      else if (res.data?.data && Array.isArray(res.data.data)) {
        holidaysData = res.data.data;
      }
      // Handle: [...] (direct array)
      else if (Array.isArray(res.data)) {
        holidaysData = res.data;
      }
      // Handle: { success: true, data: { data: [...] } } without success field
      else if (res.data?.data?.data && Array.isArray(res.data.data.data)) {
        holidaysData = res.data.data.data;
      }
      return holidaysData;
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
      const payload = {
        title: holidayData.name,
        holiday_date: holidayData.date,
        description: holidayData.description || "",
        is_optional: holidayData.is_optional || false,
      };
      
      const res = await apiClient.post("/admin/holidays", payload);
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
      const payload = {
        title: data.name,
        holiday_date: data.date,
        description: data.description || "",
        is_optional: data.is_optional || false,
      };
      
      const res = await apiClient.put(`/admin/holidays/${id}`, payload);
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
      await apiClient.delete(`/admin/holidays/${id}`);
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
        const rawHolidays = action.payload || [];
        
        state.holidays = rawHolidays.map((holiday) => {
          // Extract date without time
          let dateStr = '';
          if (holiday.holiday_date) {
            // Handle both "2026-08-07T00:00:00.000000Z" and "2026-08-07"
            dateStr = holiday.holiday_date.includes('T') 
              ? holiday.holiday_date.split('T')[0] 
              : holiday.holiday_date;
          }
          
          const transformed = {
            id: holiday.id,
            name: holiday.title,
            date: dateStr,
            description: holiday.description || "",
            is_optional: holiday.is_optional || false,
            raw: holiday,
          };
          return transformed;
        });
      })
      .addCase(fetchPublicHolidays.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        console.error("Fetch holidays rejected:", action.payload);
      })
      // Add holiday
      .addCase(addPublicHoliday.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPublicHoliday.fulfilled, (state, action) => {
        state.loading = false;
        const holiday = action.payload;
        if (holiday) {
          let dateStr = '';
          if (holiday.holiday_date) {
            dateStr = holiday.holiday_date.includes('T') 
              ? holiday.holiday_date.split('T')[0] 
              : holiday.holiday_date;
          }
          
          state.holidays.push({
            id: holiday.id,
            name: holiday.title,
            date: dateStr,
            description: holiday.description || "",
            is_optional: holiday.is_optional || false,
            raw: holiday,
          });
        }
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
        const holiday = action.payload;
        if (holiday) {
          const index = state.holidays.findIndex((h) => h.id === holiday.id);
          if (index !== -1) {
            let dateStr = '';
            if (holiday.holiday_date) {
              dateStr = holiday.holiday_date.includes('T') 
                ? holiday.holiday_date.split('T')[0] 
                : holiday.holiday_date;
            }
            
            state.holidays[index] = {
              id: holiday.id,
              name: holiday.title,
              date: dateStr,
              description: holiday.description || "",
              is_optional: holiday.is_optional || false,
              raw: holiday,
            };
          }
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