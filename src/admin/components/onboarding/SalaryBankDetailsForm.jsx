import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { FiChevronRight, FiChevronLeft, FiDollarSign, FiCreditCard, FiActivity, FiSave } from "react-icons/fi";
import { setStep, updateEmployeeDetails } from "../../store/slices/onboardingSlice";
import { showToast } from "../../components/common/Toast";

const SalaryBankDetailsForm = () => {
  const dispatch = useDispatch();
  const onboardingState = useSelector((state) => state.onboarding) || {};
  const { employeeDetails = {} } = onboardingState;

  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    defaultValues: {
      basicSalary: employeeDetails.basicSalary || "",
      otherAllowance: employeeDetails.otherAllowance || "",
      totalMonthlySalary: employeeDetails.totalMonthlySalary || 0,
      paymentCycle: employeeDetails.paymentCycle || "Monthly",
      bankName: employeeDetails.bankName || "",
      accountNumber: employeeDetails.accountNumber || "",
    },
    mode: "onChange",
  });

  // Watch basic salary and other allowance to compute total salary in real-time
  const watchBasicSalary = watch("basicSalary");
  const watchOtherAllowance = watch("otherAllowance");

  useEffect(() => {
    const basic = parseFloat(watchBasicSalary) || 0;
    const allowance = parseFloat(watchOtherAllowance) || 0;
    const total = basic + allowance;
    setValue("totalMonthlySalary", total);
  }, [watchBasicSalary, watchOtherAllowance, setValue]);

  const watchTotalSalary = watch("totalMonthlySalary");

  const onSubmit = (data) => {
    dispatch(updateEmployeeDetails(data));
    dispatch(setStep(4));
    showToast("Salary and bank details verified!", "success");
  };

  const handleBack = () => {
    dispatch(setStep(2));
  };

  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    const formValues = {
      basicSalary: watchBasicSalary,
      otherAllowance: watchOtherAllowance,
      totalMonthlySalary: watchTotalSalary,
      paymentCycle: watch("paymentCycle"),
      bankName: watch("bankName"),
      accountNumber: watch("accountNumber"),
    };

    const draftState = {
      ...onboardingState,
      employeeDetails: { ...onboardingState.employeeDetails, ...formValues }
    };

    try {
      localStorage.setItem("onboarding-draft", JSON.stringify(draftState));
      showToast("Draft saved successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save draft", "error");
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn space-y-8 pb-10">
      {/* Page Header */}
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Salary & Bank Details
        </h2>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
          Configure employee salary structure and payment information.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Salary Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700/80 overflow-hidden transition-all">
          <div className="px-6 md:px-8 py-5 border-b border-gray-100 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
                <FiDollarSign size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Salary Information
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Define base compensation and frequency.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-950/40 transition-all border border-green-100 dark:border-green-900/30"
            >
              <FiSave size={16} />
              {isSavingDraft ? "Saving..." : "Save Draft"}
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Salary */}
              <div className="space-y-2">
                <label htmlFor="basicSalary" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Basic Salary <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 dark:text-gray-500 text-sm font-semibold">AED</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    id="basicSalary"
                    placeholder="Enter basic salary"
                    {...register("basicSalary", {
                      required: "Basic salary is required",
                      min: { value: 1, message: "Salary must be greater than 0" },
                      validate: value => !isNaN(parseFloat(value)) || "Must be a valid number",
                    })}
                    className={`w-full pl-14 pr-4 py-3 bg-white dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white transition-all duration-200 outline-none ${
                      errors.basicSalary
                        ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                        : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                    }`}
                  />
                </div>
                {errors.basicSalary && (
                  <p className="text-xs font-semibold text-red-500">{errors.basicSalary.message}</p>
                )}
              </div>

              {/* Other Allowance */}
              <div className="space-y-2">
                <label htmlFor="otherAllowance" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Other Allowance <span className="text-gray-400 text-xs font-medium">(Optional)</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 dark:text-gray-500 text-sm font-semibold">AED</span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    id="otherAllowance"
                    placeholder="Enter additional allowance"
                    {...register("otherAllowance", {
                      min: { value: 0, message: "Allowance cannot be negative" },
                      validate: value => value === "" || !isNaN(parseFloat(value)) || "Must be a valid number",
                    })}
                    className={`w-full pl-14 pr-4 py-3 bg-white dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white transition-all duration-200 outline-none ${
                      errors.otherAllowance
                        ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                        : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                    }`}
                  />
                </div>
                {errors.otherAllowance && (
                  <p className="text-xs font-semibold text-red-500">{errors.otherAllowance.message}</p>
                )}
              </div>

              {/* Total Monthly Salary (Auto-calculated / Read-only) */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Total Monthly Salary
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-green-600 dark:text-green-500 text-sm font-bold">AED</span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={(watchTotalSalary || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    className="w-full pl-14 pr-4 py-3 bg-green-50/40 dark:bg-green-950/15 border border-green-200/60 dark:border-green-900/30 rounded-xl text-green-700 dark:text-green-400 font-bold outline-none cursor-not-allowed select-none transition-all duration-200"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-green-600/70 dark:text-green-500/70">
                    <FiActivity className="animate-pulse" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  Automatically calculated as: Basic Salary + Other Allowance.
                </p>
              </div>

              {/* Payment Cycle */}
              <div className="space-y-2">
                <label htmlFor="paymentCycle" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Payment Cycle <span className="text-red-500">*</span>
                </label>
                <select
                  id="paymentCycle"
                  {...register("paymentCycle", { required: "Payment cycle is required" })}
                  className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white transition-all duration-200 outline-none appearance-none cursor-pointer ${
                    errors.paymentCycle
                      ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    backgroundSize: '16px',
                    paddingRight: '40px'
                  }}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
                {errors.paymentCycle && (
                  <p className="text-xs font-semibold text-red-500">{errors.paymentCycle.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Bank Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700/80 overflow-hidden transition-all">
          <div className="px-6 md:px-8 py-5 border-b border-gray-100 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
              <FiCreditCard size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Bank Details
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Set up employee bank transfer accounts.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bank Name */}
              <div className="space-y-2">
                <label htmlFor="bankName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="bankName"
                  placeholder="Enter bank name"
                  {...register("bankName", {
                    required: "Bank name is required",
                    minLength: { value: 2, message: "Bank name must be at least 2 characters" },
                  })}
                  className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white transition-all duration-200 outline-none ${
                    errors.bankName
                      ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                  }`}
                />
                {errors.bankName && (
                  <p className="text-xs font-semibold text-red-500">{errors.bankName.message}</p>
                )}
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  placeholder="Enter account number"
                  {...register("accountNumber", {
                    required: "Account number is required",
                    pattern: {
                      value: /^[0-9a-zA-Z-\s]+$/,
                      message: "Must be a valid alphanumeric account number"
                    },
                    minLength: { value: 6, message: "Account number must be at least 6 characters" },
                  })}
                  className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white transition-all duration-200 outline-none ${
                    errors.accountNumber
                      ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                  }`}
                />
                {errors.accountNumber && (
                  <p className="text-xs font-semibold text-red-500">{errors.accountNumber.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-soft">
          <button
            type="button"
            onClick={handleBack}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-bold text-gray-600 dark:text-gray-400 hover:text-gray-950 dark:hover:text-white transition-all rounded-xl hover:-translate-x-1"
          >
            <FiChevronLeft size={20} />
            Back
          </button>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`w-full sm:w-auto px-8 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg whitespace-nowrap text-white ${
              isValid && !isSubmitting
                ? "bg-green-500 hover:bg-green-600 hover:scale-[1.02]"
                : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400"
            }`}
          >
            Save and Continue
            <FiChevronRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalaryBankDetailsForm;
