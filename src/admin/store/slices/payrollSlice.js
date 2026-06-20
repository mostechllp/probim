import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

// Fetch draft payroll for an employee
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

// Save step data (for each tab/step in the payroll form)
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

// Submit and finalize the payroll
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

// Get history of completed payrolls
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

// Get specific payroll by ID (if you need this)
export const fetchPayrollById = createAsyncThunk(
  "payroll/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/admin/payroll/${id}`);
      console.log("Fetch payroll by ID response:", response.data);
      
      if (response.data?.success === true) {
        return response.data.data;
      }
      return rejectWithValue(response.data?.message || "Failed to fetch payroll");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch payroll"
      );
    }
  }
);

// Delete payroll (if needed)
export const deletePayroll = createAsyncThunk(
  "payroll/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/admin/payroll/${id}`);
      console.log("Delete payroll response:", response.data);
      
      if (response.data?.success === true) {
        return id;
      }
      return rejectWithValue(response.data?.message || "Failed to delete payroll");
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete payroll"
      );
    }
  }
);

// Save entire payroll as draft (if you need a bulk save)
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
      return rejectWithValue(
        error.response?.data?.message || "Failed to save draft"
      );
    }
  }
);

const initialState = {
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
      state.historyPagination.currentPage = 1; // Reset to first page on filter change
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
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch Draft Payroll
      .addCase(fetchDraftPayroll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDraftPayroll.fulfilled, (state, action) => {
        state.loading = false;
        state.draftData = action.payload;
        // If draft has step data, populate it
        if (action.payload?.step_data) {
          state.stepData = action.payload.step_data;
        }
      })
      .addCase(fetchDraftPayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Save Step
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
      
      // Submit Payroll
      .addCase(submitPayroll.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitPayroll.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.submittedPayroll = action.payload;
        state.successMessage = "Payroll submitted successfully! Payslip has been generated and emailed.";
        // Clear step data after successful submission
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
      
      // Fetch History
      .addCase(fetchPayrollHistory.pending, (state) => {
        state.historyLoading = true;
        state.error = null;
      })
      .addCase(fetchPayrollHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload;
        // If pagination data is provided
        if (action.payload?.pagination) {
          state.historyPagination.total = action.payload.pagination.total;
          state.historyPagination.currentPage = action.payload.pagination.current_page;
          state.historyPagination.perPage = action.payload.pagination.per_page;
        }
      })
      .addCase(fetchPayrollHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Payroll by ID
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
      
      // Delete Payroll
      .addCase(deletePayroll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePayroll.fulfilled, (state, action) => {
        state.loading = false;
        state.history = state.history.filter(p => p.id !== action.payload);
        state.successMessage = "Payroll deleted successfully";
      })
      .addCase(deletePayroll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Save Draft Payroll
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

// Export actions
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
} = payrollSlice.actions;

// Export selectors
export const selectPayrollState = (state) => state.payroll;
export const selectCurrentStep = (state) => state.payroll.currentStep;
export const selectStepData = (state) => state.payroll.stepData;
export const selectStepDataByStep = (step) => (state) => state.payroll.stepData[step];
export const selectDraftData = (state) => state.payroll.draftData;
export const selectPayrollHistory = (state) => state.payroll.history;
export const selectPayrollHistoryPagination = (state) => state.payroll.historyPagination;
export const selectPayrollHistoryFilters = (state) => state.payroll.historyFilters;
export const selectCurrentPayroll = (state) => state.payroll.currentPayroll;
export const selectSubmittedPayroll = (state) => state.payroll.submittedPayroll;
export const selectPayrollLoading = (state) => state.payroll.loading;
export const selectPayrollSaving = (state) => state.payroll.saving;
export const selectPayrollIsSubmitting = (state) => state.payroll.isSubmitting;
export const selectPayrollError = (state) => state.payroll.error;
export const selectPayrollSuccess = (state) => state.payroll.successMessage;
export const selectCompletedSteps = (state) => state.payroll.completedSteps;
export const selectIsStepCompleted = (step) => (state) => state.payroll.completedSteps.includes(step);

export default payrollSlice.reducer;