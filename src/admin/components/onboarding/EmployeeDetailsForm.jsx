/* eslint-disable react-hooks/static-components */
import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { FiEdit3, FiInfo, FiChevronRight, FiChevronLeft, FiSave } from "react-icons/fi";
import { setStep, updateEmployeeDetails, resetOnboarding } from "../../store/slices/onboardingSlice";
import { showToast } from "../../components/common/Toast";
import DateInput from "../common/DateInput";

const EmployeeDetailsForm = () => {
  const dispatch = useDispatch();
  const onboardingState = useSelector((state) => state.onboarding) || {};
  const { employeeDetails = {} } = onboardingState;

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: employeeDetails,
  });

  // Re-initialize form whenever Redux parsed data changes (e.g. after AI resume parsing)
  // Using reset() ensures ALL fields including phone are properly populated
  useEffect(() => {
    if (employeeDetails && Object.keys(employeeDetails).length > 0) {
      reset(employeeDetails);
    }
  }, [employeeDetails, reset]);

  const onSubmit = (data) => {
    dispatch(updateEmployeeDetails(data));
    dispatch(setStep(3));
  };

  const handleBack = () => {
    dispatch(resetOnboarding());
  };

  const handleSaveDraft = () => {
    const currentData = getValues();
    const draftState = {
      ...onboardingState,
      employeeDetails: { ...onboardingState.employeeDetails, ...currentData }
    };
    localStorage.setItem("onboarding-draft", JSON.stringify(draftState));
    showToast("Draft saved successfully!", "success");
  };

  const InputField = ({ label, name, type = "text", placeholder, options = null }) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative group">
        {options ? (
          <select
            {...register(name, { required: `${label} is required` })}
            className={`w-full px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-gray-900 dark:text-white transition-all duration-200 outline-none ${errors[name]
              ? "border-red-500 focus:ring-4 focus:ring-red-500/10"
              : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
              }`}
          >
            <option value="">Select {label}</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input
            type={type}
            placeholder={placeholder}
            {...register(name, { required: `${label} is required` })}
            className={`w-full px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-gray-900 dark:text-white transition-all duration-200 outline-none ${errors[name]
              ? "border-red-500 focus:ring-4 focus:ring-red-500/10"
              : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
              }`}
          />
        )}
      </div>
      {errors[name] && (
        <p className="text-xs font-medium text-red-500 mt-1">{errors[name].message}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Form Header */}
          <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl flex items-center justify-center">
                <FiInfo size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verify Employee Details</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Data auto-extracted from resume</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
            >
              <FiSave size={16} />
              Save Draft
            </button>
          </div>

          {/* Form Body */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <InputField label="Full Name" name="fullName" placeholder="Enter full name" />
            <InputField label="Email Address" name="email" type="email" placeholder="email@example.com" />
            <InputField label="Phone Number" name="phone" placeholder="+971 -- --- ----" />
            <InputField
              label="Nationality"
              name="nationality"
              options={["United Arab Emirates", "India", "Pakistan", "United Kingdom", "United States", "Philippines"]}
            />
            <div className="md:col-span-2">
              <InputField label="Current Address" name="address" placeholder="Residential address" />
            </div>
            <InputField label="Designation" name="designation" placeholder="e.g. Project Manager" />
            <InputField
              label="Department"
              name="department"
              options={["Engineering", "Human Resources", "Marketing", "Sales", "Finance", "Operations"]}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Joining Date
              </label>
              <Controller
                name="joiningDate"
                control={control}
                rules={{ required: "Joining Date is required" }}
                render={({ field }) => (
                  <DateInput
                    {...field}
                    type="joining"
                    placeholder="dd/mm/yyyy"
                    error={!!errors.joiningDate}
                    className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700 !rounded-xl !text-gray-900 dark:!text-white !px-4 !py-2.5 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                  />
                )}
              />
              {errors.joiningDate && (
                <p className="text-xs font-medium text-red-500 mt-1">{errors.joiningDate.message}</p>
              )}
            </div>
            <InputField label="Experience Level" name="experience" placeholder="e.g. 5 Years" />
            <div className="md:col-span-2">
              <InputField label="Key Skills" name="skills" placeholder="React, Tailwind, Node.js etc." />
            </div>
            <div className="md:col-span-2">
              <InputField label="Highest Education" name="education" placeholder="University Degree etc." />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Special Day Event
              </label>
              <input
                type="text"
                placeholder="e.g. Birthday, Work Anniversary"
                {...register("specialDayEvent")}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white transition-all duration-200 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                list="special-days-suggestions"
              />
              <datalist id="special-days-suggestions">
                <option value="Birthday" />
                <option value="Work Anniversary" />
                <option value="Wedding Anniversary" />
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Special Day Date
              </label>
              <Controller
                name="specialDayDate"
                control={control}
                render={({ field }) => (
                  <DateInput
                    {...field}
                    type="special_day"
                    placeholder="dd/mm/yyyy"
                    error={!!errors.specialDayDate}
                    className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700 !rounded-xl !text-gray-900 dark:!text-white !px-4 !py-2.5 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                  />
                )}
              />
              {errors.specialDayDate && (
                <p className="text-xs font-medium text-red-500 mt-1">{errors.specialDayDate.message}</p>
              )}
            </div>
          </div>

          {/* Form Footer */}
          <div className="px-8 py-6 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-2.5 font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FiChevronLeft size={20} />
              Back
            </button>

            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            >
              Continue
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EmployeeDetailsForm;

