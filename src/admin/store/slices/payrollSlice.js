// src/admin/store/slices/payrollSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

// ─── Fetch Payroll List ────────────────────────────────────────────────
export const fetchPayrolls = createAsyncThunk(
  "payroll/fetchPayrolls",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/payrolls", { params });
      console.log("Fetch payrolls response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Fetch payrolls error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch payrolls"
      );
    }
  }
);

// ─── Delete Payroll ────────────────────────────────────────────────────
export const deletePayroll = createAsyncThunk(
  "payroll/deletePayroll",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/admin/payrolls/${id}`);
      console.log("Delete payroll response:", response.data);
      
      if (response.data?.success === true) {
        return id;
      }
      return rejectWithValue(response.data?.message || "Failed to delete payroll");
    } catch (error) {
      console.error("Delete payroll error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete payroll"
      );
    }
  }
);

// ─── Generate Payslip ──────────────────────────────────────────────────
export const generatePayslip = createAsyncThunk(
  "payroll/generatePayslip",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/admin/payrolls/${id}/payslip`);
      console.log("Generate payslip response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Generate payslip error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to generate payslip"
      );
    }
  }
);

// ─── Fetch Payroll by ID ──────────────────────────────────────────────
export const fetchPayrollById = createAsyncThunk(
  "payroll/fetchPayrollById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/admin/payrolls/${id}`);
      console.log("Fetch payroll by ID response:", response.data);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Fetch payroll by ID error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch payroll"
      );
    }
  }
);

// ─── Fetch Draft Payroll ──────────────────────────────────────────────
export const fetchDraftPayroll = createAsyncThunk(
  "payroll/fetchDraft",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/admin/payroll/draft/${userId}`);
      console.log("Fetch draft payroll response:", response.data);
      
      if (response.data?.success === true) {
        return response.data.data;
      }
      return rejectWithValue(response.data?.message || "Failed to fetch draft payroll");
    } catch (error) {
      console.error("Fetch draft payroll error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch draft payroll"
      );
    }
  }
);

// ─── Save Payroll Step ────────────────────────────────────────────────
export const savePayrollStep = createAsyncThunk(
  "payroll/saveStep",
  async ({ userId, step, stepData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/admin/payroll/save-step", {
        user_id: userId,
        step: step,
        step_data: stepData
      });
      console.log("Save payroll step response:", response.data);
      
      if (response.data?.success === true) {
        return { 
          step, 
          stepData, 
          message: response.data.message,
          data: response.data.data 
        };
      }
      return rejectWithValue(response.data?.message || "Failed to save step data");
    } catch (error) {
      console.error("Save payroll step error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to save step data"
      );
    }
  }
);

// ─── Submit Payroll ────────────────────────────────────────────────────
export const submitPayroll = createAsyncThunk(
  "payroll/submit",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/admin/payroll/submit", {
        user_id: userId
      });
      console.log("Submit payroll response:", response.data);
      
      if (response.data?.success === true) {
        return response.data;
      }
      return rejectWithValue(response.data?.message || "Failed to submit payroll");
    } catch (error) {
      console.error("Submit payroll error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit payroll"
      );
    }
  }
);

// ─── Fetch Payroll History ────────────────────────────────────────────
export const fetchPayrollHistory = createAsyncThunk(
  "payroll/fetchHistory",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/payroll/history", { params });
      console.log("Fetch payroll history response:", response.data);
      
      if (response.data?.success === true) {
        return response.data.data || [];
      }
      return rejectWithValue(response.data?.message || "Failed to fetch payroll history");
    } catch (error) {
      console.error("Fetch payroll history error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch payroll history"
      );
    }
  }
);

// ─── Save Draft Payroll ────────────────────────────────────────────────
export const saveDraftPayroll = createAsyncThunk(
  "payroll/saveDraft",
  async (payrollData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/admin/payroll/draft", payrollData);
      console.log("Save draft payroll response:", response.data);
      
      if (response.data?.success === true) {
        return response.data.data;
      }
      return rejectWithValue(response.data?.message || "Failed to save draft");
    } catch (error) {
      console.error("Save draft payroll error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to save draft"
      );
    }
  }
);

// ─── Get Payroll Stats ────────────────────────────────────────────────
export const fetchPayrollStats = createAsyncThunk(
  "payroll/fetchStats",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/payrolls/stats", { params });
      console.log("Fetch payroll stats response:", response.data);
      return response.data?.data || response.data;
    } catch (error) {
      console.error("Fetch payroll stats error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch payroll stats"
      );
    }
  }
);

// ─── Update Payroll Status ─────────────────────────────────────────────
export const updatePayrollStatus = createAsyncThunk(
  "payroll/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/admin/payrolls/${id}/status`, {
        status
      });
      console.log("Update payroll status response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Update payroll status error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to update payroll status"
      );
    }
  }
);

// ─── Export Payroll Data ───────────────────────────────────────────────
export const exportPayrolls = createAsyncThunk(
  "payroll/export",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/payrolls/export", {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error("Export payrolls error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to export payrolls"
      );
    }
  }
);

const initialState = {
  // List state
  payrolls: [],
  totalCount: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 15,
  
  // Stats
  stats: {
    totalPayrolls: 0,
    totalAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    draftCount: 0,
    failedCount: 0,
  },
  
  // Draft payroll data
  draftData: null,
  
  // Step data storage
  stepData: {
    1: {}, // Basic Info
    2: {}, // Country Split
    3: {}, // Overtime
    4: {}, // Deductions
    5: {}, // Summary
  },
  currentStep: 1,
  isStepSaving: false,
  
  // Submission state
  isSubmitting: false,
  submittedPayroll: null,
  
  // History
  history: [],
  historyLoading: false,
  historyPagination: {
    currentPage: 1,
    perPage: 10,
    total: 0,
  },
  historyFilters: {
    search: '',
    fromDate: '',
    toDate: '',
    status: 'all',
  },
  
  // Current payroll being viewed/edited
  currentPayroll: null,
  
  // Loading & error states
  loading: false,
  actionLoading: false,
  saving: false,
  error: null,
  
  // Success messages
  successMessage: null,
  
  // Track which steps have been completed/saved
  completedSteps: [],
};

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    // Set current step
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },
    
    // Update step data locally
    updateStepData: (state, action) => {
      const { step, data } = action.payload;
      state.stepData[step] = { ...state.stepData[step], ...data };
    },
    
    // Mark step as completed
    markStepCompleted: (state, action) => {
      const step = action.payload;
      if (!state.completedSteps.includes(step)) {
        state.completedSteps.push(step);
      }
    },
    
    // Clear step data
    clearStepData: (state) => {
      state.stepData = {
        1: {},
        2: {},
        3: {},
        4: {},
        5: {},
      };
      state.completedSteps = [];
    },
    
    // Set draft data
    setDraftData: (state, action) => {
      state.draftData = action.payload;
    },
    
    // Set history filters
    setHistoryFilters: (state, action) => {
      state.historyFilters = { ...state.historyFilters, ...action.payload };
      state.historyPagination.currentPage = 1;
    },
    
    // Set history pagination
    setHistoryPagination: (state, action) => {
      state.historyPagination = { ...state.historyPagination, ...action.payload };
    },
    
    // Clear errors
    clearPayrollError: (state) => {
      state.error = null;
    },
    
    // Clear success message
    clearPayrollSuccess: (state) => {
      state.successMessage = null;
    },
    
    // Reset payroll state
    resetPayrollState: (state) => {
      state.draftData = null;
      state.currentPayroll = null;
      state.submittedPayroll = null;
      state.error = null;
      state.successMessage = null;
      state.isSubmitting = false;
      state.stepData = {
        1: {},
        2: {},
        3: {},
        4: {},
        5: {},
      };
      state.completedSteps = [];
      state.currentStep = 1;
    },
    
    // Set current payroll
    setCurrentPayroll: (state, action) => {
      state.currentPayroll = action.payload;
    },
    
    // Clear payroll list
    clearPayrollList: (state) => {
      state.payrolls = [];
      state.totalCount = 0;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // ─── Fetch Payrolls ────────────────────────────────────────────────
      .addCase(fetchPayrolls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrolls.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload?.data || action.payload || {};
        state.payrolls = data.payrolls || data.data || [];
        state.totalCount = data.total || state.payrolls.length;
        state.currentPage = data.current_page || 1;
        state.lastPage = data.last_page || 1;
        state.perPage = data.per_page || 15;
        if (data.stats) {
          state.stats = data.stats;
        }
      })
      .addCase(fetchPayrolls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ─── Delete Payroll ────────────────────────────────────────────────
      .addCase(deletePayroll.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deletePayroll.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.payrolls = state.payrolls.filter(p => p.id !== action.payload);
        state.totalCount = state.payrolls.length;
        state.successMessage = "Payroll deleted successfully";
      })
      .addCase(deletePayroll.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ─── Generate Payslip ──────────────────────────────────────────────
      .addCase(generatePayslip.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(generatePayslip.fulfilled, (state) => {
        state.actionLoading = false;
        state.successMessage = "Payslip generated successfully";
      })
      .addCase(generatePayslip.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ─── Fetch Payroll Stats ───────────────────────────────────────────
      .addCase(fetchPayrollStats.fulfilled, (state, action) => {
        state.stats = action.payload || state.stats;
      })

      // ─── Update Payroll Status ─────────────────────────────────────────
      .addCase(updatePayrollStatus.fulfilled, (state, action) => {
        const updated = action.payload?.data || action.payload;
        if (updated?.id) {
          const index = state.payrolls.findIndex(p => p.id === updated.id);
          if (index !== -1) {
            state.payrolls[index] = { ...state.payrolls[index], ...updated };
          }
        }
      })

      // ─── Fetch Draft Payroll ───────────────────────────────────────────
      .addCase(fetchDraftPayroll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDraftPayroll.fulfilled, (state, action) => {
        state.loading = false;
        state.draftData = action.payload;
        if (action.payload?.step_data) {
          state.stepData = action.payload.step_data;
        }
      })
      .addCase(fetchDraftPayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ─── Save Step ─────────────────────────────────────────────────────
      .addCase(savePayrollStep.pending, (state) => {
        state.isStepSaving = true;
        state.error = null;
      })
      .addCase(savePayrollStep.fulfilled, (state, action) => {
        state.isStepSaving = false;
        const { step, stepData, message } = action.payload;
        state.stepData[step] = { ...state.stepData[step], ...stepData };
        if (!state.completedSteps.includes(step)) {
          state.completedSteps.push(step);
        }
        state.successMessage = message || "Step data saved successfully";
      })
      .addCase(savePayrollStep.rejected, (state, action) => {
        state.isStepSaving = false;
        state.error = action.payload;
      })
      
      // ─── Submit Payroll ────────────────────────────────────────────────
      .addCase(submitPayroll.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitPayroll.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.submittedPayroll = action.payload;
        state.successMessage = "Payroll submitted successfully! Payslip has been generated and emailed.";
        state.stepData = {
          1: {},
          2: {},
          3: {},
          4: {},
          5: {},
        };
        state.completedSteps = [];
        state.currentStep = 1;
      })
      .addCase(submitPayroll.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload;
      })
      
      // ─── Fetch History ──────────────────────────────────────────────────
      .addCase(fetchPayrollHistory.pending, (state) => {
        state.historyLoading = true;
        state.error = null;
      })
      .addCase(fetchPayrollHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        const data = action.payload?.data || action.payload || [];
        state.history = data.history || data || [];
        if (data.pagination) {
          state.historyPagination.total = data.pagination.total;
          state.historyPagination.currentPage = data.pagination.current_page;
          state.historyPagination.perPage = data.pagination.per_page;
        }
      })
      .addCase(fetchPayrollHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload;
      })
      
      // ─── Fetch Payroll by ID ───────────────────────────────────────────
      .addCase(fetchPayrollById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrollById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayroll = action.payload;
      })
      .addCase(fetchPayrollById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ─── Save Draft ────────────────────────────────────────────────────
      .addCase(saveDraftPayroll.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveDraftPayroll.fulfilled, (state, action) => {
        state.saving = false;
        state.draftData = action.payload;
        state.successMessage = "Draft saved successfully";
      })
      .addCase(saveDraftPayroll.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

// ─── Export Actions ──────────────────────────────────────────────────
export const {
  setCurrentStep,
  updateStepData,
  markStepCompleted,
  clearStepData,
  setDraftData,
  setHistoryFilters,
  setHistoryPagination,
  clearPayrollError,
  clearPayrollSuccess,
  resetPayrollState,
  setCurrentPayroll,
  clearPayrollList,
} = payrollSlice.actions;

// ─── Export Selectors ────────────────────────────────────────────────
export const selectPayrollState = (state) => state.payroll;
export const selectPayrolls = (state) => state.payroll.payrolls;
export const selectPayrollStats = (state) => state.payroll.stats;
export const selectPayrollLoading = (state) => state.payroll.loading;
export const selectPayrollActionLoading = (state) => state.payroll.actionLoading;
export const selectPayrollTotalCount = (state) => state.payroll.totalCount;
export const selectPayrollCurrentPage = (state) => state.payroll.currentPage;
export const selectPayrollLastPage = (state) => state.payroll.lastPage;
export const selectPayrollPerPage = (state) => state.payroll.perPage;
export const selectPayrollError = (state) => state.payroll.error;
export const selectPayrollSuccess = (state) => state.payroll.successMessage;

// Step selectors
export const selectCurrentStep = (state) => state.payroll.currentStep;
export const selectStepData = (state) => state.payroll.stepData;
export const selectStepDataByStep = (step) => (state) => state.payroll.stepData[step];
export const selectCompletedSteps = (state) => state.payroll.completedSteps;
export const selectIsStepCompleted = (step) => (state) => state.payroll.completedSteps.includes(step);

// Draft selectors
export const selectDraftData = (state) => state.payroll.draftData;
export const selectPayrollSaving = (state) => state.payroll.saving;
export const selectPayrollIsSubmitting = (state) => state.payroll.isSubmitting;

// History selectors
export const selectPayrollHistory = (state) => state.payroll.history;
export const selectPayrollHistoryLoading = (state) => state.payroll.historyLoading;
export const selectPayrollHistoryPagination = (state) => state.payroll.historyPagination;
export const selectPayrollHistoryFilters = (state) => state.payroll.historyFilters;

// Current payroll selectors
export const selectCurrentPayroll = (state) => state.payroll.currentPayroll;
export const selectSubmittedPayroll = (state) => state.payroll.submittedPayroll;

export default payrollSlice.reducer;