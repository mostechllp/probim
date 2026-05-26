import  { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiCheck } from "react-icons/fi";
import { resetOnboarding, restoreDraft } from "../store/slices/onboardingSlice";
import ResumeUpload from "../components/onboarding/ResumeUpload";
import EmployeeDetailsForm from "../components/onboarding/EmployeeDetailsForm";
import SalaryBankDetailsForm from "../components/onboarding/SalaryBankDetailsForm";
import OfferLetterPreview from "../components/onboarding/OfferLetterPreview";
import OnboardingReview from "../components/onboarding/OnboardingReview";
import Stepper from "../components/onboarding/Stepper";

const Onboarding = () => {

  const onboardingState = useSelector((state) => state.onboarding) || {};
  const { currentStep = 1, onboardingComplete = false } = onboardingState;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Handle restoring draft on mount
  useEffect(() => {
    const draft = localStorage.getItem("onboarding-draft");
    // Only restore if we are at step 1 and haven't parsed a resume yet
    if (draft && currentStep === 1 && !onboardingState.resumeData) {
      try {
        const parsedDraft = JSON.parse(draft);
        dispatch(restoreDraft(parsedDraft));
      } catch (err) {
        console.error("Failed to restore onboarding draft:", err);
      }
    }
  }, [dispatch, currentStep, onboardingState.resumeData]);

  useEffect(() => {
    if (onboardingComplete) {
      localStorage.removeItem("onboarding-draft"); // Clear draft on completion
      dispatch(resetOnboarding());
      navigate("/admin/employees");
    }
  }, [onboardingComplete, dispatch, navigate]);


  const renderStep = () => {
    if (onboardingComplete) {
      return (
        <div className="flex flex-col items-center justify-center py-32 animate-fadeIn">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-gray-100 dark:border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading employee directory...</p>
        </div>
      );
    }
    
    switch (currentStep) {
      case 1:
        return <ResumeUpload />;
      case 2:
        return <EmployeeDetailsForm />;
      case 3:
        return <SalaryBankDetailsForm />;
      case 4:
        return <OfferLetterPreview />;
      case 5:
        return <OnboardingReview />;
      default:
        return <ResumeUpload />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full">
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

export default Onboarding;
