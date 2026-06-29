// src/admin/pages/AddPayroll.js - Updated Country Split Tab

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
  calculateSalarySplit,
  fetchOvertimeData,
  fetchPayrollSummary,
  fetchEmployeeSalaryPackages,
  selectCalculatedCountries,
  selectCountriesLoading,
  selectOvertimeData,
  selectOvertimeLoading,
  selectSummaryData,
  selectSummaryLoading,
  selectEmployeePackages,
  selectPackagesLoading,
  clearEmployeePackages,
  convertSalary,
} from "../store/slices/payrollSlice";

import {
  fetchEmployees,
  fetchEmployeeById,
  resetCurrentEmployee,
} from "../store/slices/employeeSlice";

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

  const { user } = useSelector((state) => state.auth || {});
  const isAdmin =
    user?.type === "admin" ||
    user?.role?.name === "admin" ||
    user?.role?.name === "Admin";
  const basePath = isAdmin ? "/admin" : "/employee";

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

  // Employee salary packages from payroll slice
  const employeePackages = useSelector(selectEmployeePackages);
  const packagesLoading = useSelector(selectPackagesLoading);

  // Step data from Redux
  const calculatedCountries = useSelector(selectCalculatedCountries);
  const countriesLoading = useSelector(selectCountriesLoading);
  const overtimeData = useSelector(selectOvertimeData);
  const overtimeLoading = useSelector(selectOvertimeLoading);
  const summaryData = useSelector(selectSummaryData);
  const summaryLoading = useSelector(selectSummaryLoading);

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

  // Step 2 - Country Split
  const [countries, setCountries] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [grossSalary, setGrossSalary] = useState(0);
  const [netSalary, setNetSalary] = useState(0);
  const [isStep2Saved, setIsStep2Saved] = useState(false);

  // Step 3 - Overtime with overtime_amount field
  const [overtimeRequests, setOvertimeRequests] = useState([
    {
      id: 1,
      project: "Dubai Mall Expansion",
      date: "2026-05-20",
      hours: 4,
      overtime_amount: 0,
      currency: "INR",
      status: "pending",
      reason: "Client requested emergency revisions",
    },
    {
      id: 2,
      project: "Airport Terminal 3",
      date: "2026-05-21",
      hours: 2.5,
      overtime_amount: 0,
      currency: "INR",
      status: "pending",
      reason: "Project deadline approaching",
    },
  ]);

  // Step 4 - Deductions
  const [deductions, setDeductions] = useState([
    {
      id: 1,
      type: "",
      currency: "INR",
      amount: "0",
      is_statutory: "no",
    },
  ]);

  // Step 5 - Summary with currency conversion
  const [targetCurrency, setTargetCurrency] = useState("INR");
  const [conversionRatesList, setConversionRatesList] = useState([]);
  const [conversionDetails, setConversionDetails] = useState({
    gross_salary: null,
    overtime_amount: null,
    deductions: null,
    net_pay: null,
  });
  const [isConverted, setIsConverted] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [localSummaryData, setLocalSummaryData] = useState({
    gross_earnings: 0,
    total_deductions: 0,
    combined: 0,
    net_pay: 0,
  });

  const steps = [
    { id: 1, label: "Basic Info" },
    { id: 2, label: "Country Split" },
    { id: 3, label: "Overtime" },
    { id: 4, label: "Deductions" },
    { id: 5, label: "Summary" },
  ];

  // Month name to number mapping
  const monthNames = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };

  // Available currencies
  const currencies = ["AED", "INR", "USD", "EUR", "GBP", "PHP", "LKR"];

  // --- Clear current employee on mount ---
  useEffect(() => {
    if (resetCurrentEmployee) {
      dispatch(resetCurrentEmployee());
    }

    clearEmployeeFields();
    setSelectedEmployee("");
    setSelectedUserId("");

    setPayPeriodMonth("");
    setPayPeriodYear("");
    setPeriodStart("");
    setPeriodEnd("");
    setPaymentDate("");
    setPaymentMode(null);
    setTotalWorkingDays("");
    setDaysPresent("");

    dispatch(fetchEmployees());
    dispatch(setCurrentStep(1));
    dispatch(clearEmployeePackages());

    return () => {
      // Clean up
    };
  }, [dispatch]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // ─── STEP 5: Convert Currency ──────────────────────────────────────────
  // ─── STEP 5: Convert Currency ──────────────────────────────────────────
  const handleConvertCurrency = async () => {
    if (conversionRatesList.length === 0) {
      showToast("Please add at least one conversion rate", "warning");
      return;
    }

    if (!selectedUserId) {
      showToast("Please select an employee first", "error");
      return;
    }

    const monthNumber = monthNames[payPeriodMonth] || new Date().getMonth() + 1;
    const year = parseInt(payPeriodYear) || new Date().getFullYear();

    setIsConverting(true);
    try {
      const result = await dispatch(
        convertSalary({
          userId: selectedUserId,
          payPeriodMonth: monthNumber,
          payPeriodYear: year,
          targetCurrency: targetCurrency,
          conversionRates: conversionRatesList.map((item) => ({
            currency: item.currency,
            rate: item.rate,
          })),
        }),
      ).unwrap();

      // Get the original amounts from localSummaryData
      const originalGrossSalary =
        localSummaryData.gross_salary || localSummaryData.gross_earnings || 0;
      const originalOvertime = localSummaryData.overtime_amount || 0;
      const originalDeductions =
        localSummaryData.deductions || localSummaryData.total_deductions || 0;
      const originalNetPay = localSummaryData.net_pay || 0;

      // Get the base currency (first currency in the conversion list)
      const baseCurrency = conversionRatesList[0]?.currency || "INR";
      const baseRate = conversionRatesList[0]?.rate || 1;

      // Update conversion details with both original and converted values
      setConversionDetails({
        gross_salary: {
          amount: originalGrossSalary, // Original amount
          fromCurrency: baseCurrency,
          toCurrency: targetCurrency,
          rate: baseRate,
          convertedAmount: result.converted_gross_salary || 0, // Converted amount from API
        },
        overtime_amount: {
          amount: originalOvertime, // Original amount
          fromCurrency: baseCurrency,
          toCurrency: targetCurrency,
          rate: baseRate,
          convertedAmount: result.converted_overtime || 0, // Converted amount from API
        },
        deductions: {
          amount: originalDeductions, // Original amount
          fromCurrency: baseCurrency,
          toCurrency: targetCurrency,
          rate: baseRate,
          convertedAmount: result.converted_deductions || 0, // Converted amount from API
        },
        net_pay: {
          amount: originalNetPay, // Original amount
          fromCurrency: baseCurrency,
          toCurrency: targetCurrency,
          rate: baseRate,
          convertedAmount: result.converted_net_pay || 0, // Converted amount from API
        },
      });

      setIsConverted(true);
      showToast("Currency conversion completed successfully!", "success");
    } catch (error) {
      console.error("Conversion error:", error);
      showToast(error || "Failed to convert currency", "error");
    } finally {
      setIsConverting(false);
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = async (employeeId) => {
    setSelectedEmployee(employeeId);

    if (employeeId) {
      try {
        const result = await dispatch(fetchEmployeeById(employeeId)).unwrap();
        if (result && result.user_id) {
          setSelectedUserId(result.user_id.toString());
          // Fetch salary packages for this employee
          await dispatch(fetchEmployeeSalaryPackages(result.user_id));
        }
      } catch (error) {
        showToast("Failed to fetch employee details", error);
      }
    } else {
      clearEmployeeFields();
      setSelectedUserId("");
      setCountries([]);
      dispatch(clearEmployeePackages());
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

  // Auto-populate fields when employee data is loaded
  useEffect(() => {
    if (currentEmployee && selectedEmployee) {
      const user = currentEmployee.user || {};
      const fullName = [currentEmployee.first_name, currentEmployee.last_name]
        .filter(Boolean)
        .join(" ");

      if (currentEmployee.user_id) {
        setSelectedUserId(currentEmployee.user_id.toString());
        // Fetch salary packages for this employee
        dispatch(fetchEmployeeSalaryPackages(currentEmployee.user_id));
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

      if (!payPeriodMonth) {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const monthNum = String(currentMonth).padStart(2, "0");

        const monthNamesList = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
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
  }, [currentEmployee, employees, payPeriodMonth, selectedEmployee, dispatch]);

  // Update countries when employee packages are loaded
  useEffect(() => {
    if (employeePackages && employeePackages.length > 0) {
      const mappedCountries = employeePackages.map((pkg, index) => ({
        id: index + 1,
        name: pkg.name || `Package ${index + 1}`,
        currency: pkg.currency || "AED",
        dailyRate: pkg.daily_rate || pkg.rate || 0,
        daysWorked: pkg.days_worked || pkg.days || 0,
        fxRate: pkg.fx_rate || pkg.exchange_rate || 1,
        packageId: pkg.id || null,
        salary_components: [],
        subtotal: 0,
        is_saved: false,
      }));

      if (mappedCountries.length > 0) {
        setCountries(mappedCountries);
      }
    }
  }, [employeePackages]);

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

  // Update countries when calculated data arrives
  useEffect(() => {
    if (calculatedCountries) {
      const data = calculatedCountries;

      if (data.location_breakdown) {
        const updatedCountries = data.location_breakdown.map((loc, index) => ({
          id: index + 1,
          name: loc.location_name || "",
          currency: loc.currency?.code || loc.package?.currency || "AED",
          dailyRate:
            loc.salary_components?.length > 0
              ? loc.salary_components.reduce(
                  (sum, comp) => sum + comp.amount,
                  0,
                ) / (loc.worked_days || 1)
              : 0,
          daysWorked: loc.worked_days || 0,
          fxRate: 1,
          packageId: loc.package?.id || null,
          salary_components: loc.salary_components || [],
          subtotal: loc.subtotal || 0,
          is_saved: true,
        }));
        setCountries(updatedCountries);
      }

      setTotalEarnings(data.total_earnings || 0);
      setTotalDeductions(data.total_deductions || 0);
      setGrossSalary(data.gross_salary || 0);
      setNetSalary(data.net_salary || 0);
    }
  }, [calculatedCountries]);

  // Update overtime when data arrives
  // Update overtime when data arrives
  useEffect(() => {
    if (
      overtimeData &&
      Array.isArray(overtimeData) &&
      overtimeData.length > 0
    ) {
      // The API returns an array of objects with date, projects, etc.
      setOvertimeRequests(
        overtimeData.map((item, index) => ({
          id: index + 1,
          date: item.date || "",
          day: item.day || "",
          required_working_hours: item.required_working_hours || 0,
          total_logged_hours: item.total_logged_hours || 0,
          overtime_hours: item.overtime_hours || 0,
          projects: item.projects || [],
          // For backward compatibility with existing UI
          project: item.projects?.map((p) => p.project_name).join(", ") || "",
          hours: item.total_logged_hours || 0,
          overtime_amount: 0, // This will be set by user
          currency: item.currency || targetCurrency || "INR",
          status: "pending",
          reason: "",
        })),
      );
    }
  }, [overtimeData]);

  // Update summary when data arrives
  // Update summary when data arrives
  useEffect(() => {
    if (summaryData) {
      // The API returns: { gross_salary, overtime_amount, deductions, net_pay }
      setLocalSummaryData({
        gross_salary: summaryData.gross_salary || 0,
        overtime_amount: summaryData.overtime_amount || 0,
        deductions: summaryData.deductions || 0,
        net_pay: summaryData.net_pay || 0,
        // Keep backward compatibility
        gross_earnings: summaryData.gross_salary || 0,
        total_deductions: summaryData.deductions || 0,
        combined: summaryData.gross_salary || 0,
      });
    }
  }, [summaryData]);

  // ─── STEP 2: Calculate salary split by location ──────────────────────
  const handleCalculateSalarySplit = async () => {
    if (!selectedUserId) {
      showToast("Please select an employee first", "error");
      return;
    }

    const monthNumber = monthNames[payPeriodMonth] || new Date().getMonth() + 1;
    const monthFormatted = `${payPeriodYear}-${String(monthNumber).padStart(2, "0")}`;

    try {
      await dispatch(
        calculateSalarySplit({
          employeeId: selectedUserId,
          userId: selectedUserId,
          month: monthFormatted,
        }),
      ).unwrap();

      showToast("Salary split calculated successfully", "success");
    } catch (error) {
      console.error("Calculate salary split error:", error);
      showToast(error || "Failed to calculate salary split", "error");
    }
  };

  // ─── STEP 3: Fetch Overtime data ──────────────────────────────────────
  const handleFetchOvertime = async () => {
    if (!selectedUserId) {
      showToast("Please select an employee first", "error");
      return;
    }

    const monthNumber = monthNames[payPeriodMonth] || new Date().getMonth() + 1;
    const monthFormatted = `${payPeriodYear}-${String(monthNumber).padStart(2, "0")}`;

    try {
      await dispatch(
        fetchOvertimeData({
          employeeId: selectedUserId,
          userId: selectedUserId,
          month: monthFormatted,
        }),
      ).unwrap();

      showToast("Overtime data fetched successfully", "success");
    } catch (error) {
      console.error("Fetch overtime error:", error);
      showToast(error || "Failed to fetch overtime data", "error");
    }
  };

  // ─── STEP 5: Get Summary ──────────────────────────────────────────────
  const handleFetchSummary = async () => {
    if (!selectedUserId) {
      showToast("Please select an employee first", "error");
      return;
    }

    const monthNumber = monthNames[payPeriodMonth] || new Date().getMonth() + 1;
    const year = parseInt(payPeriodYear) || new Date().getFullYear();

    try {
      await dispatch(
        fetchPayrollSummary({
          userId: selectedUserId,
          payPeriodMonth: monthNumber,
          payPeriodYear: year,
        }),
      ).unwrap();

      showToast("Summary fetched successfully", "success");
    } catch (error) {
      console.error("Fetch summary error:", error);
      showToast(error || "Failed to fetch summary", "error");
    }
  };

  // Get current step data based on form state
  const getCurrentStepData = () => {
    const step = reduxCurrentStep;
    let data = {};

    const monthNumber = monthNames[payPeriodMonth] || new Date().getMonth() + 1;
    const year = parseInt(payPeriodYear) || new Date().getFullYear();

    switch (step) {
      case 1:
        data = {
          pay_period_month: monthNumber,
          pay_period_year: year,
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
          pay_period_month: monthNumber,
          pay_period_year: year,
          location_breakdown: countries.map((c) => ({
            location_name: c.name,
            package: {
              id: c.packageId,
              name: c.name,
              currency: c.currency,
            },
            worked_days: parseInt(c.daysWorked) || 0,
            currency: {
              code: c.currency,
              symbol: c.currency,
            },
            salary_components: c.salary_components || [],
            subtotal: c.subtotal || 0,
          })),
          total_earnings: totalEarnings,
          total_deductions: totalDeductions,
          gross_salary: grossSalary,
          net_salary: netSalary,
        };
        break;

      case 3:
        data = {
          pay_period_month: monthNumber,
          pay_period_year: year,
          overtime_details: overtimeRequests.map((req) => ({
            date: req.date,
            overtime_hours: parseFloat(req.hours) || 0,
            amount: parseFloat(req.overtime_amount) || 0,
            currency: req.currency || targetCurrency || "INR",
            status: req.status || "pending",
            projects: req.projects || [],
          })),
          total_overtime_amount: overtimeRequests.reduce(
            (sum, req) => sum + parseFloat(req.overtime_amount || 0),
            0,
          ),
        };
        break;

      case 4:
        data = {
          pay_period_month: monthNumber,
          pay_period_year: year,
          deductions: deductions.map((d) => ({
            type: d.type,
            currency: d.currency,
            amount: parseFloat(d.amount) || 0,
            is_statutory: d.is_statutory || "no",
          })),
          total_deductions: deductions.reduce(
            (sum, d) => sum + parseFloat(d.amount || 0),
            0,
          ),
        };
        break;

      case 5:
        const conversionRatesObj = {};
        countries.forEach((c) => {
          conversionRatesObj[c.currency] = parseFloat(c.fxRate) || 1;
        });

        data = {
          pay_period_month: monthNumber,
          pay_period_year: year,
          summary: {
            gross_salary: localSummaryData.gross_salary || 0,
            overtime_amount: localSummaryData.overtime_amount || 0,
            deductions: localSummaryData.deductions || 0,
            net_pay: localSummaryData.net_pay || 0,
            conversions: conversionDetails,
          },
          target_currency: targetCurrency,
          conversion_rates: conversionRatesObj,
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
      const monthNumber =
        monthNames[payPeriodMonth] || new Date().getMonth() + 1;
      const year = parseInt(payPeriodYear) || new Date().getFullYear();

      const enrichedData = {
        ...data,
        pay_period_month: data.pay_period_month || monthNumber,
        pay_period_year: data.pay_period_year || year,
      };

      console.log("Saving step with user_id:", selectedUserId);
      console.log("Step data:", enrichedData);

      const result = await dispatch(
        savePayrollStep({
          userId: selectedUserId,
          step: step,
          stepData: enrichedData,
        }),
      ).unwrap();

      dispatch(updateStepData({ step, data: enrichedData }));
      dispatch(markStepCompleted(step));

      if (result.data && result.data.current_step) {
        console.log("Current step from server:", result.data.current_step);
      }

      showToast(result.message || "Step data saved successfully", "success");
      return true;
    } catch (error) {
      console.error("Failed to save step:", error);
      showToast(
        typeof error === "string" ? error : "Failed to save step data",
        "error",
      );
      return false;
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

    if (saved || reduxCurrentStep === 1) {
      const nextStep = reduxCurrentStep + 1;
      if (nextStep <= 5) {
        dispatch(setCurrentStep(nextStep));

        const monthNumber =
          monthNames[payPeriodMonth] || new Date().getMonth() + 1;
        const monthFormatted = `${payPeriodYear}-${String(monthNumber).padStart(2, "0")}`;
        const year = parseInt(payPeriodYear) || new Date().getFullYear();

        if (nextStep === 2) {
          try {
            await dispatch(
              calculateSalarySplit({
                employeeId: selectedUserId,
                userId: selectedUserId,
                month: monthFormatted,
              }),
            );
          } catch (error) {
            console.error("Failed to calculate salary split:", error);
          }
        } else if (nextStep === 3) {
          try {
            await dispatch(
              fetchOvertimeData({
                employeeId: selectedUserId,
                userId: selectedUserId,
                month: monthFormatted,
              }),
            );
          } catch (error) {
            console.error("Failed to fetch overtime:", error);
          }
        } else if (nextStep === 5) {
          try {
            await dispatch(
              fetchPayrollSummary({
                userId: selectedUserId,
                payPeriodMonth: monthNumber,
                payPeriodYear: year,
              }),
            );
          } catch (error) {
            console.error("Failed to fetch summary:", error);
          }
        }
      }
    } else {
      showToast("Failed to save current step data", "error");
    }
  };

  // Handle step change
  const handleStepChange = async (step) => {
    if (!selectedUserId) {
      showToast("Please select an employee first", "error");
      return;
    }

    if (step <= reduxCurrentStep) {
      dispatch(setCurrentStep(step));
      return;
    }

    const currentData = getCurrentStepData();
    const saved = await handleSaveStep(reduxCurrentStep, currentData);

    if (saved || reduxCurrentStep === 1) {
      dispatch(setCurrentStep(step));

      const monthNumber =
        monthNames[payPeriodMonth] || new Date().getMonth() + 1;
      const monthFormatted = `${payPeriodYear}-${String(monthNumber).padStart(2, "0")}`;
      const year = parseInt(payPeriodYear) || new Date().getFullYear();

      if (step === 2) {
        try {
          await dispatch(
            calculateSalarySplit({
              employeeId: selectedUserId,
              userId: selectedUserId,
              month: monthFormatted,
            }),
          );
        } catch (error) {
          console.error("Failed to calculate salary split:", error);
        }
      } else if (step === 3) {
        try {
          await dispatch(
            fetchOvertimeData({
              employeeId: selectedUserId,
              userId: selectedUserId,
              month: monthFormatted,
            }),
          );
        } catch (error) {
          console.error("Failed to fetch overtime:", error);
        }
      } else if (step === 5) {
        try {
          await dispatch(
            fetchPayrollSummary({
              userId: selectedUserId,
              payPeriodMonth: monthNumber,
              payPeriodYear: year,
            }),
          );
        } catch (error) {
          console.error("Failed to fetch summary:", error);
        }
      }
    } else {
      showToast("Failed to save current step data", "error");
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

      const monthNumber =
        monthNames[payPeriodMonth] || new Date().getMonth() + 1;

      const payload = {
        user_id: selectedUserId,
        pay_period_month: monthNumber,
        pay_period_year: parseInt(payPeriodYear) || new Date().getFullYear(),
        target_currency: targetCurrency,
        conversion_rates: countries.reduce((acc, c) => {
          acc[c.currency] = parseFloat(c.fxRate) || 1;
          return acc;
        }, {}),
      };

      const result = await dispatch(submitPayroll(payload)).unwrap();

      showToast(
        result.message ||
          "Payroll submitted successfully! Payslip has been generated!.",
        "success",
      );
      generatePayslipPDF();

      setTimeout(() => {
        window.location.href = `${basePath}/payroll`;
      }, 3000);
    } catch (error) {
      showToast(error || "Failed to submit payroll", "error");
    }
  };

  // Overtime actions
  const handleOvertimeAction = (id, newStatus) => {
    setOvertimeRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req)),
    );
  };

  const handleOvertimeChange = (id, field, value) => {
    setOvertimeRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, [field]: value } : req)),
    );
  };

  // Country actions
  const handleCountryChange = (id, field, value) => {
    setCountries((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const handleAddCountry = () => {
    const newId =
      countries.length > 0 ? Math.max(...countries.map((c) => c.id)) + 1 : 1;
    setCountries([
      ...countries,
      {
        id: newId,
        name: "",
        currency: "INR",
        dailyRate: "",
        daysWorked: "",
        fxRate: "",
        packageId: null,
        salary_components: [],
        subtotal: 0,
        is_saved: false,
      },
    ]);
  };

  const handleRemoveCountry = (id) => {
    if (countries.length <= 1) {
      showToast("At least one country split is required", "error");
      return;
    }
    setCountries(countries.filter((c) => c.id !== id));
  };

  // Deduction actions
  const handleDeductionChange = (id, field, value) => {
    setDeductions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };

  const handleAddDeduction = () => {
    const newId =
      deductions.length > 0 ? Math.max(...deductions.map((d) => d.id)) + 1 : 1;
    setDeductions([
      ...deductions,
      {
        id: newId,
        type: "",
        currency: "INR",
        amount: "",
        is_statutory: "no",
      },
    ]);
  };

  const handleRemoveDeduction = (id) => {
    // Allow removal even if only one deduction exists
    setDeductions(deductions.filter((d) => d.id !== id));
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
      head: [["Package / Location", "Days Logged", "Daily Rate", "Amount"]],
      body: countries.map((c) => [
        c.name || "-",
        c.daysWorked || "0",
        `${c.currency || ""} ${c.dailyRate || "0"}`,
        `${(parseFloat(c.dailyRate) * parseFloat(c.daysWorked) * parseFloat(c.fxRate || 1)).toLocaleString()} ${targetCurrency}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Overtime Project", "Date", "Hours", "Overtime Amount"]],
      body: overtimeRequests.map((req) => [
        req.project,
        req.date,
        req.hours.toString(),
        `${req.overtime_amount} ${targetCurrency}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Deduction Type", "Currency", "Amount"]],
      body: deductions.map((d) => [
        d.type,
        d.currency,
        `${d.amount} ${d.currency}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: [239, 68, 68] },
    });

    const totalDeductions = deductions.reduce(
      (sum, d) => sum + parseFloat(d.amount || 0),
      0,
    );
    const grossEarnings = countries.reduce(
      (sum, c) =>
        sum +
        parseFloat(c.dailyRate) *
          parseFloat(c.daysWorked) *
          parseFloat(c.fxRate || 1),
      0,
    );
    const netPay = grossEarnings - totalDeductions;

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Gross Earnings", "Total Deductions", "Net Pay"]],
      body: [
        [
          `${grossEarnings.toLocaleString()} ${targetCurrency}`,
          `${totalDeductions.toLocaleString()} ${targetCurrency}`,
          `${netPay.toLocaleString()} ${targetCurrency}`,
        ],
      ],
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
          to={`${basePath}/payroll`}
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

          {/* Step 2 - Country Split / Packages - WITH EDITABLE FIELDS */}
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
                <button
                  onClick={handleCalculateSalarySplit}
                  disabled={countriesLoading}
                  className="ml-auto px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <i
                    className={`fas ${countriesLoading ? "fa-spinner fa-spin" : "fa-calculator"} mr-1`}
                  ></i>
                  {countriesLoading ? "Calculating..." : "Calculate"}
                </button>
              </div>

              {/* Employee Summary Card */}
              {selectedEmployee && countries.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 md:p-6 mb-6 border border-green-100 dark:border-green-800">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-lg">
                        {employeeName?.charAt(0) || "E"}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                          {employeeName || "Employee"}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Employee #{employeeId || "N/A"} • {payPeriodMonth}{" "}
                          {payPeriodYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                          {countries.reduce((sum, c) => sum + c.daysWorked, 0)}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Worked Days
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Country Cards with Editable Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {countries.map((country) => (
                  <div
                    key={country.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                          {country.name || "Location"}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{country.packageId ? "Saved" : "Unsaved"}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                          <span>{country.currency}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {country.daysWorked || 0}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                          Worked Days
                        </div>
                      </div>
                    </div>

                    {/* Body - Editable Salary Components */}
                    <div className="p-4 space-y-3">
                      {country.salary_components &&
                      country.salary_components.length > 0 ? (
                        <div className="space-y-2">
                          {country.salary_components.map((comp, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400 w-32 flex-shrink-0">
                                {comp.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                {country.currency}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                value={comp.amount}
                                onChange={(e) => {
                                  const newAmount =
                                    parseFloat(e.target.value) || 0;
                                  const updatedCountries = countries.map(
                                    (c) => {
                                      if (c.id === country.id) {
                                        const updatedComponents =
                                          c.salary_components.map((c2, i) =>
                                            i === idx
                                              ? { ...c2, amount: newAmount }
                                              : c2,
                                          );
                                        const newSubtotal =
                                          updatedComponents.reduce(
                                            (sum, c2) => sum + c2.amount,
                                            0,
                                          );
                                        return {
                                          ...c,
                                          salary_components: updatedComponents,
                                          subtotal: newSubtotal,
                                        };
                                      }
                                      return c;
                                    },
                                  );
                                  setCountries(updatedCountries);
                                  // Reset saved state when user makes changes
                                  setIsStep2Saved(false);
                                }}
                                className="flex-1 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                              />
                            </div>
                          ))}
                          <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between font-semibold">
                            <span className="text-gray-800 dark:text-gray-200">
                              Subtotal
                            </span>
                            <span className="text-green-600 dark:text-green-400">
                              {country.currency} {country.subtotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2 text-gray-400 text-sm">
                          No salary components
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Packages Button - Only in Step 2 */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={async () => {
                    const monthNumber =
                      monthNames[payPeriodMonth] || new Date().getMonth() + 1;
                    const year =
                      parseInt(payPeriodYear) || new Date().getFullYear();

                    const step2Data = {
                      pay_period_month: monthNumber,
                      pay_period_year: year,
                      location_breakdown: countries.map((c) => ({
                        location_name: c.name,
                        package: {
                          id: c.packageId,
                          name: c.name,
                          currency: c.currency,
                        },
                        worked_days: parseInt(c.daysWorked) || 0,
                        currency: {
                          code: c.currency,
                          symbol: c.currency,
                        },
                        salary_components: c.salary_components || [],
                        subtotal: c.subtotal || 0,
                      })),
                      total_earnings: totalEarnings,
                      total_deductions: totalDeductions,
                      gross_salary: grossSalary,
                      net_salary: netSalary,
                    };

                    const saved = await handleSaveStep(2, step2Data);
                    if (saved) {
                      setIsStep2Saved(true);
                      dispatch(markStepCompleted(2));
                      showToast(
                        "Salary packages saved successfully!",
                        "success",
                      );
                    }
                  }}
                  className="px-6 py-2.5 rounded-full font-semibold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center gap-2 text-sm shadow-md hover:shadow-lg"
                >
                  <i className="fas fa-save"></i> Save Packages
                </button>
              </div>

              {/* Mixed Currencies Notice */}
              {countries.some((c) => c.currency !== targetCurrency) && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Mixed currencies detected. Please review conversion rates in
                  the Summary tab.
                </div>
              )}
            </div>
          )}

          {/* Step 3 - Overtime */}
          {/* Step 3 - Overtime - Updated Input Field */}
          {reduxCurrentStep === 3 && (
            <div>
              <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4 md:mb-6">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-green-600 dark:text-green-400 text-xs md:text-sm"></i>
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                  Overtime
                </h3>
                <button
                  onClick={handleFetchOvertime}
                  disabled={overtimeLoading}
                  className="ml-auto px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <i
                    className={`fas ${overtimeLoading ? "fa-spinner fa-spin" : "fa-sync"} mr-1`}
                  ></i>
                  {overtimeLoading ? "Loading..." : "Fetch Overtime"}
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        <th className="py-3 px-4 font-semibold">Date</th>
                        <th className="py-3 px-4 font-semibold">Day</th>
                        <th className="py-3 px-4 font-semibold">
                          Required Hours
                        </th>
                        <th className="py-3 px-4 font-semibold">
                          Logged Hours
                        </th>
                        <th className="py-3 px-4 font-semibold">
                          Overtime Hours
                        </th>
                        <th className="py-3 px-4 font-semibold">Projects</th>
                        <th className="py-3 px-4 font-semibold text-center">
                          Overtime Amount
                        </th>
                        <th className="py-3 px-4 font-semibold text-center">
                          Currency
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {overtimeRequests.length > 0 ? (
                        overtimeRequests.map((req) => (
                          <tr
                            key={req.id}
                            className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                          >
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(req.date)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {req.day || "-"}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              {req.required_working_hours || 0}h
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {req.total_logged_hours || 0}h
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                              {req.overtime_hours || 0}h
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                              {req.projects && req.projects.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {req.projects.map((project, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] border border-blue-200 dark:border-blue-800"
                                    >
                                      {project.project_name} (
                                      {project.time_taken_hours || 0}h)
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={req.overtime_amount || ""}
                                onChange={(e) => {
                                  // Only allow numbers, decimal point, and backspace
                                  const value = e.target.value;
                                  // Remove any non-numeric characters except decimal point
                                  const cleaned = value.replace(/[^0-9.]/g, "");
                                  // Prevent multiple decimal points
                                  const parts = cleaned.split(".");
                                  let finalValue = cleaned;
                                  if (parts.length > 2) {
                                    finalValue =
                                      parts[0] + "." + parts.slice(1).join("");
                                  }
                                  // Limit to 2 decimal places
                                  if (finalValue.includes(".")) {
                                    const [whole, decimal] =
                                      finalValue.split(".");
                                    if (decimal && decimal.length > 2) {
                                      finalValue =
                                        whole + "." + decimal.slice(0, 2);
                                    }
                                  }
                                  handleOvertimeChange(
                                    req.id,
                                    "overtime_amount",
                                    finalValue,
                                  );
                                }}
                                onKeyDown={(e) => {
                                  // Allow: backspace, delete, tab, escape, enter, decimal point
                                  const allowedKeys = [
                                    "Backspace",
                                    "Delete",
                                    "Tab",
                                    "Escape",
                                    "Enter",
                                    ".",
                                    "Decimal",
                                  ];
                                  if (allowedKeys.includes(e.key)) {
                                    return;
                                  }
                                  // Allow numbers
                                  if (!/^[0-9]$/.test(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                className="w-24 px-2 py-1 text-sm rounded border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="py-3 px-4 text-center">
                              <select
                                value={req.currency || targetCurrency}
                                onChange={(e) =>
                                  handleOvertimeChange(
                                    req.id,
                                    "currency",
                                    e.target.value,
                                  )
                                }
                                className="w-20 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                              >
                                {currencies.map((curr) => (
                                  <option key={curr} value={curr}>
                                    {curr}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-8 text-center text-gray-500 dark:text-gray-400"
                          >
                            <i className="fas fa-clock text-4xl mb-3 block"></i>
                            No overtime data available. Click "Fetch Overtime"
                            to load data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {overtimeRequests.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                  <div className="flex gap-2">
                    <i className="fas fa-info-circle mt-0.5"></i>
                    <div>
                      <p className="font-semibold mb-1">Overtime Details:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>
                          <strong>Overtime Hours:</strong> Hours worked beyond
                          required working hours.
                        </li>
                        <li>
                          <strong>Overtime Amount:</strong> Enter the amount to
                          be paid for overtime (if applicable). Only numbers and
                          decimal points are allowed.
                        </li>
                        <li>
                          <strong>Total Overtime:</strong>{" "}
                          {overtimeRequests.reduce(
                            (sum, req) => sum + (req.overtime_hours || 0),
                            0,
                          )}{" "}
                          hours across{" "}
                          {
                            overtimeRequests.filter(
                              (r) => (r.overtime_hours || 0) > 0,
                            ).length
                          }{" "}
                          days.
                        </li>
                        <li>
                          <strong>Total Overtime Amount:</strong>{" "}
                          {overtimeRequests
                            .reduce(
                              (sum, req) =>
                                sum + (parseFloat(req.overtime_amount) || 0),
                              0,
                            )
                            .toFixed(2)}{" "}
                          {targetCurrency}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
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
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">
                        Type
                      </label>
                      <input
                        type="text"
                        value={d.type}
                        onChange={(e) =>
                          handleDeductionChange(d.id, "type", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        placeholder="e.g., PF 12%"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">
                        Currency
                      </label>
                      <select
                        value={d.currency}
                        onChange={(e) =>
                          handleDeductionChange(
                            d.id,
                            "currency",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      >
                        {currencies.map((curr) => (
                          <option key={curr} value={curr}>
                            {curr}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={d.amount}
                        onChange={(e) =>
                          handleDeductionChange(d.id, "amount", e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">
                        Statutory
                      </label>
                      <select
                        value={d.is_statutory}
                        onChange={(e) =>
                          handleDeductionChange(
                            d.id,
                            "is_statutory",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
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
            </div>
          )}

          {/* Step 5 - Summary */}
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
                <button
                  onClick={handleFetchSummary}
                  disabled={summaryLoading}
                  className="ml-auto px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <i
                    className={`fas ${summaryLoading ? "fa-spinner fa-spin" : "fa-sync"} mr-1`}
                  ></i>
                  {summaryLoading ? "Loading..." : "Refresh Summary"}
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Review the payroll details before final submission.
                </p>

                {/* Currency Conversion Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                  {/* Left Side - Target Currency */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Target Currency
                    </label>
                    <select
                      value={targetCurrency}
                      onChange={(e) => {
                        const newTarget = e.target.value;
                        setTargetCurrency(newTarget);
                        // Remove any conversion rates that match the new target currency
                        setConversionRatesList(
                          conversionRatesList.filter(
                            (item) => item.currency !== newTarget,
                          ),
                        );
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    >
                      {currencies.map((curr) => (
                        <option key={curr} value={curr}>
                          {curr}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-gray-400 mt-1">
                      All amounts will be converted to this currency
                    </p>
                  </div>

                  {/* Right Side - Dynamic Conversion Rates */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Conversion Rates (to {targetCurrency})
                      </label>
                      <button
                        onClick={() => {
                          const existingCurrencies = conversionRatesList.map(
                            (item) => item.currency,
                          );
                          const availableCurrency = currencies.find(
                            (c) =>
                              !existingCurrencies.includes(c) &&
                              c !== targetCurrency,
                          );
                          if (availableCurrency) {
                            setConversionRatesList([
                              ...conversionRatesList,
                              {
                                id: Date.now(),
                                currency: availableCurrency,
                                rate: 1,
                              },
                            ]);
                          } else {
                            showToast("All available currencies added", "info");
                          }
                        }}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                      >
                        <i className="fas fa-plus text-[10px]"></i> Add
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {conversionRatesList.length > 0 ? (
                        conversionRatesList.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <select
                              value={item.currency}
                              onChange={(e) => {
                                const newCurrency = e.target.value;
                                const exists = conversionRatesList.some(
                                  (i) =>
                                    i.id !== item.id &&
                                    i.currency === newCurrency,
                                );
                                if (exists) {
                                  showToast(
                                    "Currency already added",
                                    "warning",
                                  );
                                  return;
                                }
                                if (newCurrency === targetCurrency) {
                                  showToast(
                                    `Cannot convert ${targetCurrency} to itself`,
                                    "warning",
                                  );
                                  return;
                                }
                                setConversionRatesList(
                                  conversionRatesList.map((i) =>
                                    i.id === item.id
                                      ? { ...i, currency: newCurrency }
                                      : i,
                                  ),
                                );
                              }}
                              className="flex-1 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                            >
                              {currencies
                                .filter((c) => c !== targetCurrency)
                                .map((curr) => (
                                  <option key={curr} value={curr}>
                                    {curr}
                                  </option>
                                ))}
                            </select>
                            <span className="text-xs text-gray-400">→</span>
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400 w-8">
                              {targetCurrency}
                            </span>
                            <input
                              type="number"
                              step="0.0001"
                              min="0"
                              value={item.rate}
                              onChange={(e) => {
                                const rate = parseFloat(e.target.value) || 0;
                                setConversionRatesList(
                                  conversionRatesList.map((i) =>
                                    i.id === item.id ? { ...i, rate: rate } : i,
                                  ),
                                );
                              }}
                              className="w-20 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                              placeholder="1.0000"
                            />
                            <button
                              onClick={() => {
                                if (conversionRatesList.length <= 1) {
                                  showToast(
                                    "At least one conversion rate is required",
                                    "warning",
                                  );
                                  return;
                                }
                                setConversionRatesList(
                                  conversionRatesList.filter(
                                    (i) => i.id !== item.id,
                                  ),
                                );
                              }}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                          <i className="fas fa-plus-circle text-3xl text-gray-300 dark:text-gray-500 mb-2 block"></i>
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            No conversion rates added
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Click the{" "}
                            <span className="font-semibold text-green-500">
                              "Add"
                            </span>{" "}
                            button above to add currencies
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setConversionRatesList(
                            conversionRatesList.map((item) => ({
                              ...item,
                              rate: 1,
                            })),
                          );
                          showToast("All rates reset to 1", "info");
                        }}
                        className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        <i className="fas fa-undo mr-1"></i> Reset
                      </button>
                      <button
                        onClick={handleConvertCurrency}
                        disabled={
                          isConverting || conversionRatesList.length === 0
                        }
                        className="px-4 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        {isConverting ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>{" "}
                            Converting...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-calculator"></i> Convert
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Summary Cards - Updated to show converted values */}
                {/* Summary Cards - Show only converted values from API */}
                {isConverted && conversionDetails.gross_salary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Gross Salary */}
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-3">
                        Gross Salary
                      </div>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {conversionDetails.gross_salary.toCurrency}{" "}
                        {conversionDetails.gross_salary.convertedAmount.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        Rate: {conversionDetails.gross_salary.rate} (
                        {conversionDetails.gross_salary.fromCurrency} →{" "}
                        {conversionDetails.gross_salary.toCurrency})
                      </div>
                    </div>

                    {/* Overtime Amount */}
                    <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-3">
                        Overtime Amount
                      </div>
                      <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {conversionDetails.overtime_amount.toCurrency}{" "}
                        {conversionDetails.overtime_amount.convertedAmount.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        Rate: {conversionDetails.overtime_amount.rate} (
                        {conversionDetails.overtime_amount.fromCurrency} →{" "}
                        {conversionDetails.overtime_amount.toCurrency})
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-3">
                        Deductions
                      </div>
                      <div className="text-xl font-bold text-red-500">
                        {conversionDetails.deductions.toCurrency}{" "}
                        {conversionDetails.deductions.convertedAmount.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        Rate: {conversionDetails.deductions.rate} (
                        {conversionDetails.deductions.fromCurrency} →{" "}
                        {conversionDetails.deductions.toCurrency})
                      </div>
                    </div>

                    {/* Net Pay */}
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-3">
                        Net Pay
                      </div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        {conversionDetails.net_pay.toCurrency}{" "}
                        {conversionDetails.net_pay.convertedAmount.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        Rate: {conversionDetails.net_pay.rate} (
                        {conversionDetails.net_pay.fromCurrency} →{" "}
                        {conversionDetails.net_pay.toCurrency})
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                  <i className="fas fa-envelope text-blue-500 mt-1"></i>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                      Payslip Delivery
                    </h4>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                      Upon submission, the generated payslip will be
                      automatically sent to the employee via Email only.
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
                  disabled={
                    isLoading ||
                    isSubmitting ||
                    !selectedUserId ||
                    (reduxCurrentStep === 2 && !isStep2Saved)
                  }
                  className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span>Next Step</span>
                  <i className="fas fa-arrow-right text-xs md:text-sm"></i>
                </button>
              ) : (
                <button
                  onClick={handleSubmitPayroll}
                  disabled={isSubmitting || !selectedUserId || !isConverted} // Add !isConverted to disable until conversion is done
                  className="px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i
                    className={`fas ${isSubmitting ? "fa-spinner fa-spin" : "fa-file-invoice"} text-xs md:text-sm`}
                  ></i>
                  <span>
                    {isSubmitting ? "Submitting..." : "Generate Payslip"}
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
