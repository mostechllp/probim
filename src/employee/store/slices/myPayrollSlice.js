import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

export const fetchMyPayrollHistory = createAsyncThunk(
  "myPayroll/fetchMyPayrollHistory",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/employee/payroll/history", { params });
      const responseData = response.data;
      if (responseData?.data && Array.isArray(responseData.data)) {
        return {
          history: responseData.data,
          total: responseData.total || responseData.data.length,
          per_page: responseData.per_page || 10,
        };
      }
      return {
        history: Array.isArray(responseData) ? responseData : responseData?.data || [],
        total: responseData?.total || (Array.isArray(responseData) ? responseData.length : 0),
        per_page: responseData?.per_page || 10,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch payroll history"
      );
    }
  }
);

export const fetchMyPayrollSummary = createAsyncThunk(
  "myPayroll/fetchMyPayrollSummary",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/employee/payroll/summary", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch payroll summary"
      );
    }
  }
);

export const downloadMyPayslip = createAsyncThunk(
  "myPayroll/downloadMyPayslip",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/employee/payroll/${id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `payslip_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return true;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to download payslip"
      );
    }
  }
);

const initialState = {
  history: [],
  summary: null,
  totalCount: 0,
  perPage: 10,
  loading: false,
  error: null,
};

const myPayrollSlice = createSlice({
  name: "myPayroll",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // History
      .addCase(fetchMyPayrollHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyPayrollHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload.history;
        state.totalCount = action.payload.total;
        state.perPage = action.payload.per_page;
      })
      .addCase(fetchMyPayrollHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Summary
      .addCase(fetchMyPayrollSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyPayrollSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload?.data || action.payload || null;
      })
      .addCase(fetchMyPayrollSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default myPayrollSlice.reducer;
