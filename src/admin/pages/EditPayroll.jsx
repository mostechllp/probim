// src/admin/pages/EditPayroll.js - Complete rewrite to match AddPayroll style

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { showToast } from "../components/common/Toast";

import {
  savePayrollStep,
  submitPayroll,
  fetchPayrollById,
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
  selectCurrentPayroll,
  setCurrentPayroll,
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

function EditPayroll() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

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
  const currentPayroll = useSelector(selectCurrentPayroll);

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
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Step 2 - Country Split
  const [countries, setCountries] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [grossSalary, setGrossSalary] = useState(0);
  const [netSalary, setNetSalary] = useState(0);
  const [isStep2Saved, setIsStep2Saved] = useState(false);

  // Step 3 - Overtime
  const [overtimeRequests, setOvertimeRequests] = useState([]);

  // Step 4 - Deductions
  const [deductions, setDeductions] = useState([]);

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

  // Month number to name mapping
  const monthNumberToName = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December",
  };

  // Available currencies
  const currencies = ["AED", "INR", "USD", "EUR", "GBP", "PHP", "LKR"];

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

  // ─── Fetch payroll data on mount ─────────────────────────────────────
  useEffect(() => {
    if (id) {
      dispatch(fetchPayrollById(id));
    }
    dispatch(fetchEmployees());
    dispatch(clearEmployeePackages());
    dispatch(setCurrentStep(1));

    return () => {
      dispatch(resetCurrentEmployee());
      dispatch(clearEmployeePackages());
    };
  }, [dispatch, id]);

  // ─── Fetch payroll data on mount ─────────────────────────────────────
  useEffect(() => {
    // Reset all local state when ID changes
    setIsDataLoaded(false);
    setSelectedEmployee("");
    setSelectedUserId("");
    setEmployeeId("");
    setEmployeeName("");
    setOrganizationName("");
    setDepartment("");
    setDesignation("");
    setEmploymentType("");
    setPayPeriodMonth("");
    setPayPeriodYear("");
    setPeriodStart("");
    setPeriodEnd("");
    setPaymentDate("");
    setPaymentMode(null);
    setTotalWorkingDays("");
    setDaysPresent("");
    setCountries([]);
    setOvertimeRequests([]);
    setDeductions([]);
    setConversionRatesList([]);
    setConversionDetails({
      gross_salary: null,
      overtime_amount: null,
      deductions: null,
      net_pay: null,
    });
    setIsConverted(false);
    setIsStep2Saved(false);

    if (id) {
      dispatch(fetchPayrollById(id));
    }
    dispatch(fetchEmployees());
    dispatch(clearEmployeePackages());
    dispatch(setCurrentStep(1));

    return () => {
      dispatch(resetCurrentEmployee());
      dispatch(clearEmployeePackages());
      // Reset current payroll in Redux
      dispatch(setCurrentPayroll(null));
    };
  }, [dispatch, id]);

  // ─── Populate form with payroll data when loaded ────────────────────
  useEffect(() => {
    if (currentPayroll && !isDataLoaded) {
      const stepData = currentPayroll.step_data || {};

      // Set employee info
      if (currentPayroll.employee_name) {
        setEmployeeName(currentPayroll.employee_name);
      }

      // Find employee from employees list
      if (currentPayroll.employee_id && employees.length > 0) {
        const userId = parseInt(currentPayroll.employee_id);
        const foundEmployee = employees.find(
          (emp) => emp.user_id === userId || emp.id === userId,
        );

        if (foundEmployee) {
          setSelectedEmployee(foundEmployee.id);
          setEmployeeId(foundEmployee.employee_id || "");
          setEmployeeName(
            foundEmployee.name || currentPayroll.employee_name || "",
          );

          // Fetch employee details
          dispatch(fetchEmployeeById(foundEmployee.id))
            .unwrap()
            .then((data) => {
              if (data) {
                populateEmployeeFields(data);
              }
            })
            .catch(() => {});
        }
      }

      // Set pay period
      const monthName = currentPayroll.month
        ? monthNumberToName[currentPayroll.month]
        : stepData.step_1?.pay_period_month
          ? monthNumberToName[stepData.step_1.pay_period_month]
          : "";
      setPayPeriodMonth(monthName);
      setPayPeriodYear(
        currentPayroll.year?.toString() ||
          stepData.step_1?.pay_period_year?.toString() ||
          "",
      );
      setPeriodStart(stepData.step_1?.period_start || "");
      setPeriodEnd(stepData.step_1?.period_end || "");
      setPaymentDate(
        currentPayroll.payment_date || stepData.step_1?.payment_date || "",
      );
      setPaymentMode(stepData.step_1?.payment_mode || null);
      setTotalWorkingDays(
        stepData.step_1?.total_working_days?.toString() || "",
      );
      setDaysPresent(stepData.step_1?.days_present?.toString() || "");

      // Set countries from step_2
      if (stepData.step_2?.location_breakdown) {
        const mappedCountries = stepData.step_2.location_breakdown.map(
          (loc, index) => ({
            id: index + 1,
            name: loc.location_name || loc.package?.name || "",
            currency: loc.currency?.code || loc.package?.currency || "AED",
            dailyRate:
              loc.salary_components?.reduce(
                (sum, comp) => sum + comp.amount,
                0,
              ) / (loc.worked_days || 1) || 0,
            daysWorked: loc.worked_days || 0,
            fxRate: 1,
            packageId: loc.package?.id || null,
            salary_components: loc.salary_components || [],
            subtotal: loc.subtotal || 0,
            is_saved: true,
          }),
        );
        setCountries(mappedCountries);
        setTotalEarnings(stepData.step_2?.total_earnings || 0);
        setTotalDeductions(stepData.step_2?.total_deductions || 0);
        setGrossSalary(stepData.step_2?.gross_salary || 0);
        setNetSalary(stepData.step_2?.net_salary || 0);
        setIsStep2Saved(true);
      }

      // ─── FIX: Set overtime - MERGE data from step_3 and step_5 ───
      const step5Overtime = stepData.step_5?.overtime_details || [];
      const step3Overtime = stepData.step_3?.overtime_details || [];

      // Create a map of step_5 overtime by date for quick lookup
      const step5OvertimeMap = {};
      step5Overtime.forEach((ot) => {
        if (ot.date) {
          step5OvertimeMap[ot.date] = {
            amount: ot.amount || 0,
            currency: ot.currency || "INR",
            projects: ot.projects || [],
          };
        }
      });

      // Use step_3 for structure (overtime_hours, projects, etc.) but step_5 for amounts
      if (step3Overtime.length > 0) {
        setOvertimeRequests(
          step3Overtime.map((ot, index) => {
            const step5Data = step5OvertimeMap[ot.date] || {};
            return {
              id: index + 1,
              date: ot.date || "",
              day: ot.day || "",
              required_working_hours: ot.required_working_hours || 0,
              total_logged_hours: ot.total_logged_hours || 0,
              overtime_hours: ot.overtime_hours || 0,
              projects: ot.projects || [],
              project: ot.projects?.map((p) => p.project_name).join(", ") || "",
              hours: ot.overtime_hours || 0,
              // Use amount from step_5 if available
              overtime_amount: step5Data.amount || ot.amount || 0,
              // Use currency from step_5 if available
              currency: step5Data.currency || ot.currency || "INR",
              status: ot.status || "pending",
              reason: "",
            };
          }),
        );
      } else if (step5Overtime.length > 0) {
        // Fallback: if no step_3 data, use step_5 directly
        setOvertimeRequests(
          step5Overtime.map((ot, index) => ({
            id: index + 1,
            date: ot.date || "",
            day: "",
            required_working_hours: 0,
            total_logged_hours: 0,
            overtime_hours: 0,
            projects: ot.projects || [],
            project: ot.projects?.map((p) => p.project_name).join(", ") || "",
            hours: 0,
            overtime_amount: ot.amount || 0,
            currency: ot.currency || "INR",
            status: "pending",
            reason: "",
          })),
        );
      }

      // Set deductions from step_4
      if (stepData.step_4?.deductions) {
        setDeductions(
          stepData.step_4.deductions.map((d, index) => ({
            id: index + 1,
            type: d.type || "",
            currency: d.currency || "INR",
            amount: d.amount?.toString() || "0",
            is_statutory: d.is_statutory || "no",
          })),
        );
      }

      // Set target currency
      setTargetCurrency(
        stepData.step_5?.target_currency || currentPayroll.currency || "INR",
      );

      // Set conversion rates
      if (stepData.step_5?.conversion_rates) {
        const rates = Object.entries(stepData.step_5.conversion_rates).map(
          ([currency, rate]) => ({
            id: Date.now() + Math.random(),
            currency: currency,
            rate: parseFloat(rate) || 1,
          }),
        );
        setConversionRatesList(rates);
      }

      // Set local summary data
      setLocalSummaryData({
        gross_earnings: stepData.step_2?.gross_salary || 0,
        total_deductions: stepData.step_4?.total_deductions || 0,
        combined: stepData.step_2?.gross_salary || 0,
        net_pay: currentPayroll.net_pay || stepData.step_2?.net_salary || 0,
      });

      // If summary data exists with conversions, set it
      if (stepData.step_5?.summary?.conversions) {
        setConversionDetails(stepData.step_5.summary.conversions);
        setIsConverted(true);
      }

      setIsDataLoaded(true);
    }
  }, [currentPayroll, employees, isDataLoaded]);

  // ─── Populate employee fields ────────────────────────────────────────
  const populateEmployeeFields = (employee) => {
    const user = employee.user || {};
    const fullName = [employee.first_name, employee.last_name]
      .filter(Boolean)
      .join(" ");

    if (employee.user_id) {
      setSelectedUserId(employee.user_id.toString());
      dispatch(fetchEmployeeSalaryPackages(employee.user_id));
    }

    setEmployeeId(employee.employee_id || "");
    if (fullName) setEmployeeName(fullName);

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

    const deptName = user.department?.name || "N/A";
    setDepartment(deptName);

    const desigName = user.designation?.name || "N/A";
    setDesignation(desigName);

    setEmploymentType(user.type || user.employment_type || "employee");
  };

  // ─── Handle employee selection ──────────────────────────────────────
  const handleEmployeeSelect = async (employeeId) => {
    setSelectedEmployee(employeeId);

    if (employeeId) {
      try {
        const result = await dispatch(fetchEmployeeById(employeeId)).unwrap();
        if (result && result.user_id) {
          setSelectedUserId(result.user_id.toString());
          await dispatch(fetchEmployeeSalaryPackages(result.user_id));
          populateEmployeeFields(result);
        }
      } catch (error) {
        showToast("Failed to fetch employee details", "error");
      }
    } else {
      clearEmployeeFields();
      setSelectedUserId("");
      setCountries([]);
      dispatch(clearEmployeePackages());
    }
  };

  const clearEmployeeFields = () => {
    setEmployeeId("");
    setEmployeeName("");
    setOrganizationId("");
    setOrganizationName("");
    setDepartment("");
    setDesignation("");
    setEmploymentType("");
  };

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

      // Calculate original amounts in mixed currencies
      const originalGrossByCurrency = {};
      countries.forEach((c) => {
        const subtotal = c.subtotal || 0;
        if (subtotal > 0) {
          originalGrossByCurrency[c.currency] =
            (originalGrossByCurrency[c.currency] || 0) + subtotal;
        }
      });

      const originalOvertimeByCurrency = {};
      overtimeRequests.forEach((req) => {
        const amount = parseFloat(req.overtime_amount) || 0;
        if (amount > 0) {
          const currency = req.currency || "INR";
          originalOvertimeByCurrency[currency] =
            (originalOvertimeByCurrency[currency] || 0) + amount;
        }
      });

      const originalDeductionsByCurrency = {};
      deductions.forEach((d) => {
        const amount = parseFloat(d.amount) || 0;
        if (amount > 0) {
          originalDeductionsByCurrency[d.currency] =
            (originalDeductionsByCurrency[d.currency] || 0) + amount;
        }
      });

      const originalNetByCurrency = {};
      Object.keys(originalGrossByCurrency).forEach((currency) => {
        originalNetByCurrency[currency] =
          (originalNetByCurrency[currency] || 0) +
          (originalGrossByCurrency[currency] || 0);
      });
      Object.keys(originalOvertimeByCurrency).forEach((currency) => {
        originalNetByCurrency[currency] =
          (originalNetByCurrency[currency] || 0) +
          (originalOvertimeByCurrency[currency] || 0);
      });
      Object.keys(originalDeductionsByCurrency).forEach((currency) => {
        originalNetByCurrency[currency] =
          (originalNetByCurrency[currency] || 0) -
          (originalDeductionsByCurrency[currency] || 0);
      });

      let grossParts = [];
      let overtimeParts = [];
      let deductionParts = [];

      Object.entries(originalGrossByCurrency).forEach(([currency, amount]) => {
        if (amount > 0) grossParts.push(`${currency} ${amount.toFixed(2)}`);
      });
      Object.entries(originalOvertimeByCurrency).forEach(
        ([currency, amount]) => {
          if (amount > 0)
            overtimeParts.push(`${currency} ${amount.toFixed(2)}`);
        },
      );
      Object.entries(originalDeductionsByCurrency).forEach(
        ([currency, amount]) => {
          if (amount > 0)
            deductionParts.push(`${currency} ${amount.toFixed(2)}`);
        },
      );

      const grossStr =
        grossParts.length > 0 ? `(${grossParts.join(" + ")})` : "0";
      const overtimeStr =
        overtimeParts.length > 0 ? ` + (${overtimeParts.join(" + ")})` : "";
      const deductionStr =
        deductionParts.length > 0 ? ` - (${deductionParts.join(" + ")})` : "";
      const netPayBreakdown = `${grossStr}${overtimeStr}${deductionStr}`;

      setConversionDetails({
        gross_salary: {
          amount: 0,
          fromCurrency: "Mixed",
          toCurrency: targetCurrency,
          rate: "Multiple",
          convertedAmount: result.converted_gross_salary || 0,
          breakdown: Object.entries(originalGrossByCurrency)
            .map(([currency, amount]) => `${currency} ${amount.toFixed(2)}`)
            .join(" + "),
          currencyBreakdown: Object.entries(originalGrossByCurrency).map(
            ([currency, amount]) => ({ currency, amount }),
          ),
        },
        overtime_amount: {
          amount: 0,
          fromCurrency: "Mixed",
          toCurrency: targetCurrency,
          rate: "Multiple",
          convertedAmount: result.converted_overtime || 0,
          breakdown: Object.entries(originalOvertimeByCurrency)
            .map(([currency, amount]) => `${currency} ${amount.toFixed(2)}`)
            .join(" + "),
          currencyBreakdown: Object.entries(originalOvertimeByCurrency).map(
            ([currency, amount]) => ({ currency, amount }),
          ),
        },
        deductions: {
          amount: 0,
          fromCurrency: "Mixed",
          toCurrency: targetCurrency,
          rate: "Multiple",
          convertedAmount: result.converted_deductions || 0,
          breakdown: Object.entries(originalDeductionsByCurrency)
            .map(([currency, amount]) => `${currency} ${amount.toFixed(2)}`)
            .join(" + "),
          currencyBreakdown: Object.entries(originalDeductionsByCurrency).map(
            ([currency, amount]) => ({ currency, amount }),
          ),
        },
        net_pay: {
          amount: 0,
          fromCurrency: "Mixed",
          toCurrency: targetCurrency,
          rate: "Multiple",
          convertedAmount: result.converted_net_pay || 0,
          breakdown: netPayBreakdown,
          currencyBreakdown: Object.entries(originalNetByCurrency)
            .filter(([_, amount]) => amount !== 0)
            .map(([currency, amount]) => ({ currency, amount })),
          grossParts: grossParts,
          overtimeParts: overtimeParts,
          deductionParts: deductionParts,
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

  // ─── STEP 2: Calculate salary split ──────────────────────────────────
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

  // ─── STEP 3: Fetch Overtime ──────────────────────────────────────────
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

  // ─── Get current step data ────────────────────────────────────────────
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
        conversionRatesList.forEach((item) => {
          conversionRatesObj[item.currency] = parseFloat(item.rate) || 1;
        });

        const convertedGrossSalary =
          conversionDetails.gross_salary?.convertedAmount || 0;
        const convertedOvertime =
          conversionDetails.overtime_amount?.convertedAmount || 0;
        const convertedDeductions =
          conversionDetails.deductions?.convertedAmount || 0;
        const convertedNetPay = conversionDetails.net_pay?.convertedAmount || 0;

        data = {
          pay_period_month: monthNumber,
          pay_period_year: year,
          summary: {
            gross_salary: convertedGrossSalary,
            overtime_amount: convertedOvertime,
            deductions: convertedDeductions,
            net_pay: convertedNetPay,
            conversions: conversionDetails,
            original_breakdown: {
              gross_salary: conversionDetails.gross_salary?.breakdown || "",
              overtime: conversionDetails.overtime_amount?.breakdown || "",
              deductions: conversionDetails.deductions?.breakdown || "",
              net_pay: conversionDetails.net_pay?.breakdown || "",
            },
          },
          target_currency: targetCurrency,
          conversion_rates: conversionRatesObj,
          gross_salary: convertedGrossSalary,
          overtime: convertedOvertime,
          deductions: convertedDeductions,
          net_pay: convertedNetPay,
          currency:
            targetCurrency ||
            (countries.length > 0 ? countries[0].currency : "INR"),
          location_breakdown: countries.map((c) => ({
            location_name: c.name,
            currency: c.currency,
            subtotal: c.subtotal || 0,
            worked_days: c.daysWorked || 0,
            salary_components: c.salary_components || [],
          })),
          overtime_details: overtimeRequests.map((req) => ({
            date: req.date,
            overtime_hours: req.overtime_hours || 0,
            amount: parseFloat(req.overtime_amount) || 0,
            currency: req.currency || targetCurrency || "INR",
            projects: req.projects || [],
          })),
          deductions_details: deductions.map((d) => ({
            type: d.type,
            amount: parseFloat(d.amount) || 0,
            currency: d.currency || targetCurrency || "INR",
            is_statutory: d.is_statutory || "no",
          })),
        };
        break;

      default:
        data = {};
    }

    return data;
  };

  // ─── Save current step data ──────────────────────────────────────────
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

  // ─── Handle next step ────────────────────────────────────────────────
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

  // ─── Handle step change ──────────────────────────────────────────────
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

  // ─── Handle previous step ────────────────────────────────────────────
  const handlePreviousStep = () => {
    if (reduxCurrentStep > 1) {
      dispatch(setCurrentStep(reduxCurrentStep - 1));
    }
  };

  // ─── Handle update submission ────────────────────────────────────────
  const handleUpdatePayroll = async () => {
    if (!selectedUserId) {
      showToast("Please select an employee first", "error");
      return;
    }

    if (!isConverted) {
      showToast("Please convert the currency first before updating", "warning");
      return;
    }

    try {
      const finalData = getCurrentStepData();
      const saved = await handleSaveStep(5, finalData);

      if (!saved) {
        showToast("Failed to save payroll data. Please try again.", "error");
        return;
      }

      const monthNumber =
        monthNames[payPeriodMonth] || new Date().getMonth() + 1;
      const year = parseInt(payPeriodYear) || new Date().getFullYear();

      const convertedGrossSalary =
        conversionDetails.gross_salary?.convertedAmount || 0;
      const convertedOvertime =
        conversionDetails.overtime_amount?.convertedAmount || 0;
      const convertedDeductions =
        conversionDetails.deductions?.convertedAmount || 0;
      const convertedNetPay =
        convertedGrossSalary + convertedOvertime - convertedDeductions;

      const primaryCurrency = targetCurrency || "INR";

      const payload = {
        user_id: parseInt(selectedUserId),
        pay_period_month: parseInt(monthNumber),
        pay_period_year: parseInt(year),
        gross_salary: parseFloat(convertedGrossSalary),
        overtime: parseFloat(convertedOvertime),
        deductions: parseFloat(convertedDeductions),
        net_pay: parseFloat(convertedNetPay),
        currency: primaryCurrency,
        target_currency: targetCurrency,
        conversion_rates: conversionRatesList.reduce((acc, item) => {
          acc[item.currency] = parseFloat(item.rate) || 1;
          return acc;
        }, {}),
        location_breakdown: countries.map((c) => ({
          location_name: c.name,
          currency: c.currency,
          subtotal: c.subtotal || 0,
          worked_days: c.daysWorked || 0,
          salary_components: c.salary_components || [],
        })),
        overtime_details: overtimeRequests.map((req) => ({
          date: req.date,
          overtime_hours: req.overtime_hours || 0,
          amount_original: parseFloat(req.overtime_amount) || 0,
          currency_original: req.currency || "INR",
          amount_converted: parseFloat(req.overtime_amount) || 0,
          projects: req.projects || [],
        })),
        deductions_details: deductions.map((d) => ({
          type: d.type,
          amount_original: parseFloat(d.amount) || 0,
          currency_original: d.currency || "INR",
          amount_converted: parseFloat(d.amount) || 0,
          is_statutory: d.is_statutory || "no",
        })),
        conversion_details: {
          gross_salary: {
            original_breakdown: conversionDetails.gross_salary?.breakdown || "",
            converted_amount: convertedGrossSalary,
            target_currency: targetCurrency,
            rates: conversionRatesList,
          },
          overtime: {
            original_breakdown:
              conversionDetails.overtime_amount?.breakdown || "",
            converted_amount: convertedOvertime,
            target_currency: targetCurrency,
          },
          deductions: {
            original_breakdown: conversionDetails.deductions?.breakdown || "",
            converted_amount: convertedDeductions,
            target_currency: targetCurrency,
          },
          net_pay: {
            original_breakdown: conversionDetails.net_pay?.breakdown || "",
            converted_amount: convertedNetPay,
            target_currency: targetCurrency,
          },
        },
      };

      console.log("Updating payroll with CONVERTED amounts:", {
        gross_salary: convertedGrossSalary,
        overtime: convertedOvertime,
        deductions: convertedDeductions,
        net_pay: convertedNetPay,
        currency: primaryCurrency,
      });

      await dispatch(submitPayroll(payload)).unwrap();

      if (saved) {
        showToast("Payroll updated successfully!", "success");
        dispatch(setCurrentPayroll(null)); // Clear the current payroll
        setTimeout(() => {
          navigate(`${basePath}/payroll/${id}`);
        }, 2000);
      }
    } catch (error) {
      console.error("Update payroll error:", error);
      showToast(
        typeof error === "string" ? error : "Failed to update payroll",
        "error",
      );
    }
  };

  // ─── Handle cancel ────────────────────────────────────────────────────
  const handleCancel = () => {
    dispatch(setCurrentPayroll(null)); // Clear the current payroll
    navigate(`${basePath}/payroll`);
  };

  // ─── Overtime actions ─────────────────────────────────────────────────
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

  // ─── Country actions ──────────────────────────────────────────────────
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

  // ─── Deduction actions ────────────────────────────────────────────────
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
    setDeductions(deductions.filter((d) => d.id !== id));
  };

  // ─── Generate payslip PDF ─────────────────────────────────────────────
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
    doc.text(`Currency: ${targetCurrency}`, 14, 56);

    // Country Split Table
    const countryRows = countries.map((c) => {
      const subtotal = c.subtotal || 0;
      let convertedAmount = subtotal;
      if (c.currency !== targetCurrency) {
        const rate =
          conversionRatesList.find((r) => r.currency === c.currency)?.rate || 1;
        convertedAmount = subtotal * rate;
      }
      return [
        c.name || "-",
        c.daysWorked || "0",
        `${c.currency || ""} ${(c.dailyRate || 0).toFixed(2)}`,
        `${targetCurrency} ${convertedAmount.toFixed(2)}`,
      ];
    });

    autoTable(doc, {
      startY: 62,
      head: [
        [
          "Package / Location",
          "Days Logged",
          "Daily Rate",
          `Amount (${targetCurrency})`,
        ],
      ],
      body: countryRows,
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });

    // Overtime Table
    const overtimeRows = overtimeRequests.map((req) => {
      const amount = parseFloat(req.overtime_amount) || 0;
      let convertedAmount = amount;
      if (req.currency && req.currency !== targetCurrency) {
        const rate =
          conversionRatesList.find((r) => r.currency === req.currency)?.rate ||
          1;
        convertedAmount = amount * rate;
      }
      return [
        req.project || "-",
        req.date || "-",
        (req.overtime_hours || req.hours || 0).toString(),
        `${targetCurrency} ${convertedAmount.toFixed(2)}`,
      ];
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [
        [
          "Overtime Project",
          "Date",
          "Hours",
          `Overtime Amount (${targetCurrency})`,
        ],
      ],
      body: overtimeRows,
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });

    // Deductions Table
    const deductionRows = deductions.map((d) => {
      const amount = parseFloat(d.amount) || 0;
      let convertedAmount = amount;
      if (d.currency && d.currency !== targetCurrency) {
        const rate =
          conversionRatesList.find((r) => r.currency === d.currency)?.rate || 1;
        convertedAmount = amount * rate;
      }
      return [
        d.type || "-",
        d.currency || targetCurrency,
        `${targetCurrency} ${convertedAmount.toFixed(2)}`,
      ];
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Deduction Type", "Currency", `Amount (${targetCurrency})`]],
      body: deductionRows,
      theme: "grid",
      headStyles: { fillColor: [239, 68, 68] },
    });

    // Summary
    let totalGrossConverted = 0;
    countries.forEach((c) => {
      const subtotal = c.subtotal || 0;
      if (c.currency !== targetCurrency) {
        const rate =
          conversionRatesList.find((r) => r.currency === c.currency)?.rate || 1;
        totalGrossConverted += subtotal * rate;
      } else {
        totalGrossConverted += subtotal;
      }
    });

    let totalOvertimeConverted = 0;
    overtimeRequests.forEach((req) => {
      const amount = parseFloat(req.overtime_amount) || 0;
      if (req.currency && req.currency !== targetCurrency) {
        const rate =
          conversionRatesList.find((r) => r.currency === req.currency)?.rate ||
          1;
        totalOvertimeConverted += amount * rate;
      } else {
        totalOvertimeConverted += amount;
      }
    });

    let totalDeductionsConverted = 0;
    deductions.forEach((d) => {
      const amount = parseFloat(d.amount) || 0;
      if (d.currency && d.currency !== targetCurrency) {
        const rate =
          conversionRatesList.find((r) => r.currency === d.currency)?.rate || 1;
        totalDeductionsConverted += amount * rate;
      } else {
        totalDeductionsConverted += amount;
      }
    });

    const totalNetPay =
      totalGrossConverted + totalOvertimeConverted - totalDeductionsConverted;

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Gross Earnings", "Overtime", "Total Deductions", "Net Pay"]],
      body: [
        [
          `${targetCurrency} ${totalGrossConverted.toFixed(2)}`,
          `${targetCurrency} ${totalOvertimeConverted.toFixed(2)}`,
          `${targetCurrency} ${totalDeductionsConverted.toFixed(2)}`,
          `${targetCurrency} ${totalNetPay.toFixed(2)}`,
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });

    if (conversionRatesList.length > 0) {
      const rateInfo = conversionRatesList
        .map((r) => `${r.currency} to ${targetCurrency}: ${r.rate}`)
        .join(", ");
      doc.setFontSize(9);
      doc.text(
        `Conversion Rates: ${rateInfo}`,
        14,
        doc.lastAutoTable.finalY + 10,
      );
    }

    doc.save(`Payslip_${employeeName.replace(/\s/g, "_")}_${employeeId}.pdf`);
    showToast("Payslip generated successfully!", "success");
  };

  // ─── Handle success/error messages ────────────────────────────────────
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

  // ─── Update countries when calculated data arrives ──────────────────
  useEffect(() => {
    if (calculatedCountries) {
      const data = calculatedCountries;
      if (data.location_breakdown) {
        const updatedCountries = data.location_breakdown.map((loc, index) => ({
          id: index + 1,
          name: loc.location_name || "",
          currency: loc.currency?.code || loc.package?.currency || "AED",
          dailyRate:
            loc.salary_components?.reduce((sum, comp) => sum + comp.amount, 0) /
              (loc.worked_days || 1) || 0,
          daysWorked: loc.worked_days || 0,
          fxRate: 1,
          packageId: loc.package?.id || null,
          salary_components: loc.salary_components || [],
          subtotal: loc.subtotal || 0,
          is_saved: true,
        }));
        setCountries(updatedCountries);
        setTotalEarnings(data.total_earnings || 0);
        setTotalDeductions(data.total_deductions || 0);
        setGrossSalary(data.gross_salary || 0);
        setNetSalary(data.net_salary || 0);
      }
    }
  }, [calculatedCountries]);

  // ─── Update overtime when data arrives ──────────────────────────────
  useEffect(() => {
    if (
      overtimeData &&
      Array.isArray(overtimeData) &&
      overtimeData.length > 0
    ) {
      setOvertimeRequests(
        overtimeData.map((item, index) => ({
          id: index + 1,
          date: item.date || "",
          day: item.day || "",
          required_working_hours: item.required_working_hours || 0,
          total_logged_hours: item.total_logged_hours || 0,
          overtime_hours: item.overtime_hours || 0,
          projects: item.projects || [],
          project: item.projects?.map((p) => p.project_name).join(", ") || "",
          hours: item.total_logged_hours || 0,
          overtime_amount: 0,
          currency: item.currency || targetCurrency || "INR",
          status: "pending",
          reason: "",
        })),
      );
    }
  }, [overtimeData]);

  // ─── Update summary when data arrives ───────────────────────────────
  useEffect(() => {
    if (summaryData) {
      setLocalSummaryData({
        gross_salary: summaryData.gross_salary || 0,
        overtime_amount: summaryData.overtime_amount || 0,
        deductions: summaryData.deductions || 0,
        net_pay: summaryData.net_pay || 0,
        gross_earnings: summaryData.gross_salary || 0,
        total_deductions: summaryData.deductions || 0,
        combined: summaryData.gross_salary || 0,
      });
    }
  }, [summaryData]);

  if (isLoading && !isDataLoaded) {
    return (
      <div className="w-full overflow-x-hidden px-4 md:px-6">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (!currentPayroll && isDataLoaded) {
    return (
      <div className="w-full overflow-x-hidden px-4 md:px-6">
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <i className="fas fa-file-invoice text-6xl text-gray-300 dark:text-gray-600 mb-4 block"></i>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Payroll not found
          </h3>
          <button
            onClick={() => navigate(`${basePath}/payroll`)}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Back to Payroll
          </button>
        </div>
      </div>
    );
  }

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
        <Link
          to={`${basePath}/payroll/${id}`}
          className="text-green-500 hover:text-green-600 font-medium"
        >
          Payroll Details
        </Link>
        <i className="fas fa-chevron-right text-gray-400 text-[10px] md:text-xs"></i>
        <span className="text-gray-500 dark:text-gray-400">Edit Payroll</span>
      </div>

      {/* Page Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-green-600 dark:from-gray-200 dark:to-green-400 bg-clip-text text-transparent">
          <i className="fas fa-edit mr-2"></i> Edit Payroll
        </h2>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Update employee salary, country-wise work splits, and deductions
        </p>
      </div>

      {/* Status Banner */}
      {currentPayroll?.status && (
        <div
          className={`mb-4 p-3 rounded-lg border ${
            currentPayroll.status === "completed" ||
            currentPayroll.status === "paid"
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
              : currentPayroll.status === "pending"
                ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300"
                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <i
              className={`fas ${
                currentPayroll.status === "completed" ||
                currentPayroll.status === "paid"
                  ? "fa-check-circle"
                  : currentPayroll.status === "pending"
                    ? "fa-clock"
                    : "fa-file"
              }`}
            ></i>
            <span className="font-semibold capitalize">
              Current Status: {currentPayroll.status}
            </span>
            {(currentPayroll.status === "completed" ||
              currentPayroll.status === "paid") && (
              <span className="text-sm text-yellow-600 dark:text-yellow-400">
                • Some fields may be read-only
              </span>
            )}
          </div>
        </div>
      )}

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
                      disabled={
                        employeesLoading ||
                        currentPayroll?.status === "completed" ||
                        currentPayroll?.status === "paid"
                      }
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
                      disabled={
                        !selectedUserId ||
                        currentPayroll?.status === "completed" ||
                        currentPayroll?.status === "paid"
                      }
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
                      disabled={
                        !selectedUserId ||
                        currentPayroll?.status === "completed" ||
                        currentPayroll?.status === "paid"
                      }
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
                        disabled={
                          !selectedUserId ||
                          currentPayroll?.status === "completed" ||
                          currentPayroll?.status === "paid"
                        }
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
                        disabled={
                          !selectedUserId ||
                          currentPayroll?.status === "completed" ||
                          currentPayroll?.status === "paid"
                        }
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
                        disabled={
                          !selectedUserId ||
                          currentPayroll?.status === "completed" ||
                          currentPayroll?.status === "paid"
                        }
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
                      disabled={
                        !selectedUserId ||
                        currentPayroll?.status === "completed" ||
                        currentPayroll?.status === "paid"
                      }
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
                      disabled={
                        !selectedUserId ||
                        currentPayroll?.status === "completed" ||
                        currentPayroll?.status === "paid"
                      }
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
                      disabled={
                        !selectedUserId ||
                        currentPayroll?.status === "completed" ||
                        currentPayroll?.status === "paid"
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2 - Country Split */}
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

              {/* Country Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {countries.map((country) => (
                  <div
                    key={country.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
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
                                  setIsStep2Saved(false);
                                }}
                                className="flex-1 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                                disabled={
                                  currentPayroll?.status === "completed" ||
                                  currentPayroll?.status === "paid"
                                }
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

              {/* Save Packages Button */}
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
                  disabled={
                    currentPayroll?.status === "completed" ||
                    currentPayroll?.status === "paid"
                  }
                >
                  <i className="fas fa-save"></i> Save Packages
                </button>
              </div>

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
                                  const value = e.target.value;
                                  const cleaned = value.replace(/[^0-9.]/g, "");
                                  const parts = cleaned.split(".");
                                  let finalValue = cleaned;
                                  if (parts.length > 2) {
                                    finalValue =
                                      parts[0] + "." + parts.slice(1).join("");
                                  }
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
                                  const allowedKeys = [
                                    "Backspace",
                                    "Delete",
                                    "Tab",
                                    "Escape",
                                    "Enter",
                                    ".",
                                    "Decimal",
                                  ];
                                  if (allowedKeys.includes(e.key)) return;
                                  if (!/^[0-9]$/.test(e.key))
                                    e.preventDefault();
                                }}
                                className="w-24 px-2 py-1 text-sm rounded border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
                                placeholder="0.00"
                                disabled={
                                  currentPayroll?.status === "completed" ||
                                  currentPayroll?.status === "paid"
                                }
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
                                disabled={
                                  currentPayroll?.status === "completed" ||
                                  currentPayroll?.status === "paid"
                                }
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
                          be paid for overtime.
                        </li>
                        <li>
                          <strong>Total Overtime:</strong>{" "}
                          {overtimeRequests.reduce(
                            (sum, req) => sum + (req.overtime_hours || 0),
                            0,
                          )}{" "}
                          hours
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
                        disabled={
                          currentPayroll?.status === "completed" ||
                          currentPayroll?.status === "paid"
                        }
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
                        disabled={
                          currentPayroll?.status === "completed" ||
                          currentPayroll?.status === "paid"
                        }
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
                        disabled={
                          currentPayroll?.status === "completed" ||
                          currentPayroll?.status === "paid"
                        }
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
                        disabled={
                          currentPayroll?.status === "completed" ||
                          currentPayroll?.status === "paid"
                        }
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <button
                        onClick={() => handleRemoveDeduction(d.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center"
                        disabled={
                          currentPayroll?.status === "completed" ||
                          currentPayroll?.status === "paid"
                        }
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
                disabled={
                  currentPayroll?.status === "completed" ||
                  currentPayroll?.status === "paid"
                }
              >
                <i className="fas fa-plus"></i> Add Deduction
              </button>
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
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Target Currency
                    </label>
                    <select
                      value={targetCurrency}
                      onChange={(e) => {
                        const newTarget = e.target.value;
                        setTargetCurrency(newTarget);
                        setConversionRatesList(
                          conversionRatesList.filter(
                            (item) => item.currency !== newTarget,
                          ),
                        );
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      disabled={
                        currentPayroll?.status === "completed" ||
                        currentPayroll?.status === "paid"
                      }
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
                          const allCurrencies = countries
                            .map((c) => c.currency)
                            .filter(Boolean);
                          const availableCurrencies = [
                            ...new Set(allCurrencies),
                          ].filter(
                            (c) =>
                              !existingCurrencies.includes(c) &&
                              c !== targetCurrency,
                          );

                          if (availableCurrencies.length > 0) {
                            setConversionRatesList([
                              ...conversionRatesList,
                              ...availableCurrencies.map((c) => ({
                                id: Date.now() + Math.random(),
                                currency: c,
                                rate: 1,
                              })),
                            ]);
                          } else {
                            showToast("All available currencies added", "info");
                          }
                        }}
                        className="px-2 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                        disabled={
                          currentPayroll?.status === "completed" ||
                          currentPayroll?.status === "paid"
                        }
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
                              disabled={
                                currentPayroll?.status === "completed" ||
                                currentPayroll?.status === "paid"
                              }
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
                              disabled={
                                currentPayroll?.status === "completed" ||
                                currentPayroll?.status === "paid"
                              }
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
                              disabled={
                                currentPayroll?.status === "completed" ||
                                currentPayroll?.status === "paid"
                              }
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
                            button above
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
                        disabled={
                          currentPayroll?.status === "completed" ||
                          currentPayroll?.status === "paid"
                        }
                      >
                        <i className="fas fa-undo mr-1"></i> Reset
                      </button>
                      <button
                        onClick={handleConvertCurrency}
                        disabled={
                          isConverting ||
                          conversionRatesList.length === 0 ||
                          currentPayroll?.status === "completed" ||
                          currentPayroll?.status === "paid"
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

                {!isConverted && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Gross Salary */}
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          Gross Salary
                        </div>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded">
                          from Country Split
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="text-[10px] text-gray-500 mb-1">
                          Currency Breakdown:
                        </div>
                        {countries.map((country, idx) => {
                          const subtotal = country.subtotal || 0;
                          if (subtotal > 0) {
                            return (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-gray-600 dark:text-gray-400">
                                  {country.name}:
                                </span>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                  {country.currency} {subtotal.toFixed(2)}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })}

                        <div className="border-t border-blue-200 dark:border-blue-700 mt-1 pt-1 flex justify-between items-center font-semibold">
                          <span className="text-gray-600 dark:text-gray-400">
                            Total :
                          </span>
                          <span className="text-blue-600 dark:text-blue-400">
                            {countries
                              .filter((c) => (c.subtotal || 0) > 0)
                              .map(
                                (c) =>
                                  `${c.currency} ${(c.subtotal || 0).toFixed(2)}`,
                              )
                              .join(" + ")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Overtime Amount */}
                    <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          Overtime Amount
                        </div>
                        <span className="text-[10px] bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-300 px-2 py-0.5 rounded">
                          from Overtime
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="text-[10px] text-gray-500 mb-1">
                          Overtime Entries:
                        </div>
                        {overtimeRequests
                          .filter(
                            (req) => parseFloat(req.overtime_amount || 0) > 0,
                          )
                          .map((req, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600 dark:text-gray-400">
                                {req.date}: {req.overtime_hours || 0}h
                              </span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {req.currency || "INR"}{" "}
                                {(parseFloat(req.overtime_amount) || 0).toFixed(
                                  2,
                                )}
                              </span>
                            </div>
                          ))}
                        {overtimeRequests.filter(
                          (req) => parseFloat(req.overtime_amount || 0) > 0,
                        ).length === 0 && (
                          <div className="text-sm text-gray-400">
                            No overtime entries
                          </div>
                        )}

                        {overtimeRequests.filter(
                          (req) => parseFloat(req.overtime_amount || 0) > 0,
                        ).length > 0 && (
                          <div className="border-t border-orange-200 dark:border-orange-700 mt-1 pt-1 flex justify-between items-center font-semibold">
                            <span className="text-gray-600 dark:text-gray-400">
                              Total :
                            </span>
                            <span className="text-orange-600 dark:text-orange-400">
                              {overtimeRequests
                                .filter(
                                  (req) =>
                                    parseFloat(req.overtime_amount || 0) > 0,
                                )
                                .map(
                                  (req) =>
                                    `${req.currency || "INR"} ${(parseFloat(req.overtime_amount) || 0).toFixed(2)}`,
                                )
                                .join(" + ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          Deductions
                        </div>
                        <span className="text-[10px] bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300 px-2 py-0.5 rounded">
                          from Deductions
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="text-[10px] text-gray-500 mb-1">
                          Deduction Entries:
                        </div>
                        {deductions
                          .filter((d) => parseFloat(d.amount || 0) > 0)
                          .map((d, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600 dark:text-gray-400">
                                {d.type || "Unnamed"}
                              </span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {d.currency}{" "}
                                {(parseFloat(d.amount) || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        {deductions.filter((d) => parseFloat(d.amount || 0) > 0)
                          .length === 0 && (
                          <div className="text-sm text-gray-400">
                            No deductions
                          </div>
                        )}

                        {deductions.filter((d) => parseFloat(d.amount || 0) > 0)
                          .length > 0 && (
                          <div className="border-t border-red-200 dark:border-red-700 mt-1 pt-1 flex justify-between items-center font-semibold">
                            <span className="text-gray-600 dark:text-gray-400">
                              Total :
                            </span>
                            <span className="text-red-500">
                              {deductions
                                .filter((d) => parseFloat(d.amount || 0) > 0)
                                .map(
                                  (d) =>
                                    `${d.currency} ${(parseFloat(d.amount) || 0).toFixed(2)}`,
                                )
                                .join(" + ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Net Pay */}
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          Net Pay
                        </div>
                        <span className="text-[10px] bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300 px-2 py-0.5 rounded">
                          Calculated
                        </span>
                      </div>

                      <div className="mb-3 text-sm">
                        <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                          <span>Gross Salary:</span>
                          <span>
                            {countries
                              .filter((c) => (c.subtotal || 0) > 0)
                              .map(
                                (c) =>
                                  `${c.currency} ${(c.subtotal || 0).toFixed(2)}`,
                              )
                              .join(" + ")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                          <span>Overtime:</span>
                          <span className="text-orange-600 dark:text-orange-400">
                            +{" "}
                            {overtimeRequests
                              .filter(
                                (req) =>
                                  parseFloat(req.overtime_amount || 0) > 0,
                              )
                              .map(
                                (req) =>
                                  `${req.currency || "INR"} ${(parseFloat(req.overtime_amount) || 0).toFixed(2)}`,
                              )
                              .join(" + ")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                          <span>Total Deductions:</span>
                          <span className="text-red-500">
                            -{" "}
                            {deductions
                              .filter((d) => parseFloat(d.amount || 0) > 0)
                              .map(
                                (d) =>
                                  `${d.currency} ${(parseFloat(d.amount) || 0).toFixed(2)}`,
                              )
                              .join(" + ")}
                          </span>
                        </div>
                        <div className="border-t border-green-200 dark:border-green-700 mt-1 pt-1 flex justify-between items-center font-semibold">
                          <span className="text-gray-700 dark:text-gray-300">
                            Net Pay :
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {(() => {
                              const netPayByCurrency = {};

                              countries.forEach((c) => {
                                const subtotal = c.subtotal || 0;
                                if (subtotal > 0) {
                                  netPayByCurrency[c.currency] =
                                    (netPayByCurrency[c.currency] || 0) +
                                    subtotal;
                                }
                              });

                              overtimeRequests.forEach((req) => {
                                const amount =
                                  parseFloat(req.overtime_amount) || 0;
                                if (amount > 0) {
                                  const currency = req.currency || "INR";
                                  netPayByCurrency[currency] =
                                    (netPayByCurrency[currency] || 0) + amount;
                                }
                              });

                              deductions.forEach((d) => {
                                const amount = parseFloat(d.amount) || 0;
                                if (amount > 0) {
                                  netPayByCurrency[d.currency] =
                                    (netPayByCurrency[d.currency] || 0) -
                                    amount;
                                }
                              });

                              return Object.entries(netPayByCurrency)
                                .filter(([_, amount]) => amount !== 0)
                                .map(
                                  ([currency, amount]) =>
                                    `${currency} ${amount.toFixed(2)}`,
                                )
                                .join(" + ");
                            })()}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          Net pay calculated per currency (Gross + Overtime -
                          Deductions)
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isConverted && conversionDetails.gross_salary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Gross Salary */}
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                        Gross Salary
                      </div>

                      <div className="mb-2">
                        <div className="text-[10px] text-gray-500 mb-1">
                          Original:
                        </div>
                        {conversionDetails.gross_salary.currencyBreakdown?.map(
                          (item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600 dark:text-gray-400">
                                {item.currency}:
                              </span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {item.currency} {item.amount.toFixed(2)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>

                      <div className="flex justify-between items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                        <div className="flex-1">
                          <div className="text-[10px] text-gray-500">
                            Original
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {conversionDetails.gross_salary.breakdown}
                          </div>
                        </div>
                        <div className="text-center px-1">
                          <div className="text-[9px] text-gray-400">
                            Converted
                          </div>
                          <i className="fas fa-arrow-right text-blue-400 my-1"></i>
                        </div>
                        <div className="text-right flex-1">
                          <div className="text-[10px] text-blue-500">
                            Converted
                          </div>
                          <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                            {conversionDetails.gross_salary.toCurrency}{" "}
                            {conversionDetails.gross_salary.convertedAmount.toFixed(
                              2,
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Overtime Amount */}
                    <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                        Overtime Amount
                      </div>

                      <div className="mb-2">
                        <div className="text-[10px] text-gray-500 mb-1">
                          Original :
                        </div>
                        {conversionDetails.overtime_amount.currencyBreakdown?.map(
                          (item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600 dark:text-gray-400">
                                {item.currency}:
                              </span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {item.currency} {item.amount.toFixed(2)}
                              </span>
                            </div>
                          ),
                        )}
                        {(!conversionDetails.overtime_amount
                          .currencyBreakdown ||
                          conversionDetails.overtime_amount.currencyBreakdown
                            .length === 0) && (
                          <div className="text-sm text-gray-400">
                            No overtime entries
                          </div>
                        )}
                      </div>

                      {conversionDetails.overtime_amount.currencyBreakdown
                        ?.length > 0 && (
                        <div className="flex justify-between items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                          <div className="flex-1">
                            <div className="text-[10px] text-gray-500">
                              Original
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {conversionDetails.overtime_amount.breakdown}
                            </div>
                          </div>
                          <div className="text-center px-1">
                            <i className="fas fa-arrow-right text-orange-400 my-1"></i>
                          </div>
                          <div className="text-right flex-1">
                            <div className="text-[10px] text-orange-500">
                              Converted
                            </div>
                            <div className="text-base font-bold text-orange-600 dark:text-orange-400">
                              {conversionDetails.overtime_amount.toCurrency}{" "}
                              {conversionDetails.overtime_amount.convertedAmount.toFixed(
                                2,
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Deductions */}
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                        Deductions
                      </div>

                      <div className="mb-2">
                        <div className="text-[10px] text-gray-500 mb-1">
                          Original :
                        </div>
                        {conversionDetails.deductions.currencyBreakdown?.map(
                          (item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600 dark:text-gray-400">
                                {item.currency}:
                              </span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {item.currency} {item.amount.toFixed(2)}
                              </span>
                            </div>
                          ),
                        )}
                        {(!conversionDetails.deductions.currencyBreakdown ||
                          conversionDetails.deductions.currencyBreakdown
                            .length === 0) && (
                          <div className="text-sm text-gray-400">
                            No deductions
                          </div>
                        )}
                      </div>

                      {conversionDetails.deductions.currencyBreakdown?.length >
                        0 && (
                        <div className="flex justify-between items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                          <div className="flex-1">
                            <div className="text-[10px] text-gray-500">
                              Original
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {conversionDetails.deductions.breakdown}
                            </div>
                          </div>
                          <div className="text-center px-1">
                            <i className="fas fa-arrow-right text-red-400 my-1"></i>
                          </div>
                          <div className="text-right flex-1">
                            <div className="text-[10px] text-red-500">
                              Converted
                            </div>
                            <div className="text-base font-bold text-red-500">
                              {conversionDetails.deductions.toCurrency}{" "}
                              {conversionDetails.deductions.convertedAmount.toFixed(
                                2,
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Net Pay */}
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                        Net Pay
                      </div>

                      <div className="mb-2">
                        <div className="text-[10px] text-gray-500 mb-1">
                          Original (Gross + Overtime - Deductions):
                        </div>
                        {conversionDetails.net_pay.currencyBreakdown?.map(
                          (item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600 dark:text-gray-400">
                                {item.currency}:
                              </span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {item.currency} {item.amount.toFixed(2)}
                              </span>
                            </div>
                          ),
                        )}
                      </div>

                      <div className="mb-2 text-xs text-gray-500">
                        <div>
                          Gross:{" "}
                          {conversionDetails.gross_salary?.breakdown || "0"}
                        </div>
                        <div>
                          + Overtime:{" "}
                          {conversionDetails.overtime_amount?.breakdown || "0"}
                        </div>
                        <div>
                          - Deductions:{" "}
                          {conversionDetails.deductions?.breakdown || "0"}
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                        <div className="flex-1">
                          <div className="text-[10px] text-gray-500">
                            Original
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {conversionDetails.net_pay.breakdown}
                          </div>
                        </div>
                        <div className="text-center px-1">
                          <i className="fas fa-arrow-right text-green-400 my-1"></i>
                        </div>
                        <div className="text-right flex-1">
                          <div className="text-[10px] text-green-500">
                            Converted
                          </div>
                          <div className="text-base font-bold text-green-600 dark:text-green-400">
                            {conversionDetails.net_pay.toCurrency}{" "}
                            {conversionDetails.net_pay.convertedAmount.toFixed(
                              2,
                            )}
                          </div>
                        </div>
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
                      Upon updating, the generated payslip will be automatically
                      sent to the employee via Email.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCancel}
              disabled={isLoading || isSubmitting}
              className="px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-times text-xs md:text-sm"></i>
              <span>Cancel</span>
            </button>

            <div className="flex flex-col sm:flex-row gap-3">
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

              {reduxCurrentStep < 5 ? (
                <button
                  onClick={handleNextStep}
                  disabled={
                    isLoading ||
                    isSubmitting ||
                    !selectedUserId ||
                    (reduxCurrentStep === 2 && !isStep2Saved) ||
                    currentPayroll?.status === "completed" ||
                    currentPayroll?.status === "paid"
                  }
                  className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span>Next Step</span>
                  <i className="fas fa-arrow-right text-xs md:text-sm"></i>
                </button>
              ) : (
                <button
                  onClick={handleUpdatePayroll}
                  disabled={
                    isSubmitting ||
                    !selectedUserId ||
                    !isConverted ||
                    currentPayroll?.status === "completed" ||
                    currentPayroll?.status === "paid"
                  }
                  className="px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i
                    className={`fas ${isSubmitting ? "fa-spinner fa-spin" : "fa-save"} text-xs md:text-sm`}
                  ></i>
                  <span>{isSubmitting ? "Updating..." : "Update Payroll"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditPayroll;
