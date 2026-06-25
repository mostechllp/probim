// AddPayroll.js - With salary packages fetching from API

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { showToast } from "../components/common/Toast";

import {
  savePayrollStep,
  submitPayroll,
  fetchDraftPayroll,
  setCurrentStep,
  updateStepData,
  markStepCompleted,
  clearPayrollError,
  clearPayrollSuccess,
  resetPayrollState,
  selectCurrentStep,
  selectStepData,
  selectPayrollLoading,
  selectPayrollIsSubmitting,
  selectPayrollSuccess,
  selectPayrollError,
  selectPayrollSaving,
} from "../store/slices/payrollSlice";

import {
  fetchEmployees,
  fetchEmployeeById,
  resetCurrentEmployee,
} from "../store/slices/employeeSlice";

// Import the onboarding slice actions
import {
  fetchSalaryPackages,
  clearPackages,
} from "../store/slices/onboardingSlice";

// Helper function to get organization name from employees list
const getOrganizationName = (employees, organizationId) => {
  if (!organizationId || !employees || employees.length === 0) return null;

  for (const emp of employees) {
    if (emp.raw && emp.raw.user) {
      if (emp.raw.user.organization_id === parseInt(organizationId)) {
        if (emp.raw.user.organization && emp.raw.user.organization.name) {
          return emp.raw.user.organization.name;
        }
        if (emp.raw.user.company && emp.raw.user.company.name) {
          return emp.raw.user.company.name;
        }
      }
    }
    if (emp.organization_name) {
      return emp.organization_name;
    }
    if (emp.company_name) {
      return emp.company_name;
    }
  }
  return null;
};

function AddPayroll() {
  const dispatch = useDispatch();

  // Redux state
  const reduxCurrentStep = useSelector(selectCurrentStep);
  const stepData = useSelector(selectStepData);
  const isLoading = useSelector(selectPayrollLoading);
  const isSubmitting = useSelector(selectPayrollIsSubmitting);
  const isSaving = useSelector(selectPayrollSaving);
  const successMessage = useSelector(selectPayrollSuccess);
  const error = useSelector(selectPayrollError);

  // Employee state
  const {
    employees,
    loading: employeesLoading,
    currentEmployee,
  } = useSelector((state) => state.employees);

  // Salary packages state from onboarding slice
  const {
    availablePackages,
    packagesLoading,
  } = useSelector((state) => state.onboarding || { availablePackages: [], packagesLoading: false });

  // Local state for form data
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [payPeriodMonth, setPayPeriodMonth] = useState("");
  const [payPeriodYear, setPayPeriodYear] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMode, setPaymentMode] = useState(null);
  const [totalWorkingDays, setTotalWorkingDays] = useState("");
  const [daysPresent, setDaysPresent] = useState("");

  const [countries, setCountries] = useState([
    {
      id: 1,
      name: "UAE",
      currency: "AED",
      dailyRate: "600",
      daysWorked: "10",
      fxRate: "22.5",
      packageId: null,
    },
    {
      id: 2,
      name: "India",
      currency: "INR",
      dailyRate: "2000",
      daysWorked: "20",
      fxRate: "1",
      packageId: null,
    },
  ]);

  const [overtimeRequests, setOvertimeRequests] = useState([
    {
      id: 1,
      project: "Dubai Mall Expansion",
      date: "2026-05-20",
      hours: 4,
      status: "pending",
      reason: "Client requested emergency revisions",
    },
    {
      id: 2,
      project: "Airport Terminal 3",
      date: "2026-05-21",
      hours: 2.5,
      status: "pending",
      reason: "Project deadline approaching",
    },
  ]);

  const [deductions, setDeductions] = useState([
    {
      id: 1,
      type: "PF (Employee 12%)",
      country: "India",
      amount: "6000",
      statutory: "Yes",
    },
    {
      id: 2,
      type: "Professional Tax",
      country: "India",
      amount: "200",
      statutory: "Yes",
    },
    {
      id: 3,
      type: "TDS / Income Tax",
      country: "India",
      amount: "4500",
      statutory: "Yes",
    },
    {
      id: 4,
      type: "Gratuity (UAE 8.33%)",
      country: "UAE",
      amount: "1125",
      statutory: "Yes",
    },
  ]);

  const steps = [
    { id: 1, label: "Basic Info" },
    { id: 2, label: "Country Split" },
    { id: 3, label: "Overtime" },
    { id: 4, label: "Deductions" },
    { id: 5, label: "Summary" },
  ];

  // Month name to number mapping
  const monthNames = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12
  };

  // --- FIX: Clear current employee on mount to prevent auto-prefilling ---
  useEffect(() => {
    // Clear any previously selected employee from Redux
    if (resetCurrentEmployee) {
      dispatch(resetCurrentEmployee());
    }
    
    // Reset local form state
    clearEmployeeFields();
    setSelectedEmployee("");
    setSelectedUserId("");
    
    // Reset pay period fields
    setPayPeriodMonth("");
    setPayPeriodYear("");
    setPeriodStart("");
    setPeriodEnd("");
    setPaymentDate("");
    setPaymentMode(null);
    setTotalWorkingDays("");
    setDaysPresent("");
    
    // Load employees
    dispatch(fetchEmployees());
    
    // Fetch salary packages from API
    dispatch(fetchSalaryPackages());
    
    // Reset Redux step to 1
    dispatch(setCurrentStep(1));
    
    // Clean up on unmount
    return () => {
      // Optionally reset payroll state
      // dispatch(resetPayrollState());
      // Clear packages on unmount
      dispatch(clearPackages());
    };
  }, [dispatch]);

  // Handle employee selection
  const handleEmployeeSelect = async (employeeId) => {
    setSelectedEmployee(employeeId);

    if (employeeId) {
      try {
        const result = await dispatch(fetchEmployeeById(employeeId)).unwrap();
        if (result && result.user_id) {
          setSelectedUserId(result.user_id.toString());
        }
      } catch (error) {
        showToast("Failed to fetch employee details", "error");
      }
    } else {
      clearEmployeeFields();
      setSelectedUserId("");
    }
  };

  // Clear employee fields
  const clearEmployeeFields = () => {
    setEmployeeId("");
    setEmployeeName("");
    setOrganizationId("");
    setOrganizationName("");
    setDepartment("");
    setDesignation("");
    setEmploymentType("");
  };

  // Auto-populate fields when employee data is loaded (only when selected)
  useEffect(() => {
    if (currentEmployee && selectedEmployee) {
      const user = currentEmployee.user || {};
      const fullName = [currentEmployee.first_name, currentEmployee.last_name]
        .filter(Boolean)
        .join(" ");

      if (currentEmployee.user_id) {
        setSelectedUserId(currentEmployee.user_id.toString());
      }

      setEmployeeId(currentEmployee.employee_id || "");
      setEmployeeName(fullName || "");

      let orgId = "";
      let orgName = "";

      if (user.organization_id) {
        orgId = user.organization_id.toString();
      }

      if (user.organization && user.organization.name) {
        orgName = user.organization.name;
      } else if (user.company && user.company.name) {
        orgName = user.company.name;
      } else if (orgId) {
        const orgNameFromList = getOrganizationName(employees, orgId);
        if (orgNameFromList) {
          orgName = orgNameFromList;
        } else {
          orgName = `Organization #${orgId}`;
        }
      }

      setOrganizationId(orgId);
      setOrganizationName(orgName || "N/A");

      const deptName =
        user.department?.name || user.department_id?.toString() || "N/A";
      setDepartment(deptName);

      const desigName =
        user.designation?.name || user.designation_id?.toString() || "N/A";
      setDesignation(desigName);

      setEmploymentType(user.type || user.employment_type || "employee");

      // Set default pay period if not set
      if (!payPeriodMonth) {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const monthNum = String(currentMonth).padStart(2, "0");

        const monthNamesList = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        setPayPeriodMonth(monthNamesList[currentMonth - 1]);
        setPayPeriodYear(currentYear.toString());

        setPeriodStart(`${currentYear}-${monthNum}-01`);

        const lastDay = new Date(currentYear, currentMonth, 0).getDate();
        setPeriodEnd(
          `${currentYear}-${monthNum}-${String(lastDay).padStart(2, "0")}`,
        );

        setPaymentDate(`${currentYear}-${monthNum}-25`);
        setTotalWorkingDays("26");
        setDaysPresent("30");
        setPaymentMode(null);
      }
    }
  }, [currentEmployee, employees, payPeriodMonth, selectedEmployee]);

  // Load draft data on mount if editing
  useEffect(() => {
    const isEditing = false;
    if (isEditing && selectedUserId) {
      dispatch(fetchDraftPayroll(selectedUserId));
    }
  }, [dispatch, selectedUserId]);

  // Handle success/error messages from Redux
  useEffect(() => {
    if (successMessage) {
      showToast(successMessage, "success");
      dispatch(clearPayrollSuccess());
    }
    if (error) {
      showToast(error, "error");
      dispatch(clearPayrollError());
    }
  }, [successMessage, error, dispatch]);

  // Get current step data based on form state - ONLY SEND RELEVANT FIELDS
  const getCurrentStepData = () => {
    const step = reduxCurrentStep;
    let data = {};

    switch (step) {
      case 1:
        const monthNumber = monthNames[payPeriodMonth] || new Date().getMonth() + 1;
        data = {
          pay_period_month: monthNumber,
          pay_period_year: parseInt(payPeriodYear) || new Date().getFullYear(),
          period_start: periodStart,
          period_end: periodEnd,
          payment_date: paymentDate,
          payment_mode: paymentMode,
          total_working_days: parseInt(totalWorkingDays) || 0,
          days_present: parseInt(daysPresent) || 0,
        };
        break;
      case 2:
        data = {
          countries: countries.map(c => ({
            name: c.name,
            currency: c.currency,
            daily_rate: parseFloat(c.dailyRate) || 0,
            days_worked: parseInt(c.daysWorked) || 0,
            fx_rate: parseFloat(c.fxRate) || 0,
            package_id: c.packageId || null,
          })),
        };
        break;
      case 3:
        data = {
          overtime_requests: overtimeRequests.map(req => ({
            project: req.project,
            date: req.date,
            hours: parseFloat(req.hours) || 0,
            status: req.status,
            reason: req.reason,
          })),
        };
        break;
      case 4:
        data = {
          deductions: deductions.map(d => ({
            type: d.type,
            country: d.country,
            amount: parseFloat(d.amount) || 0,
            statutory: d.statutory === "Yes",
          })),
        };
        break;
      case 5:
        data = {
          summary: {
            gross_earnings: "₹80,000",
            total_deductions: "₹12,315",
            combined: "₹1,75,000",
            net_pay: "₹1,63,175",
          },
        };
        break;
      default:
        data = {};
    }

    return data;
  };

  // Save current step data
  const handleSaveStep = async (step, data) => {
    if (!selectedUserId) {
      showToast("Please select an employee first", "error");
      return false;
    }

    try {
      console.log("Saving step with user_id:", selectedUserId);
      console.log("Step data:", data);

      // --- COMMENTED OUT: API call for saving step ---
      // await dispatch(
      //   savePayrollStep({
      //     userId: selectedUserId,
      //     step: step,
      //     stepData: data,
      //   }),
      // ).unwrap();

      // --- MOCK: Simulate save for UI testing ---
      console.log("MOCK: Step data saved successfully (UI testing mode)");

      // dispatch(updateStepData({ step, data }));
      // dispatch(markStepCompleted(step));
      return true;
    } catch (error) {
      console.error("Failed to save step:", error);
      showToast("Failed to save step data", "error");
      return false;
    }
  };

  // Handle step change
  const handleStepChange = async (step) => {
    if (!selectedUserId) {
      showToast("Please select an employee first", "error");
      return;
    }

    const currentData = getCurrentStepData();
    const saved = await handleSaveStep(reduxCurrentStep, currentData);

    if (saved || reduxCurrentStep === 5) {
      dispatch(setCurrentStep(step));
    }
  };

  // Handle next step
  const handleNextStep = async () => {
    if (!selectedUserId) {
      showToast("Please select an employee first", "error");
      return;
    }

    const currentData = getCurrentStepData();
    const saved = await handleSaveStep(reduxCurrentStep, currentData);

    if (saved) {
      if (reduxCurrentStep < 5) {
        dispatch(setCurrentStep(reduxCurrentStep + 1));
      }
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    if (reduxCurrentStep > 1) {
      dispatch(setCurrentStep(reduxCurrentStep - 1));
    }
  };

  // Handle final submission
  const handleSubmitPayroll = async () => {
    if (!selectedUserId) {
      showToast("Please select an employee first", "error");
      return;
    }

    try {
      const finalData = getCurrentStepData();
      await handleSaveStep(reduxCurrentStep, finalData);
      
      // --- COMMENTED OUT: API call for submitting payroll ---
      // await dispatch(submitPayroll(selectedUserId)).unwrap();
      
      // --- MOCK: Simulate submission for UI testing ---
      console.log("MOCK: Payroll submitted successfully (UI testing mode)");
      
      generatePayslipPDF();

      // setTimeout(() => {
      //   window.location.href = "/admin/payroll";
      // }, 3000);
    } catch (error) {
      showToast("Failed to submit payroll", "error");
    }
  };

  // Overtime actions
  const handleOvertimeAction = (id, newStatus) => {
    setOvertimeRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req)),
    );
  };

  // Country actions
  const handleCountryChange = (id, field, value) => {
    setCountries((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const handleAddCountry = () => {
    const newId = countries.length > 0 ? Math.max(...countries.map(c => c.id)) + 1 : 1;
    setCountries([...countries, {
      id: newId,
      name: "",
      currency: "INR",
      dailyRate: "",
      daysWorked: "",
      fxRate: "",
      packageId: null,
    }]);
  };

  const handleRemoveCountry = (id) => {
    if (countries.length <= 1) {
      showToast("At least one country split is required", "error");
      return;
    }
    setCountries(countries.filter(c => c.id !== id));
  };

  // Deduction actions
  const handleDeductionChange = (id, field, value) => {
    setDeductions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };

  const handleAddDeduction = () => {
    const newId = deductions.length > 0 ? Math.max(...deductions.map(d => d.id)) + 1 : 1;
    setDeductions([...deductions, {
      id: newId,
      type: "",
      country: "India",
      amount: "",
      statutory: "No",
    }]);
  };

  const handleRemoveDeduction = (id) => {
    if (deductions.length <= 1) {
      showToast("At least one deduction is required", "error");
      return;
    }
    setDeductions(deductions.filter(d => d.id !== id));
  };

  // Generate payslip PDF
  const generatePayslipPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Employee Payslip", 14, 22);

    doc.setFontSize(11);
    const empName = employeeName || "Employee";
    const empId = employeeId || "EMP-0000";
    doc.text(`Employee: ${empName} (${empId})`, 14, 32);
    doc.text(`Organization: ${organizationName}`, 14, 38);
    doc.text(
      `Pay Period: ${payPeriodMonth || "May"} ${payPeriodYear || "2026"}`,
      14,
      44,
    );
    doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 14, 50);

    autoTable(doc, {
      startY: 56,
      head: [
        ["Package / Location", "Days Logged", "Daily Rate", "Amount (INR)"],
      ],
      body: countries.map((c) => [
        c.name || "-",
        c.daysWorked || "0",
        `${c.currency || ""} ${c.dailyRate || "0"}`,
        `${c.currency === "AED" ? "₹" : "₹"}${(parseFloat(c.dailyRate) * parseFloat(c.daysWorked) * parseFloat(c.fxRate || 1)).toLocaleString()}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Overtime Project", "Date", "Hours", "Status"]],
      body: overtimeRequests.map((req) => [
        req.project,
        req.date,
        req.hours.toString(),
        req.status,
      ]),
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Deduction Type", "Country", "Amount (INR)"]],
      body: deductions.map((d) => [d.type, d.country, d.amount.toString()]),
      theme: "grid",
      headStyles: { fillColor: [239, 68, 68] },
    });

    const totalDeductions = deductions.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
    const grossEarnings = countries.reduce((sum, c) => sum + (parseFloat(c.dailyRate) * parseFloat(c.daysWorked) * parseFloat(c.fxRate || 1)), 0);
    const netPay = grossEarnings - totalDeductions;

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Gross Earnings", "Total Deductions", "Net Pay"]],
      body: [[
        `INR ${grossEarnings.toLocaleString()}`,
        `INR ${totalDeductions.toLocaleString()}`,
        `INR ${netPay.toLocaleString()}`,
      ]],
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });

    doc.save(`Payslip_${employeeName.replace(/\s/g, "_")}_${employeeId}.pdf`);
    showToast("Payslip generated successfully!", "success");
  };

  return (
    <div className="w-full overflow-x-hidden px-4 md:px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-6 flex-wrap">
        <Link
          to="/admin/payroll"
          className="text-green-500 hover:text-green-600 font-medium"
        >
          Payroll
        </Link>
        <i className="fas fa-chevron-right text-gray-400 text-[10px] md:text-xs"></i>
        <span className="text-gray-500 dark:text-gray-400">Add Payroll</span>
      </div>

      {/* Page Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-green-600 dark:from-gray-200 dark:to-green-400 bg-clip-text text-transparent">
          <i className="fas fa-plus-circle mr-2"></i> Add New Payroll
        </h2>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure employee salary, country-wise work splits, and deductions
        </p>
      </div>

      {/* Stepper */}
      <div className="flex flex-wrap gap-2 mb-6">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => handleStepChange(step.id)}
            disabled={isLoading || isSubmitting || !selectedUserId}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
              reduxCurrentStep === step.id
                ? "bg-green-500 text-white shadow-md"
                : reduxCurrentStep > step.id
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            } ${isLoading || isSubmitting || !selectedUserId ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {step.id}. {step.label}
          </button>
        ))}
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 lg:p-8 shadow-soft">
        <div className="space-y-6">
          {/* Step 1 - Basic Info */}
          {reduxCurrentStep === 1 && (
            <>
              {/* Employee Information Card */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4 md:mb-6">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <i className="fas fa-user text-green-600 dark:text-green-400 text-xs md:text-sm"></i>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                    Employee Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-user text-green-500 mr-1"></i>
                      Employee <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      value={selectedEmployee}
                      onChange={(e) => handleEmployeeSelect(e.target.value)}
                      disabled={employeesLoading}
                    >
                      <option value="">
                        {employeesLoading
                          ? "Loading employees..."
                          : "Select Employee"}
                      </option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-id-card text-green-500 mr-1"></i>
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={employeeId}
                      readOnly
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm md:text-base text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-user-tag text-green-500 mr-1"></i>
                      Employee Name
                    </label>
                    <input
                      type="text"
                      value={employeeName}
                      readOnly
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm md:text-base text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-building text-green-500 mr-1"></i>
                      Organization <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={organizationName}
                      readOnly
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm md:text-base text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-diagram-project text-green-500 mr-1"></i>
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      readOnly
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm md:text-base text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-briefcase text-green-500 mr-1"></i>
                      Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      readOnly
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm md:text-base text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-clock text-green-500 mr-1"></i>
                      Employment Type
                    </label>
                    <input
                      type="text"
                      value={employmentType}
                      readOnly
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm md:text-base text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Pay Period Card */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4 md:mb-6">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <i className="fas fa-calendar-alt text-green-600 dark:text-green-400 text-xs md:text-sm"></i>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                    Pay Period
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-calendar-month text-green-500 mr-1"></i>
                      Pay Period Month <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      value={payPeriodMonth}
                      onChange={(e) => setPayPeriodMonth(e.target.value)}
                      disabled={!selectedUserId}
                    >
                      <option value="">Select Month</option>
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="October">October</option>
                      <option value="November">November</option>
                      <option value="December">December</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-calendar-year text-green-500 mr-1"></i>
                      Pay Period Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      value={payPeriodYear}
                      onChange={(e) => setPayPeriodYear(e.target.value)}
                      disabled={!selectedUserId}
                    >
                      <option value="">Select Year</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-calendar-plus text-green-500 mr-1"></i>
                      Period Start Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        disabled={!selectedUserId}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-calendar-times text-green-500 mr-1"></i>
                      Period End Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={periodEnd}
                        onChange={(e) => setPeriodEnd(e.target.value)}
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        disabled={!selectedUserId}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-money-bill-wave text-green-500 mr-1"></i>
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        disabled={!selectedUserId}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-university text-green-500 mr-1"></i>
                      Payment Mode <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      value={paymentMode || ""}
                      onChange={(e) => setPaymentMode(e.target.value || null)}
                      disabled={!selectedUserId}
                    >
                      <option value="">Select Payment Mode</option>
                      <option value="NEFT">Bank Transfer (NEFT)</option>
                      <option value="RTGS">Bank Transfer (RTGS)</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-calendar-week text-green-500 mr-1"></i>
                      Total Working Days
                    </label>
                    <input
                      type="text"
                      value={totalWorkingDays}
                      onChange={(e) => setTotalWorkingDays(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      disabled={!selectedUserId}
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-calendar-check text-green-500 mr-1"></i>
                      Days Present
                    </label>
                    <input
                      type="text"
                      value={daysPresent}
                      onChange={(e) => setDaysPresent(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      disabled={!selectedUserId}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2 - Country Split / Packages */}
          {reduxCurrentStep === 2 && (
            <div>
              <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4 md:mb-6">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-globe text-green-600 dark:text-green-400 text-xs md:text-sm"></i>
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                  Salary Packages (Multi-Location)
                </h3>
                {packagesLoading && (
                  <span className="ml-2 text-xs text-gray-500">
                    <i className="fas fa-spinner fa-spin mr-1"></i> Loading...
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {countries.map((c) => (
                  <div
                    key={c.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                  >
                    <div className="md:col-span-3">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">
                        Package
                      </label>
                      {availablePackages.length > 0 ? (
                        <select
                          value={c.packageId || ""}
                          onChange={(e) => {
                            const selectedPackage = availablePackages.find(p => p.id === parseInt(e.target.value));
                            handleCountryChange(c.id, 'packageId', e.target.value);
                            if (selectedPackage) {
                              handleCountryChange(c.id, 'name', selectedPackage.name);
                              handleCountryChange(c.id, 'currency', selectedPackage.currency || "AED");
                            }
                          }}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        >
                          <option value="">Select Package</option>
                          {availablePackages.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name} ({pkg.currency || "AED"})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => handleCountryChange(c.id, 'name', e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                          placeholder="e.g., UAE Onsite"
                        />
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">
                        Currency
                      </label>
                      <select
                        value={c.currency}
                        onChange={(e) => handleCountryChange(c.id, 'currency', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      >
                        <option value="AED">AED</option>
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">
                        Daily Rate
                      </label>
                      <input
                        type="number"
                        value={c.dailyRate}
                        onChange={(e) => handleCountryChange(c.id, 'dailyRate', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">
                        Days Logged
                      </label>
                      <input
                        type="number"
                        value={c.daysWorked}
                        onChange={(e) => handleCountryChange(c.id, 'daysWorked', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block text-blue-500">
                        Manual FX Rate
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={c.fxRate}
                        onChange={(e) => handleCountryChange(c.id, 'fxRate', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-end items-end pb-0.5">
                      <button
                        onClick={() => handleRemoveCountry(c.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddCountry}
                className="mt-3 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors border border-green-100 dark:border-green-800 flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> Add Package Split
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="p-3 md:p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                    <span className="w-3 h-2 bg-green-500 rounded-sm"></span>
                    Pkg 2: Dubai (AED)
                  </div>
                  <div className="text-lg md:text-xl font-bold text-orange-600 dark:text-orange-400">
                    {countries.find(c => c.currency === "AED")?.dailyRate || "0"}
                  </div>
                  <div className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {countries.find(c => c.currency === "AED")?.daysWorked || 0} days
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                    <span className="w-3 h-2 bg-green-500 rounded-sm"></span>
                    Pkg 1: WFH (INR)
                  </div>
                  <div className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">
                    {countries.find(c => c.currency === "INR")?.dailyRate || "0"}
                  </div>
                  <div className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {countries.find(c => c.currency === "INR")?.daysWorked || 0} days
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                    Converted (AED → INR)
                  </div>
                  <div className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{(parseFloat(countries.find(c => c.currency === "AED")?.dailyRate || 0) * parseFloat(countries.find(c => c.currency === "AED")?.fxRate || 0)).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                    Combined Base (INR)
                  </div>
                  <div className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    ₹1,75,000
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 - Overtime */}
          {reduxCurrentStep === 3 && (
            <div>
              <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4 md:mb-6">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-green-600 dark:text-green-400 text-xs md:text-sm"></i>
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                  Overtime (Unprocessed)
                </h3>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        <th className="py-3 px-4 font-semibold">Project</th>
                        <th className="py-3 px-4 font-semibold">Date</th>
                        <th className="py-3 px-4 font-semibold">Hours</th>
                        <th className="py-3 px-4 font-semibold w-1/3">Reason</th>
                        <th className="py-3 px-4 font-semibold text-center">Status</th>
                        <th className="py-3 px-4 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overtimeRequests.map((req) => (
                        <tr
                          key={req.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                            <input
                              type="text"
                              value={req.project}
                              onChange={(e) => {
                                setOvertimeRequests(prev =>
                                  prev.map(r => r.id === req.id ? { ...r, project: e.target.value } : r)
                                );
                              }}
                              className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                              placeholder="Project name"
                            />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            <input
                              type="date"
                              value={req.date}
                              onChange={(e) => {
                                setOvertimeRequests(prev =>
                                  prev.map(r => r.id === req.id ? { ...r, date: e.target.value } : r)
                                );
                              }}
                              className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                            <input
                              type="number"
                              step="0.5"
                              value={req.hours}
                              onChange={(e) => {
                                setOvertimeRequests(prev =>
                                  prev.map(r => r.id === req.id ? { ...r, hours: parseFloat(e.target.value) || 0 } : r)
                                );
                              }}
                              className="w-16 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                            <input
                              type="text"
                              value={req.reason}
                              onChange={(e) => {
                                setOvertimeRequests(prev =>
                                  prev.map(r => r.id === req.id ? { ...r, reason: e.target.value } : r)
                                );
                              }}
                              className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                              placeholder="Reason"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            {req.status === "pending" && (
                              <span className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full text-[10px] font-bold border border-yellow-200 dark:border-yellow-800 uppercase">
                                Pending
                              </span>
                            )}
                            {req.status === "approved_project" && (
                              <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full text-[10px] font-bold border border-purple-200 dark:border-purple-800 uppercase">
                                Proj Hours
                              </span>
                            )}
                            {req.status === "approved_payroll" && (
                              <span className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-full text-[10px] font-bold border border-green-200 dark:border-green-800 uppercase">
                                + Payroll
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {req.status === "pending" ? (
                              <div className="flex flex-col gap-1.5 items-center">
                                <button
                                  onClick={() => handleOvertimeAction(req.id, "approved_project")}
                                  className="w-full text-[10px] px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 rounded font-semibold transition-colors"
                                >
                                  Project Hours Only
                                </button>
                                <button
                                  onClick={() => handleOvertimeAction(req.id, "approved_payroll")}
                                  className="w-full text-[10px] px-2 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/20 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 rounded font-semibold transition-colors"
                                >
                                  + Add to Payroll
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-center text-gray-400 text-xs">
                                Actioned
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                <div className="flex gap-2">
                  <i className="fas fa-info-circle mt-0.5"></i>
                  <div>
                    <p className="font-semibold mb-1">Approval Rules:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>
                        <strong>Project Hours Only:</strong> Added to manhour tracking, but no extra pay.
                      </li>
                      <li>
                        <strong>+ Add to Payroll:</strong> Added to manhour tracking AND included in this payroll cycle.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 - Deductions */}
          {reduxCurrentStep === 4 && (
            <div>
              <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4 md:mb-6">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-minus-circle text-green-600 dark:text-green-400 text-xs md:text-sm"></i>
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                  Deductions
                </h3>
              </div>

              <div className="space-y-3">
                {deductions.map((d) => (
                  <div
                    key={d.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                  >
                    <div className="md:col-span-4">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Type</label>
                      <input
                        type="text"
                        value={d.type}
                        onChange={(e) => handleDeductionChange(d.id, 'type', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        placeholder="e.g., PF 12%"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Country</label>
                      <select
                        value={d.country}
                        onChange={(e) => handleDeductionChange(d.id, 'country', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      >
                        <option value="India">India</option>
                        <option value="UAE">UAE</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Amount</label>
                      <input
                        type="number"
                        value={d.amount}
                        onChange={(e) => handleDeductionChange(d.id, 'amount', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Statutory</label>
                      <select
                        value={d.statutory}
                        onChange={(e) => handleDeductionChange(d.id, 'statutory', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <button
                        onClick={() => handleRemoveDeduction(d.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center"
                      >
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddDeduction}
                className="mt-3 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors border border-green-100 dark:border-green-800 flex items-center gap-2"
              >
                <i className="fas fa-plus"></i> Add Deduction
              </button>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                    India Deductions
                  </div>
                  <div className="text-lg md:text-xl font-bold text-red-500">
                    ₹{deductions.filter(d => d.country === "India").reduce((sum, d) => sum + parseFloat(d.amount || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                    UAE Deductions (INR)
                  </div>
                  <div className="text-lg md:text-xl font-bold text-red-500">
                    ₹{deductions.filter(d => d.country === "UAE").reduce((sum, d) => sum + parseFloat(d.amount || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                    Total Deductions
                  </div>
                  <div className="text-lg md:text-xl font-bold text-red-600 dark:text-red-500">
                    ₹{deductions.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="text-[10px] md:text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                    Final Net Pay
                  </div>
                  <div className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">
                    ₹1,63,175
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5 - Summary */}
          {reduxCurrentStep === 5 && (
            <div>
              <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4 md:mb-6">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clipboard-check text-green-600 dark:text-green-400 text-xs md:text-sm"></i>
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                  Payroll Summary
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Review the payroll details before final submission.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                      Gross Earnings
                    </div>
                    <div className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200">
                      ₹{countries.reduce((sum, c) => sum + (parseFloat(c.dailyRate || 0) * parseFloat(c.daysWorked || 0) * parseFloat(c.fxRate || 1)), 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                      Total Deductions
                    </div>
                    <div className="text-lg md:text-xl font-bold text-red-500">
                      ₹{deductions.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 md:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                      Combined (INR)
                    </div>
                    <div className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{countries.reduce((sum, c) => sum + (parseFloat(c.dailyRate || 0) * parseFloat(c.daysWorked || 0) * parseFloat(c.fxRate || 1)), 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 md:p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="text-[10px] md:text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                      Final Net Pay
                    </div>
                    <div className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">
                      ₹{(countries.reduce((sum, c) => sum + (parseFloat(c.dailyRate || 0) * parseFloat(c.daysWorked || 0) * parseFloat(c.fxRate || 1)), 0) - deductions.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                  <i className="fas fa-envelope text-blue-500 mt-1"></i>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                      Payslip Delivery
                    </h4>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                      Upon submission, the generated payslip will be automatically sent to the employee via Email only.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
            {reduxCurrentStep > 1 && (
              <button
                onClick={handlePreviousStep}
                disabled={isLoading || isSubmitting}
                className="px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-arrow-left text-xs md:text-sm"></i>
                <span>Previous</span>
              </button>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {reduxCurrentStep < 5 ? (
                <button
                  onClick={handleNextStep}
                  disabled={isLoading || isSubmitting || !selectedUserId}
                  className="px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next Step</span>
                  <i className="fas fa-arrow-right text-xs md:text-sm"></i>
                </button>
              ) : (
                <button
                  onClick={handleSubmitPayroll}
                  disabled={isSubmitting || !selectedUserId}
                  className="px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className={`fas ${isSubmitting ? "fa-spinner fa-spin" : "fa-paper-plane"} text-xs md:text-sm`}></i>
                  <span>
                    {isSubmitting ? "Submitting..." : "Generate & Email Payslip"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddPayroll;