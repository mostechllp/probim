// src/admin/pages/Onboarding.jsx

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { FiCheck, FiArrowLeft } from "react-icons/fi";
import { resetOnboarding, restoreDraft, setStep, updateEmployeeDetails } from "../../store/slices/onboardingSlice";
import ResumeUpload from "./ResumeUpload";
import EmployeeDetailsForm from "./EmployeeDetailsForm";
import SalaryBankDetailsForm from "./SalaryBankDetailsForm";
import OfferLetterPreview from "./OfferLetterPreview";
import OnboardingReview from "./OnboardingReview";
import Stepper from "./Stepper";

const InitiateOnboarding = () => {
  const onboardingState = useSelector((state) => state.onboarding) || {};
  const { currentStep = 1, onboardingComplete = false } = onboardingState;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're viewing an existing onboarding
  const onboardingId = location.state?.onboardingId || localStorage.getItem("onboarding_id");
  const isView = location.state?.isView || false;

  // Clear draft when component unmounts (if not completed)
  useEffect(() => {
    return () => {
      // Only clear if not completed
      if (!onboardingComplete) {
        // Don't clear draft on unmount to allow resume
      }
    };
  }, [onboardingComplete]);

  // Handle restoring draft on mount
  useEffect(() => {
    const draft = localStorage.getItem("onboarding-draft");
    // Only restore if we are at step 1 and haven't parsed a resume yet
    if (draft && currentStep === 1 && !onboardingState.resumeData) {
      try {
        const parsedDraft = JSON.parse(draft);
        // Check if draft has valid data before restoring
        if (parsedDraft && Object.keys(parsedDraft).length > 0) {
          dispatch(restoreDraft(parsedDraft));
        }
      } catch (err) {
        console.error("Failed to restore onboarding draft:", err);
        // Clear invalid draft
        localStorage.removeItem("onboarding-draft");
      }
    }
  }, [dispatch, currentStep, onboardingState.resumeData]);

  // If onboardingId is provided, we should load the existing data
  useEffect(() => {
    if (onboardingId) {
      // Store it for later use
      localStorage.setItem("onboarding_id", onboardingId);
    }
  }, [onboardingId]);

  useEffect(() => {
    if (onboardingComplete) {
      localStorage.removeItem("onboarding-draft");
      localStorage.removeItem("onboarding_id");
      dispatch(resetOnboarding());
      navigate("/admin/employees/onboarding");
    }
  }, [onboardingComplete, dispatch, navigate]);

  // Handle skip resume upload
  const handleSkipResume = () => {
    dispatch(setStep(2));
  };

  // Handle back to dashboard
  const handleBack = () => {
    if (window.confirm("Are you sure you want to leave? Your progress will be saved as a draft.")) {
      navigate("/admin/employees/onboarding");
    }
  };

  const renderStep = () => {
    if (onboardingComplete) {
      return (
        <div className="flex flex-col items-center justify-center py-32 animate-fadeIn">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <FiCheck className="text-green-600 dark:text-green-400 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Onboarding Complete!
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Redirecting to dashboard...
          </p>
        </div>
      );
    }
    
    switch (currentStep) {
      case 1:
        return <ResumeUpload onSkip={handleSkipResume} />;
      case 2:
        return <EmployeeDetailsForm />;
      case 3:
        return <SalaryBankDetailsForm />;
      case 4:
        return <OfferLetterPreview />;
      case 5:
        return <OnboardingReview />;
      default:
        return <ResumeUpload onSkip={handleSkipResume} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="mb-4 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-sm font-medium"
      >
        <FiArrowLeft size={16} />
        Back to Onboarding
      </button>

      {/* Stepper Navigation - Hidden on Success */}
      {!onboardingComplete && (
        <div className="mb-10 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
          <Stepper currentStep={currentStep} />
        </div>
      )}

      {/* Step Content */}
      <div className="relative">
        {renderStep()}
      </div>
    </div>
  );
};

export default InitiateOnboarding;