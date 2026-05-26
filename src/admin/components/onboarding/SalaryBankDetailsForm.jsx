import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiChevronRight, FiChevronLeft, FiDollarSign, FiCreditCard, FiActivity, FiSave, FiPlus, FiTrash2, FiEdit, FiGlobe } from "react-icons/fi";
import { setStep, updateEmployeeDetails } from "../../store/slices/onboardingSlice";
import { showToast } from "../../components/common/Toast";

const SalaryBankDetailsForm = () => {
  const dispatch = useDispatch();
  const onboardingState = useSelector((state) => state.onboarding) || {};
  const { employeeDetails = {} } = onboardingState;

  // --- Dynamic State Management (useState standard hooks as requested) ---
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // 1. Salary Structure States
  const [currency, setCurrency] = useState("AED");
  const [salaryComponents, setSalaryComponents] = useState([]);
  const [newComponentName, setNewComponentName] = useState("");
  const [newComponentPrice, setNewComponentPrice] = useState("");
  const [isSalarySaved, setIsSalarySaved] = useState(false);

  // 2. Bank Details States
  const [bankCountry, setBankCountry] = useState("UAE"); // Default UAE
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankSwift, setBankSwift] = useState("");
  const [customBankFields, setCustomBankFields] = useState([]);
  const [newCustomBankKey, setNewCustomBankKey] = useState("");
  const [newCustomBankValue, setNewCustomBankValue] = useState("");
  const [isBankSaved, setIsBankSaved] = useState(false);

  // 3. Payment Cycle State
  const [paymentCycle, setPaymentCycle] = useState("Monthly");

  // 4. Form Errors Validation State
  const [formErrors, setFormErrors] = useState({});

  // Available currencies for dropdown selection
  const currenciesList = [
    { code: "AED", name: "United Arab Emirates Dirham (AED)" },
    { code: "INR", name: "Indian Rupee (INR)" },
    { code: "USD", name: "United States Dollar (USD)" },
    { code: "EUR", name: "Euro (EUR)" },
    { code: "GBP", name: "British Pound (GBP)" }
  ];

  // --- Load Draft / Restore Redux State ---
  useEffect(() => {
    const draftStr = localStorage.getItem("onboarding-draft");
    let details = employeeDetails;

    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        if (draft?.employeeDetails) {
          details = draft.employeeDetails;
        }
      } catch (err) {
        console.error("Failed to parse onboarding draft", err);
      }
    }

    if (details && Object.keys(details).length > 0) {
      if (details.currency) setCurrency(details.currency);
      if (Array.isArray(details.salaryComponents)) {
        setSalaryComponents(details.salaryComponents);
        setIsSalarySaved(details.isSalarySaved ?? false);
      }
      if (details.bankCountry) setBankCountry(details.bankCountry);
      if (details.bankName) setBankName(details.bankName);
      if (details.accountNumber) setBankAccountNumber(details.accountNumber);
      if (details.bankIfsc) setBankIfsc(details.bankIfsc);
      if (details.bankBranch) setBankBranch(details.bankBranch);
      
      // Auto-format IBAN on restore
      if (details.bankIban) {
        const rawIban = details.bankIban.replace(/\s/g, "");
        let formatted = "";
        for (let i = 0; i < rawIban.length; i++) {
          if (i > 0 && i % 4 === 0) formatted += " ";
          formatted += rawIban[i];
        }
        setBankIban(formatted);
      }
      
      if (details.bankSwift) setBankSwift(details.bankSwift);
      if (Array.isArray(details.customBankFields)) setCustomBankFields(details.customBankFields);
      if (details.isBankSaved !== undefined) setIsBankSaved(details.isBankSaved);
      if (details.paymentCycle) setPaymentCycle(details.paymentCycle);
    }
  }, [employeeDetails]);

  // --- Helper: Compute aggregate Basic, Allowance, and Total ---
  const computeAggregateSalary = () => {
    let basicSalary = 0;
    let otherAllowance = 0;

    // Look for a component name containing "basic" (case-insensitive) to map to basic_salary
    const basicComponent = salaryComponents.find(comp => 
      comp.name.toLowerCase().includes("basic")
    );

    if (basicComponent) {
      basicSalary = basicComponent.price;
      // Other allowance is the sum of all components excluding the basic one
      otherAllowance = salaryComponents
        .filter(comp => comp.id !== basicComponent.id)
        .reduce((sum, comp) => sum + comp.price, 0);
    } else if (salaryComponents.length > 0) {
      // Fallback: first component is basic, others are other allowance
      basicSalary = salaryComponents[0].price;
      otherAllowance = salaryComponents.slice(1).reduce((sum, comp) => sum + comp.price, 0);
    }

    const totalMonthlySalary = salaryComponents.reduce((sum, comp) => sum + comp.price, 0);

    return {
      basicSalary: String(basicSalary),
      otherAllowance: String(otherAllowance),
      totalMonthlySalary
    };
  };

  const watchTotalSalary = salaryComponents.reduce((sum, comp) => sum + comp.price, 0);

  // --- Actions: Salary Structure ---
  const handleAddSalaryComponent = () => {
    if (!newComponentName.trim()) {
      showToast("Component name cannot be empty", "error");
      return;
    }
    const priceNum = parseFloat(newComponentPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("Price must be a number greater than 0", "error");
      return;
    }

    // Prevent duplicates
    if (salaryComponents.some(c => c.name.toLowerCase() === newComponentName.trim().toLowerCase())) {
      showToast(`Component "${newComponentName.trim()}" already exists!`, "error");
      return;
    }

    const newComponent = {
      id: Date.now(),
      name: newComponentName.trim(),
      price: priceNum
    };

    setSalaryComponents(prev => [...prev, newComponent]);
    setNewComponentName("");
    setNewComponentPrice("");
    showToast("Component added successfully!", "success");
  };

  const handleDeleteSalaryComponent = (id) => {
    setSalaryComponents(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveSalaryStructure = () => {
    if (salaryComponents.length === 0) {
      showToast("Please add at least one salary component before saving", "error");
      return;
    }
    setIsSalarySaved(true);
    showToast("Salary structure saved!", "success");
  };

  // --- Actions: Bank Details Validation & Changes ---
  const handleBankCountryChange = (e) => {
    const selectedCountry = e.target.value;
    setBankCountry(selectedCountry);
    // Clear country-specific values and errors to ensure clean state
    setBankIfsc("");
    setBankBranch("");
    setBankIban("");
    setBankSwift("");
    setFormErrors({});
    setIsBankSaved(false);
  };

  const handleBankNameChange = (e) => {
    const val = e.target.value;
    setBankName(val);
    if (!val.trim()) {
      setFormErrors(prev => ({ ...prev, bankName: "Bank name is required" }));
    } else if (val.trim().length < 2) {
      setFormErrors(prev => ({ ...prev, bankName: "Bank name must be at least 2 characters" }));
    } else {
      setFormErrors(prev => ({ ...prev, bankName: "" }));
    }
  };

  const handleAccountNumberChange = (e) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9-\s]/g, ""); // Allow alphanumeric, dashes, spaces
    setBankAccountNumber(val);
    
    const cleanVal = val.replace(/[\s-]/g, "");
    if (!val.trim()) {
      setFormErrors(prev => ({ ...prev, accountNumber: "Account number is required" }));
    } else if (bankCountry === "India" && (cleanVal.length < 9 || cleanVal.length > 18)) {
      setFormErrors(prev => ({ ...prev, accountNumber: "Indian bank account numbers must be 9 to 18 digits" }));
    } else if (bankCountry === "UAE" && (cleanVal.length < 8 || cleanVal.length > 16)) {
      setFormErrors(prev => ({ ...prev, accountNumber: "UAE bank account numbers must be 8 to 16 digits" }));
    } else {
      setFormErrors(prev => ({ ...prev, accountNumber: "" }));
    }
  };

  // Indian IFSC Code: 11 characters. 4 letters, '0', then 6 alphanumeric
  const handleIfscChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 11);
    setBankIfsc(val);
    
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!val) {
      setFormErrors(prev => ({ ...prev, ifsc: "IFSC Code is required" }));
    } else if (val.length < 11) {
      setFormErrors(prev => ({ ...prev, ifsc: "IFSC Code must be exactly 11 characters" }));
    } else if (!ifscRegex.test(val)) {
      setFormErrors(prev => ({ ...prev, ifsc: "Format must be: 4 letters, 0, then 6 alphanumeric (e.g. HDFC0000123)" }));
    } else {
      setFormErrors(prev => ({ ...prev, ifsc: "" }));
    }
  };

  const handleBranchChange = (e) => {
    const val = e.target.value;
    setBankBranch(val);
    if (!val.trim()) {
      setFormErrors(prev => ({ ...prev, branch: "Branch name is required" }));
    } else {
      setFormErrors(prev => ({ ...prev, branch: "" }));
    }
  };

  // UAE IBAN: starts with "AE" followed by 21 alphanumeric digits. Total 23 characters.
  const handleIbanChange = (e) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 23);
    
    // Auto-format spaces every 4 characters
    let formatted = "";
    for (let i = 0; i < val.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += " ";
      formatted += val[i];
    }
    setBankIban(formatted);
    
    if (!val) {
      setFormErrors(prev => ({ ...prev, iban: "IBAN is required" }));
    } else if (!val.startsWith("AE")) {
      setFormErrors(prev => ({ ...prev, iban: "UAE IBAN must start with 'AE'" }));
    } else if (val.length < 23) {
      setFormErrors(prev => ({ ...prev, iban: `IBAN must be exactly 23 characters (current: ${val.length})` }));
    } else {
      setFormErrors(prev => ({ ...prev, iban: "" }));
    }
  };

  // SWIFT/BIC Code: 8 or 11 alphanumeric characters
  const handleSwiftChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 11);
    setBankSwift(val);
    
    const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    if (!val) {
      setFormErrors(prev => ({ ...prev, swift: "SWIFT/BIC Code is required" }));
    } else if (val.length !== 8 && val.length !== 11) {
      setFormErrors(prev => ({ ...prev, swift: "SWIFT/BIC Code must be 8 or 11 characters" }));
    } else if (!swiftRegex.test(val)) {
      setFormErrors(prev => ({ ...prev, swift: "Invalid SWIFT/BIC format" }));
    } else {
      setFormErrors(prev => ({ ...prev, swift: "" }));
    }
  };

  // --- Dynamic Bank Custom Fields ---
  const handleAddCustomBankField = () => {
    if (!newCustomBankKey.trim()) {
      showToast("Custom field name cannot be empty", "error");
      return;
    }
    if (!newCustomBankValue.trim()) {
      showToast("Custom field value cannot be empty", "error");
      return;
    }

    const keyLower = newCustomBankKey.trim().toLowerCase();
    const forbidden = ["bankname", "bank name", "accountnumber", "account number", "ifsc", "branch", "iban", "swift"];
    if (forbidden.includes(keyLower)) {
      showToast("Cannot add standard fields as custom fields", "error");
      return;
    }

    if (customBankFields.some(f => f.key.toLowerCase() === keyLower)) {
      showToast(`Custom field "${newCustomBankKey.trim()}" already exists!`, "error");
      return;
    }

    const newField = {
      id: Date.now(),
      key: newCustomBankKey.trim(),
      value: newCustomBankValue.trim()
    };

    setCustomBankFields(prev => [...prev, newField]);
    setNewCustomBankKey("");
    setNewCustomBankValue("");
    showToast("Custom bank field added successfully!", "success");
  };

  const handleDeleteCustomBankField = (id) => {
    setCustomBankFields(prev => prev.filter(f => f.id !== id));
  };

  const handleSaveBankDetails = () => {
    let errors = {};
    if (!bankName.trim()) errors.bankName = "Bank name is required";
    if (!bankAccountNumber.trim()) errors.accountNumber = "Account number is required";

    if (bankCountry === "India") {
      if (!bankIfsc.trim()) {
        errors.ifsc = "IFSC Code is required";
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc)) {
        errors.ifsc = "Invalid IFSC Code format";
      }
      if (!bankBranch.trim()) errors.branch = "Branch name is required";
    } else { // UAE
      const rawIban = bankIban.replace(/\s/g, "");
      if (!bankIban.trim()) {
        errors.iban = "IBAN is required";
      } else if (!/^AE[A-Z0-9]{21}$/.test(rawIban)) {
        errors.iban = "Invalid UAE IBAN format (AE followed by 21 characters)";
      }

      if (!bankSwift.trim()) {
        errors.swift = "SWIFT/BIC Code is required";
      } else if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bankSwift)) {
        errors.swift = "Invalid SWIFT/BIC Code format";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast("Please correct the errors in the bank details form", "error");
      return;
    }

    setIsBankSaved(true);
    showToast("Bank details saved successfully!", "success");
  };

  // --- Draft Saving Flow ---
  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    const computedValues = computeAggregateSalary();
    const cleanIban = bankIban.replace(/\s/g, "");

    const formValues = {
      ...computedValues, // basicSalary, otherAllowance, totalMonthlySalary
      paymentCycle,
      currency,
      salaryComponents,
      isSalarySaved,
      bankCountry,
      bankName,
      accountNumber: bankAccountNumber,
      bankIfsc,
      bankBranch,
      bankIban: cleanIban,
      bankSwift,
      customBankFields,
      isBankSaved
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

  // --- Final Form Submit ---
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isSalarySaved) {
      showToast("Please save your Salary Structure before continuing", "warning");
      return;
    }

    if (!isBankSaved) {
      showToast("Please save your Bank Details before continuing", "warning");
      return;
    }

    const computedValues = computeAggregateSalary();
    const cleanIban = bankIban.replace(/\s/g, "");

    const finalPayload = {
      ...computedValues, // basicSalary, otherAllowance, totalMonthlySalary
      paymentCycle,
      currency,
      salaryComponents,
      isSalarySaved,
      bankCountry,
      bankName,
      accountNumber: bankAccountNumber,
      bankIfsc,
      bankBranch,
      bankIban: cleanIban,
      bankSwift,
      customBankFields,
      isBankSaved
    };

    dispatch(updateEmployeeDetails(finalPayload));
    dispatch(setStep(4)); // Proceed to Step 4 (Offer Letter Preview)
    showToast("Financial details verified and saved!", "success");
  };

  const handleBack = () => {
    dispatch(setStep(2)); // Back to Step 2 (Employee Details Form)
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

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: DYNAMIC SALARY STRUCTURE */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700/80 overflow-hidden transition-all">
          <div className="px-6 md:px-8 py-5 border-b border-gray-100 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
                <FiDollarSign size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Salary Structure
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Select currency and build a dynamic component breakdown.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-950/40 transition-all border border-green-100 dark:border-green-900/30 shadow-sm"
            >
              <FiSave size={16} />
              {isSavingDraft ? "Saving..." : "Save Draft"}
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {!isSalarySaved ? (
              // SALARY EDIT MODE
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Currency Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Currency Selection <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white transition-all duration-200 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 cursor-pointer"
                    >
                      {currenciesList.map(curr => (
                        <option key={curr.code} value={curr.code}>{curr.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Cycle */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Payment Cycle <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={paymentCycle}
                      onChange={(e) => setPaymentCycle(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white transition-all duration-200 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 cursor-pointer"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-Weekly">Bi-Weekly</option>
                      <option value="Quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>

                {/* Salary Component Input Panel */}
                <div className="p-5 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider">
                    Add Salary Component
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Component Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Basic Salary, Housing, Transit"
                        value={newComponentName}
                        onChange={(e) => setNewComponentName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-green-500"
                      />
                    </div>
                    
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center justify-between">
                        <span>Price / Value</span>
                        {currency && <span className="font-extrabold text-[10px] text-green-600 dark:text-green-500">{currency}</span>}
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Enter amount"
                        value={newComponentPrice}
                        onChange={(e) => setNewComponentPrice(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-green-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSalaryComponent}
                      className="sm:col-span-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1 hover:scale-[1.02]"
                    >
                      <FiPlus size={16} />
                      Add
                    </button>
                  </div>
                </div>

                {/* Salary Components Local List Preview */}
                {salaryComponents.length > 0 ? (
                  <div className="space-y-4">
                    <div className="overflow-hidden border border-gray-100 dark:border-gray-700/80 rounded-xl">
                      <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/60 text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                          <tr>
                            <th className="px-4 py-3">Component Name</th>
                            <th className="px-4 py-3 text-right">Value ({currency})</th>
                            <th className="px-4 py-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-sm">
                          {salaryComponents.map((comp) => (
                            <tr key={comp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10">
                              <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                                {comp.name}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                {comp.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSalaryComponent(comp.id)}
                                  className="p-1 text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-green-50/30 dark:bg-green-950/10 font-bold border-t-2 border-green-200/50">
                            <td className="px-4 py-3 text-green-700 dark:text-green-400 uppercase tracking-wider">
                              Total Monthly Salary
                            </td>
                            <td className="px-4 py-3 text-right text-green-700 dark:text-green-400 text-base">
                              {currency} {watchTotalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveSalaryStructure}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2 hover:scale-[1.02]"
                      >
                        <FiSave size={14} />
                        Save Salary Structure
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-6 text-xs text-gray-400 italic">
                    No salary components added yet. Add "Basic Salary" and other allowances to build the structure.
                  </p>
                )}
              </div>
            ) : (
              // SALARY STRUCTURE SAVED SINGLE TABLE ROW RENDERING
              <div className="overflow-x-auto border border-gray-150 dark:border-gray-700/80 rounded-2xl shadow-inner animate-fadeIn">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/80 text-left">
                  <thead className="bg-gray-50/70 dark:bg-gray-800/40 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-4">Currency</th>
                      <th className="px-6 py-4">Component Name</th>
                      <th className="px-6 py-4">Component Price</th>
                      <th className="px-6 py-4 text-right">Total Salary</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-750 bg-white dark:bg-gray-800/20">
                    <tr className="hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-colors">
                      {/* Selected Currency Dropdown Column */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-extrabold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/30 shadow-sm">
                          <FiGlobe className="text-green-600" size={14} />
                          {currency}
                        </span>
                      </td>

                      {/* Component Name stacked */}
                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          {salaryComponents.map((comp) => (
                            <div key={comp.id} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {comp.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Price stacked */}
                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          {salaryComponents.map((comp) => (
                            <div key={comp.id} className="text-sm font-bold text-gray-900 dark:text-white">
                              {currency} {comp.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Aggregate Sum total monthly salary */}
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <span className="text-base font-extrabold text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-950/20 px-3.5 py-2 rounded-2xl border border-green-150/30 dark:border-green-900/20 shadow-inner">
                          {currency} {watchTotalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Action Column to reopen edit structure */}
                      <td className="px-6 py-5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setIsSalarySaved(false)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40 rounded-xl transition-all border border-green-150/40 dark:border-green-900/30 hover:scale-[1.03]"
                        >
                          <FiEdit size={14} />
                          Modify Structure
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: DYNAMIC BANK DETAILS (Indian/UAE specific validation) */}
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
                Select country, enter required fields with local validations, and define additional fields.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {!isBankSaved ? (
              // BANK DETAILS EDIT MODE
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Country Selector */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Bank Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bankCountry}
                      onChange={handleBankCountryChange}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white transition-all duration-200 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 cursor-pointer"
                    >
                      <option value="UAE">United Arab Emirates (UAE)</option>
                      <option value="India">India</option>
                    </select>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Switches bank identifier validation (IBAN & SWIFT for UAE vs IFSC & Branch for India).
                    </p>
                  </div>

                  {/* Bank Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Emirates NBD, HDFC Bank"
                      value={bankName}
                      onChange={handleBankNameChange}
                      className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white transition-all outline-none ${
                        formErrors.bankName
                          ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                          : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                      }`}
                    />
                    {formErrors.bankName && (
                      <p className="text-xs font-semibold text-red-500">{formErrors.bankName}</p>
                    )}
                  </div>

                  {/* Account Number */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 101004561239"
                      value={bankAccountNumber}
                      onChange={handleAccountNumberChange}
                      className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white transition-all outline-none ${
                        formErrors.accountNumber
                          ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                          : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                      }`}
                    />
                    {formErrors.accountNumber && (
                      <p className="text-xs font-semibold text-red-500">{formErrors.accountNumber}</p>
                    )}
                  </div>

                  {/* REGION-SPECIFIC bank details fields (India: IFSC, Branch; UAE: IBAN, SWIFT) */}
                  {bankCountry === "India" ? (
                    <>
                      {/* IFSC Code */}
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                          IFSC Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. HDFC0000240"
                          value={bankIfsc}
                          onChange={handleIfscChange}
                          className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white transition-all outline-none font-mono tracking-wider ${
                            formErrors.ifsc
                              ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                              : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                          }`}
                        />
                        {formErrors.ifsc && (
                          <p className="text-xs font-semibold text-red-500">{formErrors.ifsc}</p>
                        )}
                      </div>

                      {/* Branch Name */}
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                          Branch Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Bandra East, Mumbai"
                          value={bankBranch}
                          onChange={handleBranchChange}
                          className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white transition-all outline-none ${
                            formErrors.branch
                              ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                              : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                          }`}
                        />
                        {formErrors.branch && (
                          <p className="text-xs font-semibold text-red-500">{formErrors.branch}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* IBAN number */}
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                          IBAN Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. AE55 0230 0000 1234 5678 901"
                          value={bankIban}
                          onChange={handleIbanChange}
                          className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white transition-all outline-none font-mono tracking-wide ${
                            formErrors.iban
                              ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                              : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                          }`}
                        />
                        {formErrors.iban && (
                          <p className="text-xs font-semibold text-red-500">{formErrors.iban}</p>
                        )}
                      </div>

                      {/* SWIFT/BIC Code */}
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                          SWIFT/BIC Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. EBILAEADXXX"
                          value={bankSwift}
                          onChange={handleSwiftChange}
                          className={`w-full px-4 py-3 bg-white dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white transition-all outline-none font-mono tracking-wider ${
                            formErrors.swift
                              ? "border-red-500 focus:ring-4 focus:ring-red-500/10 focus:border-red-500"
                              : "border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
                          }`}
                        />
                        {formErrors.swift && (
                          <p className="text-xs font-semibold text-red-500">{formErrors.swift}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* DYNAMIC SETUP: Custom additional fields input */}
                <div className="p-5 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-300 uppercase tracking-wider">
                    Add Custom Bank Field (Optional)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Field Name (Key)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Account Type, Correspondent Bank"
                        value={newCustomBankKey}
                        onChange={(e) => setNewCustomBankKey(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-green-500"
                      />
                    </div>
                    
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Field Value
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Savings, Citibank US"
                        value={newCustomBankValue}
                        onChange={(e) => setNewCustomBankValue(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:border-green-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomBankField}
                      className="sm:col-span-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1 hover:scale-[1.02]"
                    >
                      <FiPlus size={16} />
                      Add Field
                    </button>
                  </div>
                </div>

                {/* Custom bank fields listing */}
                {customBankFields.length > 0 && (
                  <div className="overflow-hidden border border-gray-100 dark:border-gray-700/80 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/60 text-left">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                        <tr>
                          <th className="px-4 py-3">Custom Field Name</th>
                          <th className="px-4 py-3">Custom Value</th>
                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-sm">
                        {customBankFields.map((field) => (
                          <tr key={field.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10">
                            <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                              {field.key}
                            </td>
                            <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                              {field.value}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomBankField(field.id)}
                                className="p-1 text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg transition-all"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Save Bank Details Button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveBankDetails}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-2 hover:scale-[1.02]"
                  >
                    <FiSave size={14} />
                    Save Bank Details
                  </button>
                </div>
              </div>
            ) : (
              // BANK DETAILS SAVED SINGLE TABLE ROW RENDERING
              <div className="overflow-x-auto border border-gray-150 dark:border-gray-700/80 rounded-2xl shadow-inner animate-fadeIn">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/80 text-left">
                  <thead className="bg-gray-50/70 dark:bg-gray-800/40 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-4">Country</th>
                      <th className="px-6 py-4">Bank Name & Account Details</th>
                      <th className="px-6 py-4">Routing / Key Identifier</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-750 bg-white dark:bg-gray-800/20">
                    <tr className="hover:bg-gray-50/30 dark:hover:bg-gray-800/10 transition-colors">
                      
                      {/* Bank Country Column */}
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 shadow-sm">
                          <FiGlobe className="text-blue-600" size={14} />
                          {bankCountry}
                        </span>
                      </td>

                      {/* Bank Name, Account details and custom fields stacked */}
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{bankName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Account Number: <span className="font-semibold text-gray-700 dark:text-gray-300">{bankAccountNumber}</span>
                          </p>
                          {bankCountry === "India" && bankBranch && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              Branch: <span className="font-semibold text-gray-700 dark:text-gray-300">{bankBranch}</span>
                            </p>
                          )}
                          
                          {/* Custom fields rendered under standard bank fields */}
                          {customBankFields.length > 0 && (
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700/30 mt-2 space-y-1">
                              {customBankFields.map((field) => (
                                <p key={field.id} className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  {field.key}: <span className="font-semibold text-gray-700 dark:text-gray-300">{field.value}</span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Key Identifier column (India: IFSC Code, UAE: IBAN & SWIFT) */}
                      <td className="px-6 py-5">
                        {bankCountry === "India" ? (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">IFSC Code</span>
                            <span className="font-mono text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-900 px-2.5 py-1 rounded border border-gray-200 dark:border-gray-800">
                              {bankIfsc}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">IBAN & SWIFT</span>
                            <div className="space-y-1">
                              <span className="font-mono text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-800 block w-fit">
                                {bankIban}
                              </span>
                              {bankSwift && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold block">
                                  SWIFT: <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100/50 dark:bg-gray-900/50 px-1.5 py-0.5 rounded">{bankSwift}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Action column to unlock edit state */}
                      <td className="px-6 py-5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setIsBankSaved(false)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40 rounded-xl transition-all border border-green-150/40 dark:border-green-900/30 hover:scale-[1.03]"
                        >
                          <FiEdit size={14} />
                          Modify Bank Details
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER ACTIONS - Navigation controls */}
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
            className={`w-full sm:w-auto px-8 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg whitespace-nowrap text-white ${
              isSalarySaved && isBankSaved
                ? "bg-green-500 hover:bg-green-600 hover:scale-[1.02]"
                : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400 opacity-60"
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
