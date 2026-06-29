// src/admin/store/slices/onboardingSlice.js

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
        fileName: file.name,
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to parse resume");
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// SALARY PACKAGES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET api/admin/employees/salary-packages
 * Fetch all available salary packages
 */
export const fetchSalaryPackages = createAsyncThunk(
  "onboarding/fetchSalaryPackages",
  async (_, { rejectWithValue }) => {
    try {
      const response = await onboardingService.getSalaryPackages();
      return response.data || response;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch salary packages",
      );
    }
  },
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
      return rejectWithValue(
        error.message || "Failed to save employee details",
      );
    }
  },
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
      return rejectWithValue(
        error.message || "Failed to save salary structure",
      );
    }
  },
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
  },
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
  },
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
  },
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
  },
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
      return rejectWithValue(
        error.message || "Failed to update salary component",
      );
    }
  },
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
      return rejectWithValue(
        error.message || "Failed to delete salary component",
      );
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: SANITIZE PACKAGES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sanitize packages to ensure currency is a string and all data is properly formatted
 */
const sanitizePackages = (packages) => {
  if (!packages) return null;

  const sanitized = { ...packages };

  ["package1", "package2"].forEach((key) => {
    if (sanitized[key]) {
      // Ensure currency is a string
      if (
        sanitized[key].currency &&
        typeof sanitized[key].currency !== "string"
      ) {
        sanitized[key].currency = String(sanitized[key].currency);
      }
      // Ensure isSaved is a boolean
      if (sanitized[key].isSaved !== undefined) {
        sanitized[key].isSaved = Boolean(sanitized[key].isSaved);
      }
      // Ensure salaryComponents is an array
      if (!Array.isArray(sanitized[key].salaryComponents)) {
        sanitized[key].salaryComponents = [];
      }
      // Sanitize each component
      sanitized[key].salaryComponents = sanitized[key].salaryComponents.map(
        (comp) => ({
          ...comp,
          id: String(comp.id || Date.now()),
          name: String(comp.name || ""),
          price:
            typeof comp.price === "number"
              ? comp.price
              : parseFloat(comp.price) || 0,
        }),
      );
      // Ensure totalSalary is a number
      if (sanitized[key].totalSalary !== undefined) {
        sanitized[key].totalSalary =
          typeof sanitized[key].totalSalary === "number"
            ? sanitized[key].totalSalary
            : parseFloat(sanitized[key].totalSalary) || 0;
      }
      // Ensure packageId is preserved
      if (sanitized[key].packageId !== undefined) {
        sanitized[key].packageId = sanitized[key].packageId;
      }
    }
  });

  return sanitized;
};

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
  // Available salary packages from API
  availablePackages: [],
  packagesLoading: false,
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
    paymentCycle: "Monthly",
    // Two salary packages
    packages: {
      package1: {
        id: "package1",
        name: "Home Country / WFH",
        currency: "AED",
        salaryComponents: [],
        isSaved: false,
        totalSalary: 0,
        packageId: null, // Store the API package ID
      },
      package2: {
        id: "package2",
        name: "Dubai Onsite",
        currency: "AED",
        salaryComponents: [],
        isSaved: false,
        totalSalary: 0,
        packageId: null,
      },
    },
    bankAccounts: [],
  },
  offerLetter: {
    content: "",
    template: "standard",
    generated: false,
  },
  onboardingComplete: false,
};

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setStep: (state, action) => {
      state.currentStep = action.payload;
    },
    updateEmployeeDetails: (state, action) => {
      const payload = { ...action.payload };

      // Sanitize packages if they exist in the payload
      if (payload.packages) {
        payload.packages = sanitizePackages(payload.packages);
      }

      // Sanitize bank accounts if they exist
      if (payload.bankAccounts && Array.isArray(payload.bankAccounts)) {
        payload.bankAccounts = payload.bankAccounts.map((bank) => ({
          ...bank,
          id: String(bank.id || Date.now()),
          bankName: String(bank.bankName || ""),
          accountNumber: String(bank.accountNumber || ""),
          bankCountry: String(bank.bankCountry || "UAE"),
          bankIfsc: String(bank.bankIfsc || ""),
          bankBranch: String(bank.bankBranch || ""),
          bankIban: String(bank.bankIban || ""),
          bankSwift: String(bank.bankSwift || ""),
        }));
      }

      state.employeeDetails = {
        ...state.employeeDetails,
        ...payload,
      };
    },
    updateOfferLetter: (state, action) => {
      state.offerLetter = { ...state.offerLetter, ...action.payload };
    },
    resetOnboarding: () => {
      localStorage.removeItem("onboarding-draft");
      return initialState;
    },
    completeOnboarding: (state) => {
      state.onboardingComplete = true;
    },
    restoreDraft: (state, action) => {
      const draft = action.payload;
      if (draft.employeeDetails) {
        const details = { ...draft.employeeDetails };
        if (details.packages) {
          // Ensure icon is stored as name, not object
          ["package1", "package2"].forEach((key) => {
            if (details.packages[key]) {
              // Remove any icon object that might have been stored
              delete details.packages[key].icon;
              // Ensure iconName exists
              if (!details.packages[key].iconName) {
                details.packages[key].iconName =
                  key === "package1" ? "FiHome" : "FiMapPin";
              }
              // Ensure currency is a string
              if (
                details.packages[key].currency &&
                typeof details.packages[key].currency !== "string"
              ) {
                details.packages[key].currency = String(
                  details.packages[key].currency,
                );
              }
              // Ensure packageId is preserved
              if (details.packages[key].packageId !== undefined) {
                details.packages[key].packageId = details.packages[key].packageId;
              }
            }
          });
        }
        state.employeeDetails = details;
      }
      if (draft.currentStep) {
        state.currentStep = draft.currentStep;
      }
      if (draft.resumeData) {
        state.resumeData = draft.resumeData;
      }
      if (draft.savedEmployeeId) {
        state.savedEmployeeId = draft.savedEmployeeId;
      }
    },
    clearOnboardingError: (state) => {
      state.error = null;
    },
    clearPackages: (state) => {
      state.availablePackages = [];
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
        state.employeeDetails = { ...state.employeeDetails, ...action.payload };
        state.currentStep = 2; // Auto-move to step 2 after parsing
      })
      .addCase(parseResume.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Fetch Salary Packages ──────────────────────────────────────────────
      .addCase(fetchSalaryPackages.pending, (state) => {
        state.packagesLoading = true;
        state.error = null;
      })
      .addCase(fetchSalaryPackages.fulfilled, (state, action) => {
        state.packagesLoading = false;
        state.availablePackages = action.payload;
        
        // Auto-map packages to package1 and package2
        if (Array.isArray(action.payload) && action.payload.length >= 2) {
          const pkg1 = action.payload[0];
          const pkg2 = action.payload[1];
          
          if (pkg1) {
            state.employeeDetails.packages.package1.packageId = pkg1.id;
            state.employeeDetails.packages.package1.name = pkg1.name;
          }
          if (pkg2) {
            state.employeeDetails.packages.package2.packageId = pkg2.id;
            state.employeeDetails.packages.package2.name = pkg2.name;
          }
        }
      })
      .addCase(fetchSalaryPackages.rejected, (state, action) => {
        state.packagesLoading = false;
        state.error = action.payload;
      })

      // ── Save Details ────────────────────────────────────────────────────────
      .addCase(saveOnboardingDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveOnboardingDetails.fulfilled, (state, action) => {
        state.isLoading = false;
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
        if (Array.isArray(state.employeeDetails.bankAccounts)) {
          state.employeeDetails.bankAccounts =
            state.employeeDetails.bankAccounts.filter(
              (b) => String(b.id) !== String(action.payload),
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
        // Check both packages for the component to delete
        if (state.employeeDetails.packages) {
          ["package1", "package2"].forEach((key) => {
            if (
              state.employeeDetails.packages[key] &&
              Array.isArray(
                state.employeeDetails.packages[key].salaryComponents,
              )
            ) {
              state.employeeDetails.packages[key].salaryComponents =
                state.employeeDetails.packages[key].salaryComponents.filter(
                  (c) => String(c.id) !== String(action.payload),
                );
            }
          });
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
  clearPackages,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;