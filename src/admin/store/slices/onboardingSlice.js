import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { parseResumeTextWithAI } from "../../utils/openRouterService";
import { extractTextFromFile } from "../../utils/fileExtractor";

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


const initialState = {
  currentStep: 1,
  isLoading: false,
  error: null,
  resumeData: null,
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
    }
  },
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export const { 
  setStep, 
  updateEmployeeDetails, 
  updateOfferLetter, 
  resetOnboarding,
  completeOnboarding,
  restoreDraft
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
