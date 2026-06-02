import React from "react";
import { FiCheck } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { setStep } from "../../store/slices/onboardingSlice";

const Stepper = ({ currentStep }) => {
  const dispatch = useDispatch();

  const steps = [
    { id: 1, title: "Resume Upload", subtitle: "AI Parsing" },
    { id: 2, title: "Employee Details", subtitle: "Verify Info" },
    { id: 3, title: "Salary & Bank", subtitle: "Financials" },
    { id: 4, title: "Offer Letter", subtitle: "Generation" },
    { id: 5, title: "Review & Submit", subtitle: "Finalization" },
  ];

  const handleStepClick = (stepId) => {
    // Allow navigation only to steps that are completed or the next logical step
    // Don't allow skipping ahead to unreached steps
    if (stepId <= currentStep + 1 || stepId <= currentStep) {
      dispatch(setStep(stepId));
    }
  };

  const canNavigateToStep = (stepId) => {
    // Can navigate to current step, previous steps, or next step only
    return stepId <= currentStep + 1;
  };

  return (
    <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* Step Item */}
          <div 
            className="flex flex-col items-center relative z-10"
            onClick={() => canNavigateToStep(step.id) && handleStepClick(step.id)}
            style={{ cursor: canNavigateToStep(step.id) ? 'pointer' : 'not-allowed' }}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                currentStep > step.id
                  ? "bg-green-600 border-green-600 text-white shadow-sm shadow-green-500/20"
                  : currentStep === step.id
                  ? "bg-white dark:bg-gray-800 border-green-600 text-green-600 ring-4 ring-green-50 dark:ring-green-950/30"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400"
              } ${canNavigateToStep(step.id) ? 'hover:scale-105 hover:shadow-md' : 'opacity-60'}`}
            >
              {currentStep > step.id ? (
                <FiCheck size={20} strokeWidth={3} />
              ) : (
                <span className="font-bold">{step.id}</span>
              )}
            </div>
            
            <div className="mt-3 text-center">
              <p className={`text-sm font-semibold transition-colors ${
                currentStep >= step.id ? "text-gray-900 dark:text-white" : "text-gray-400"
              }`}>
                {step.title}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                {step.subtitle}
              </p>
            </div>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-4 -mt-10 bg-gray-100 dark:bg-gray-700">
              <div 
                className="h-full bg-green-600 transition-all duration-500 ease-in-out" 
                style={{ width: currentStep > step.id ? "100%" : "0%" }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Stepper;