import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { parseResumeTextWithAI } from "../../utils/openRouterService";
import { extractTextFromFile } from "../../utils/fileExtractor";
import onboardingService from "../../services/onboardingService";


// ─────────────────────────────────────────────────────────────────────────────
// RESUME PARSING (existing)
// ─────────────────────────────────────────────────────────────────────────────

// Parse AI resume using file extraction and OpenRouter
export const parseResume = createAsyncThunk(
  "onboarding/parseResume",
  async (file, { rejectWithValue }) => {
    try {
      // 1. Extract text from the file (PDF or DOCX) client-side
      const text = await extractTextFromFile(file);

      // 2. Send extracted text to OpenRouter for AI processing
      const parsedData = await parseResumeTextWithAI(text);

      // 3. Return the sanitized employee details along with filename
      return {
        ...parsedData,
        fileName: file.name
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to parse resume");
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING WIZARD STEPS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST api/admin/onboarding/save-details
 * Save employee personal & professional details (Step 1).
 */
export const saveOnboardingDetails = createAsyncThunk(
  "onboarding/saveDetails",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await onboardingService.saveDetails(payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to save employee details");
    }
  }
);

/**
 * POST api/admin/onboarding/save-salary
 * Save salary structure (Step 2).
 */
export const saveOnboardingSalary = createAsyncThunk(
  "onboarding/saveSalary",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await onboardingService.saveSalary(payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to save salary structure");
    }
  }
);

/**
 * POST api/admin/onboarding/save-banks
 * Save bank account details (Step 3).
 */
export const saveOnboardingBanks = createAsyncThunk(
  "onboarding/saveBanks",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await onboardingService.saveBanks(payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to save bank details");
    }
  }
);

/**
 * POST api/admin/employees/onboard/complete
 * Finalise the onboarding process (Step 4 / Final Review).
 */
export const completeOnboardingAPI = createAsyncThunk(
  "onboarding/completeAPI",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await onboardingService.completeOnboarding(payload);
      return data;
    } catch (error) {
      // Pass the full error object so field-level validation errors reach the UI
      return rejectWithValue(error);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// BANK DETAILS CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUT api/admin/bank-details/{id}
 * Update a saved bank detail record.
 */
export const updateBankDetail = createAsyncThunk(
  "onboarding/updateBankDetail",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await onboardingService.updateBankDetail(id, payload);
      return { id, data };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update bank detail");
    }
  }
);

/**
 * DELETE api/admin/bank-details/{id}
 * Remove a saved bank detail record.
 */
export const deleteBankDetail = createAsyncThunk(
  "onboarding/deleteBankDetail",
  async (id, { rejectWithValue }) => {
    try {
      await onboardingService.deleteBankDetail(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete bank detail");
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SALARY COMPONENTS CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUT api/admin/salary-components/{id}
 * Update a saved salary component record.
 */
export const updateSalaryComponent = createAsyncThunk(
  "onboarding/updateSalaryComponent",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const data = await onboardingService.updateSalaryComponent(id, payload);
      return { id, data };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update salary component");
    }
  }
);

/**
 * DELETE api/admin/salary-components/{id}
 * Remove a saved salary component record.
 */
export const deleteSalaryComponent = createAsyncThunk(
  "onboarding/deleteSalaryComponent",
  async (id, { rejectWithValue }) => {
    try {
      await onboardingService.deleteSalaryComponent(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete salary component");
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────────────────────────────────────────

const initialState = {
  currentStep: 1,
  isLoading: false,
  error: null,
  resumeData: null,
  // Persisted IDs returned by the API after each save step
  savedEmployeeId: null,
  employeeDetails: {
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    address: "",
    designation: "",
    department: "",
    skills: "",
    experience: "",
    education: "",
    joiningDate: "",
    basicSalary: "",
    otherAllowance: "",
    totalMonthlySalary: 0,
    paymentCycle: "Monthly",
    bankName: "",
    accountNumber: "",
    specialDayEvent: "",
    specialDayDate: "",
  },
  offerLetter: {
    content: "",
    template: "standard",
    generated: false
  },
  onboardingComplete: false
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setStep: (state, action) => {
      state.currentStep = action.payload;
    },
    updateEmployeeDetails: (state, action) => {
      state.employeeDetails = { ...state.employeeDetails, ...action.payload };
    },
    updateOfferLetter: (state, action) => {
      state.offerLetter = { ...state.offerLetter, ...action.payload };
    },
    resetOnboarding: () => {
      return initialState;
    },
    completeOnboarding: (state) => {
      state.onboardingComplete = true;
    },
    restoreDraft: (state, action) => {
      return { ...state, ...action.payload };
    },
    clearOnboardingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Resume Parsing ──────────────────────────────────────────────────────
      .addCase(parseResume.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(parseResume.fulfilled, (state, action) => {
        state.isLoading = false;
        state.resumeData = { fileName: action.payload.fileName };
        state.employeeDetails = action.payload;
        state.currentStep = 2; // Auto-move to step 2 after parsing
      })
      .addCase(parseResume.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Save Details ────────────────────────────────────────────────────────
      .addCase(saveOnboardingDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveOnboardingDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        // Persist the employee ID returned by the backend for subsequent steps
        const employeeId = action.payload?.data?.id || action.payload?.id;
        if (employeeId) state.savedEmployeeId = employeeId;
      })
      .addCase(saveOnboardingDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Save Salary ─────────────────────────────────────────────────────────
      .addCase(saveOnboardingSalary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveOnboardingSalary.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(saveOnboardingSalary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Save Banks ──────────────────────────────────────────────────────────
      .addCase(saveOnboardingBanks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveOnboardingBanks.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(saveOnboardingBanks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Complete Onboarding ─────────────────────────────────────────────────
      .addCase(completeOnboardingAPI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeOnboardingAPI.fulfilled, (state) => {
        state.isLoading = false;
        state.onboardingComplete = true;
      })
      .addCase(completeOnboardingAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Update Bank Detail ──────────────────────────────────────────────────
      .addCase(updateBankDetail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBankDetail.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateBankDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Delete Bank Detail ──────────────────────────────────────────────────
      .addCase(deleteBankDetail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteBankDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove the deleted bank from local state if stored in employeeDetails
        if (Array.isArray(state.employeeDetails.bankAccounts)) {
          state.employeeDetails.bankAccounts = state.employeeDetails.bankAccounts.filter(
            (b) => b.id !== action.payload
          );
        }
      })
      .addCase(deleteBankDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Update Salary Component ─────────────────────────────────────────────
      .addCase(updateSalaryComponent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSalaryComponent.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateSalaryComponent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Delete Salary Component ─────────────────────────────────────────────
      .addCase(deleteSalaryComponent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteSalaryComponent.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove the deleted component from local state if stored in employeeDetails
        if (Array.isArray(state.employeeDetails.salaryComponents)) {
          state.employeeDetails.salaryComponents = state.employeeDetails.salaryComponents.filter(
            (c) => c.id !== action.payload
          );
        }
      })
      .addCase(deleteSalaryComponent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setStep,
  updateEmployeeDetails,
  updateOfferLetter,
  resetOnboarding,
  completeOnboarding,
  restoreDraft,
  clearOnboardingError,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
