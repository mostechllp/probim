import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const STEPS = [
  { id: 1, label: "Initiation", subtitle: "Start Process", path: "/admin/employees/offboarding-initiation" },
  { id: 2, label: "Visa Cancel", subtitle: "Visa Processing", path: "/admin/employees/visa-cancellation" },
  { id: 3, label: "Checklist", subtitle: "Verification", path: "/admin/employees/offboarding-checklist" },
  { id: 4, label: "Interview", subtitle: "Exit Session", path: "/admin/employees/exit-interview" },
  { id: 5, label: "Assets", subtitle: "Asset Return", path: "/admin/employees/asset-return" },
  { id: 6, label: "Settlement", subtitle: "Final Payment", path: "/admin/employees/final-settlement" },
  { id: 7, label: "Letters", subtitle: "Clearance", path: "/admin/employees/letters-and-clearance" },
];

const OffboardingHeader = ({ currentStep }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisaRequired, setIsVisaRequired] = useState(true);
  
  // Get offboarding ID from URL or localStorage
  const getOffboardingId = () => {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('id') || localStorage.getItem("offboarding_id");
  };
  
  // Check visa sponsorship status from localStorage or session
  useEffect(() => {
    // Try to get visa sponsorship from localStorage (saved during initiation)
    const savedVisaSponsorship = localStorage.getItem("offboarding_visa_sponsorship");
    const offboardingId = getOffboardingId();
    
    if (savedVisaSponsorship) {
      setIsVisaRequired(savedVisaSponsorship !== "Not Applicable");
    } else if (offboardingId) {
      // You could fetch from API here if needed
      // For now, let's check sessionStorage as fallback
      const sessionVisaStatus = sessionStorage.getItem(`visa_required_${offboardingId}`);
      if (sessionVisaStatus) {
        setIsVisaRequired(sessionVisaStatus === "true");
      }
    }
  }, [location.search]);
  
  // Filter steps based on visa requirement
  const getFilteredSteps = () => {
    if (isVisaRequired) {
      return STEPS;
    } else {
      // If visa is not applicable, remove the Visa Cancel step
      return STEPS.filter(step => step.id !== 2);
    }
  };
  
  const filteredSteps = getFilteredSteps();
  
  // Adjust step mapping for navigation when visa step is removed
  const getAdjustedStepId = (originalStepId) => {
    if (!isVisaRequired) {
      if (originalStepId > 2) {
        return originalStepId - 1;
      }
    }
    return originalStepId;
  };
  
  const canNavigateToStep = (stepId, originalStepId) => {
    // Get the adjusted current step
    const adjustedCurrentStep = getAdjustedStepId(currentStep);
    const adjustedStepId = getAdjustedStepId(originalStepId);
    
    // Can navigate to current step, previous steps, or next step only
    return adjustedStepId <= adjustedCurrentStep + 1;
  };
  
  const handleStepClick = (step, originalStepId) => {
    if (canNavigateToStep(step.id, originalStepId)) {
      navigate(step.path);
    }
  };
  
  // Save visa requirement status when form is submitted
  const saveVisaRequirement = (visaSponsorship, offboardingId) => {
    const isRequired = visaSponsorship !== "Not Applicable";
    setIsVisaRequired(isRequired);
    localStorage.setItem("offboarding_visa_sponsorship", visaSponsorship);
    if (offboardingId) {
      sessionStorage.setItem(`visa_required_${offboardingId}`, isRequired.toString());
    }
  };
  
  // Expose save function to window for access from other components
  React.useEffect(() => {
    window.saveVisaRequirement = saveVisaRequirement;
    return () => {
      delete window.saveVisaRequirement;
    };
  }, []);
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 px-6 py-6 sm:px-8 rounded-2xl shadow-soft">
      {/* Top Bar: Back Button */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/admin/employees/offboarding")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Offboarding Process
          </h2>
        </div>
        
        {/* Optional: Show visa step status indicator */}
        {!isVisaRequired && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
            <EyeOff size={14} className="text-gray-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Visa step skipped (Not Applicable)
            </span>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between w-full">
        {filteredSteps.map((step, index) => {
          // Re-number steps for display when visa step is removed
          const displayStepNumber = !isVisaRequired && step.id > 2 ? step.id - 1 : step.id;
          
          return (
            <React.Fragment key={step.id}>
              {/* Step Item */}
              <div 
                className="flex flex-col items-center relative z-10"
                onClick={() => handleStepClick(step, step.id)}
                style={{ cursor: canNavigateToStep(step.id, step.id) ? 'pointer' : 'not-allowed' }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                    currentStep > (isVisaRequired ? step.id : (step.id > 2 ? step.id - 1 : step.id))
                      ? "bg-green-600 border-green-600 text-white shadow-sm shadow-green-500/20"
                      : currentStep === (isVisaRequired ? step.id : (step.id > 2 ? step.id - 1 : step.id))
                      ? "bg-white dark:bg-gray-800 border-green-600 text-green-600 ring-4 ring-green-50 dark:ring-green-950/30"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400"
                  } ${canNavigateToStep(step.id, step.id) ? 'hover:scale-105 hover:shadow-md' : 'opacity-60'}`}
                >
                  {currentStep > (isVisaRequired ? step.id : (step.id > 2 ? step.id - 1 : step.id)) ? (
                    <CheckCircle2 size={20} strokeWidth={2} />
                  ) : (
                    <span className="font-bold">{displayStepNumber}</span>
                  )}
                </div>
                
                <div className="mt-3 text-center">
                  <p className={`text-sm font-semibold transition-colors ${
                    currentStep >= (isVisaRequired ? step.id : (step.id > 2 ? step.id - 1 : step.id))
                      ? "text-gray-900 dark:text-white" 
                      : "text-gray-400"
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                    {step.subtitle}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < filteredSteps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 -mt-10 bg-gray-100 dark:bg-gray-700">
                  <div 
                    className="h-full bg-green-600 transition-all duration-500 ease-in-out" 
                    style={{ 
                      width: currentStep > (isVisaRequired ? filteredSteps[index].id : 
                        (filteredSteps[index].id > 2 ? filteredSteps[index].id - 1 : filteredSteps[index].id)) 
                        ? "100%" 
                        : "0%" 
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default OffboardingHeader;