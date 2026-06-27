// src/admin/pages/EditPayroll.js - Fixed to properly fetch employee by user_id

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
  selectCurrentPayroll,
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
  const [employeeRecordId, setEmployeeRecordId] = useState(null);

  // Step 2 - Country Split
  const [countries, setCountries] = useState([]);

  // Step 3 - Overtime
  const [overtimeRequests, setOvertimeRequests] = useState([]);

  // Step 4 - Deductions
  const [deductions, setDeductions] = useState([]);

  // Step 5 - Summary with currency conversion
  const [targetCurrency, setTargetCurrency] = useState("INR");
  const [conversionRates, setConversionRates] = useState({});
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

  // Fetch payroll data on mount
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

  // Find employee record ID from user_id
  useEffect(() => {
    if (currentPayroll?.employee_id && employees && employees.length > 0) {
      // The employee_id in payroll is actually the user_id
      const userId = parseInt(currentPayroll.employee_id);
      
      // Find employee by user_id (which is stored as user_id in the employee list)
      const foundEmployee = employees.find(
        (emp) => emp.user_id === userId || emp.id === userId
      );
      
      if (foundEmployee) {
        // This is the actual employee record ID
        setEmployeeRecordId(foundEmployee.id);
        setSelectedEmployee(foundEmployee.id);
        setEmployeeName(foundEmployee.name || currentPayroll.employee_name || "");
        
        // Fetch full employee details using the employee record ID
        dispatch(fetchEmployeeById(foundEmployee.id))
          .unwrap()
          .then((data) => {
            if (data) {
              populateEmployeeFields(data);
            }
          })
          .catch((err) => {
            console.error("Failed to fetch employee details:", err);
          });
      } else {
        // If not found in the list, try using the payroll's employee_id directly
        // but this might fail if it's a user_id
        dispatch(fetchEmployeeById(currentPayroll.employee_id))
          .unwrap()
          .then((data) => {
            if (data) {
              setEmployeeRecordId(data.id);
              setSelectedEmployee(data.id);
              populateEmployeeFields(data);
            }
          })
          .catch((err) => {
            console.error("Failed to fetch employee details:", err);
            // Try to find by user_id in the employees list again
            const fallbackEmployee = employees.find(
              (emp) => emp.user_id === parseInt(currentPayroll.employee_id)
            );
            if (fallbackEmployee) {
              setEmployeeRecordId(fallbackEmployee.id);
              setSelectedEmployee(fallbackEmployee.id);
              setEmployeeName(fallbackEmployee.name || currentPayroll.employee_name || "");
            }
          });
      }
    }
  }, [currentPayroll, employees, dispatch]);

  // Populate form with payroll data when loaded
  useEffect(() => {
    if (currentPayroll && !isDataLoaded) {
      const stepData = currentPayroll.step_data || {};

      // Set employee name from payroll data if not already set
      if (currentPayroll.employee_name && !employeeName) {
        setEmployeeName(currentPayroll.employee_name);
      }

      // Set pay period
      const monthName = currentPayroll.month 
        ? monthNumberToName[currentPayroll.month]
        : stepData.step_1?.pay_period_month 
          ? monthNumberToName[stepData.step_1.pay_period_month]
          : "";
      setPayPeriodMonth(monthName);
      setPayPeriodYear(currentPayroll.year?.toString() || stepData.step_1?.pay_period_year?.toString() || "");
      setPeriodStart(stepData.step_1?.period_start || "");
      setPeriodEnd(stepData.step_1?.period_end || "");
      setPaymentDate(currentPayroll.payment_date || stepData.step_1?.payment_date || "");
      setPaymentMode(stepData.step_1?.payment_mode || null);
      setTotalWorkingDays(stepData.step_1?.total_working_days?.toString() || "");
      setDaysPresent(stepData.step_1?.days_present?.toString() || "");

      // Set countries from step_2
      if (stepData.step_2?.location_breakdown) {
        setCountries(
          stepData.step_2.location_breakdown.map((loc, index) => ({
            id: index + 1,
            name: loc.location_name || loc.package?.name || "",
            currency: loc.currency?.code || loc.package?.currency || "AED",
            dailyRate: loc.salary_components?.reduce((sum, comp) => sum + comp.amount, 0) / (loc.worked_days || 1) || 0,
            daysWorked: loc.worked_days || 0,
            fxRate: currentPayroll.step_data?.conversion_rate || 1,
            packageId: loc.package?.id || null,
            salary_components: loc.salary_components || [],
            subtotal: loc.subtotal || 0,
          }))
        );
      } else if (stepData.step_2?.countries) {
        setCountries(
          stepData.step_2.countries.map((c, index) => ({
            id: index + 1,
            name: c.name || "",
            currency: c.currency || "AED",
            dailyRate: c.daily_rate || c.rate || 0,
            daysWorked: c.days_worked || c.days || 0,
            fxRate: c.fx_rate || c.exchange_rate || 1,
            packageId: c.package_id || null,
            salary_components: c.salary_components || [],
            subtotal: c.subtotal || 0,
          }))
        );
      } else {
        // Default if no data
        setCountries([
          {
            id: 1,
            name: "UAE",
            currency: "AED",
            dailyRate: "600",
            daysWorked: "10",
            fxRate: "22.5",
            packageId: null,
            salary_components: [],
            subtotal: 0,
          },
          {
            id: 2,
            name: "India",
            currency: "INR",
            dailyRate: "2000",
            daysWorked: "20",
            fxRate: "1",
            packageId: null,
            salary_components: [],
            subtotal: 0,
          },
        ]);
      }

      // Set overtime from step_3
      if (stepData.step_3?.overtime_details) {
        setOvertimeRequests(
          stepData.step_3.overtime_details.map((ot, index) => ({
            id: index + 1,
            project: ot.projects?.map(p => p.project_name).join(", ") || "",
            date: ot.date || "",
            hours: ot.overtime_hours || 0,
            overtime_amount: ot.amount || 0,
            status: ot.status || "pending",
            reason: "",
            projects: ot.projects || [],
          }))
        );
      } else {
        setOvertimeRequests([
          {
            id: 1,
            project: "Dubai Mall Expansion",
            date: "2026-05-20",
            hours: 4,
            overtime_amount: 0,
            status: "pending",
            reason: "Client requested emergency revisions",
            projects: [],
          },
          {
            id: 2,
            project: "Airport Terminal 3",
            date: "2026-05-21",
            hours: 2.5,
            overtime_amount: 0,
            status: "pending",
            reason: "Project deadline approaching",
            projects: [],
          },
        ]);
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
          }))
        );
      } else {
        setDeductions([
          {
            id: 1,
            type: "PF (Employee 12%)",
            currency: "INR",
            amount: "6000",
            is_statutory: "yes",
          },
          {
            id: 2,
            type: "Professional Tax",
            currency: "INR",
            amount: "200",
            is_statutory: "yes",
          },
          {
            id: 3,
            type: "TDS / Income Tax",
            currency: "INR",
            amount: "4500",
            is_statutory: "yes",
          },
          {
            id: 4,
            type: "Gratuity (UAE 8.33%)",
            currency: "AED",
            amount: "1125",
            is_statutory: "yes",
          },
        ]);
      }

      // Set summary data
      setTargetCurrency(stepData.currency || "INR");
      setLocalSummaryData({
        gross_earnings: currentPayroll.net_pay || stepData.step_2?.total_earnings || 0,
        total_deductions: stepData.step_4?.total_deductions || 0,
        combined: currentPayroll.net_pay || stepData.step_2?.total_earnings || 0,
        net_pay: currentPayroll.net_pay || 0,
      });

      // Set conversion rates from countries
      const rates = {};
      if (stepData.step_2?.location_breakdown) {
        stepData.step_2.location_breakdown.forEach((loc) => {
          if (loc.currency?.code) {
            rates[loc.currency.code] = currentPayroll.step_data?.conversion_rate || 1;
          }
        });
      }
      setConversionRates(rates);

      setIsDataLoaded(true);
    }
  }, [currentPayroll, dispatch, isDataLoaded, employeeName]);

  // Populate employee fields
  const populateEmployeeFields = (employee) => {
    const user = employee.user || {};
    const fullName = [employee.first_name, employee.last_name]
      .filter(Boolean)
      .join(" ");

    if (employee.user_id) {
      setSelectedUserId(employee.user_id.toString());
    }

    setEmployeeId(employee.employee_id || "");
    if (fullName) {
      setEmployeeName(fullName);
    }

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

    // Fetch salary packages for this employee using user_id
    if (employee.user_id) {
      dispatch(fetchEmployeeSalaryPackages(employee.user_id));
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
          setEmployeeRecordId(employeeId);
          populateEmployeeFields(result);
        }
      } catch (error) {
        showToast("Failed to fetch employee details", "error");
      }
    } else {
      clearEmployeeFields();
      setSelectedUserId("");
      setEmployeeRecordId(null);
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
    setEmployeeRecordId(null);
  };

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
        })
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
        })
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
        })
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
            subtotal: (parseFloat(c.dailyRate) || 0) * (parseInt(c.daysWorked) || 0),
          })),
          total_earnings: countries.reduce(
            (sum, c) =>
              sum +
              (parseFloat(c.dailyRate) || 0) *
                (parseInt(c.daysWorked) || 0) *
                (parseFloat(c.fxRate) || 1),
            0
          ),
          total_deductions: deductions.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0),
          gross_salary: countries.reduce(
            (sum, c) =>
              sum +
              (parseFloat(c.dailyRate) || 0) *
                (parseInt(c.daysWorked) || 0) *
                (parseFloat(c.fxRate) || 1),
            0
          ),
          net_salary:
            countries.reduce(
              (sum, c) =>
                sum +
                (parseFloat(c.dailyRate) || 0) *
                  (parseInt(c.daysWorked) || 0) *
                  (parseFloat(c.fxRate) || 1),
              0
            ) -
            deductions.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0),
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
            status: req.status || "pending",
            projects: req.projects || [],
          })),
          total_overtime_amount: overtimeRequests.reduce(
            (sum, req) => sum + parseFloat(req.overtime_amount || 0),
            0
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
          total_deductions: deductions.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0),
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
            gross_earnings: localSummaryData.gross_earnings || 0,
            total_deductions: localSummaryData.total_deductions || 0,
            combined: localSummaryData.combined || 0,
            net_pay: localSummaryData.net_pay || 0,
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
      const monthNumber = monthNames[payPeriodMonth] || new Date().getMonth() + 1;
      const year = parseInt(payPeriodYear) || new Date().getFullYear();

      const enrichedData = {
        ...data,
        pay_period_month: data.pay_period_month || monthNumber,
        pay_period_year: data.pay_period_year || year,
      };

      const result = await dispatch(
        savePayrollStep({
          userId: selectedUserId,
          step: step,
          stepData: enrichedData,
        })
      ).unwrap();

      dispatch(updateStepData({ step, data: enrichedData }));
      dispatch(markStepCompleted(step));

      showToast(result.message || "Step data saved successfully", "success");
      return true;
    } catch (error) {
      console.error("Failed to save step:", error);
      showToast(typeof error === "string" ? error : "Failed to save step data", "error");
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

        const monthNumber = monthNames[payPeriodMonth] || new Date().getMonth() + 1;
        const monthFormatted = `${payPeriodYear}-${String(monthNumber).padStart(2, "0")}`;
        const year = parseInt(payPeriodYear) || new Date().getFullYear();

        if (nextStep === 2) {
          try {
            await dispatch(
              calculateSalarySplit({
                employeeId: selectedUserId,
                userId: selectedUserId,
                month: monthFormatted,
              })
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
              })
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
              })
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

      const monthNumber = monthNames[payPeriodMonth] || new Date().getMonth() + 1;
      const monthFormatted = `${payPeriodYear}-${String(monthNumber).padStart(2, "0")}`;
      const year = parseInt(payPeriodYear) || new Date().getFullYear();

      if (step === 2) {
        try {
          await dispatch(
            calculateSalarySplit({
              employeeId: selectedUserId,
              userId: selectedUserId,
              month: monthFormatted,
            })
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
            })
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
            })
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

  // Handle update submission
  const handleUpdatePayroll = async () => {
    if (!selectedUserId) {
      showToast("Please select an employee first", "error");
      return;
    }

    try {
      const finalData = getCurrentStepData();
      await handleSaveStep(reduxCurrentStep, finalData);

      const monthNumber = monthNames[payPeriodMonth] || new Date().getMonth() + 1;

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

      await dispatch(submitPayroll(payload)).unwrap();

      showToast("Payroll updated successfully!", "success");

      setTimeout(() => {
        navigate(`/admin/payroll/${id}`);
      }, 2000);
    } catch (error) {
      showToast(error || "Failed to update payroll", "error");
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/admin/payroll/${id}`);
  };

  // Overtime actions
  const handleOvertimeAction = (id, newStatus) => {
    setOvertimeRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
    );
  };

  const handleOvertimeChange = (id, field, value) => {
    setOvertimeRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, [field]: value } : req))
    );
  };

  // Country actions
  const handleCountryChange = (id, field, value) => {
    setCountries((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleAddCountry = () => {
    const newId = countries.length > 0 ? Math.max(...countries.map((c) => c.id)) + 1 : 1;
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
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleAddDeduction = () => {
    const newId = deductions.length > 0 ? Math.max(...deductions.map((d) => d.id)) + 1 : 1;
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
    if (deductions.length <= 1) {
      showToast("At least one deduction is required", "error");
      return;
    }
    setDeductions(deductions.filter((d) => d.id !== id));
  };

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

  if (isLoading && !isDataLoaded) {
    return (
      <div className="w-full overflow-x-hidden px-4 md:px-6">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

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
        <Link
          to={`/admin/payroll/${id}`}
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
            currentPayroll.status === "completed" || currentPayroll.status === "paid"
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
              : currentPayroll.status === "pending"
              ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300"
              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <i
              className={`fas ${
                currentPayroll.status === "completed" || currentPayroll.status === "paid"
                  ? "fa-check-circle"
                  : currentPayroll.status === "pending"
                  ? "fa-clock"
                  : "fa-file"
              }`}
            ></i>
            <span className="font-semibold capitalize">
              Current Status: {currentPayroll.status}
            </span>
            {(currentPayroll.status === "completed" || currentPayroll.status === "paid") && (
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
                      disabled={employeesLoading || currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                    >
                      <option value="">
                        {employeesLoading ? "Loading employees..." : "Select Employee"}
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
                      disabled={!selectedUserId || currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
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
                      disabled={!selectedUserId || currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
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
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      disabled={!selectedUserId || currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-calendar-times text-green-500 mr-1"></i>
                      Period End Date
                    </label>
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      disabled={!selectedUserId || currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-money-bill-wave text-green-500 mr-1"></i>
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      disabled={!selectedUserId || currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                    />
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
                      disabled={!selectedUserId || currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
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
                      disabled={!selectedUserId || currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
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
                      disabled={!selectedUserId || currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
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
                <button
                  onClick={handleCalculateSalarySplit}
                  disabled={countriesLoading || currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                  className="ml-auto px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <i className={`fas ${countriesLoading ? "fa-spinner fa-spin" : "fa-calculator"} mr-1`}></i>
                  {countriesLoading ? "Calculating..." : "Calculate"}
                </button>
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
                      {employeePackages.length > 0 ? (
                        <select
                          value={c.packageId || ""}
                          onChange={(e) => {
                            const selectedPackage = employeePackages.find(
                              (p) => p.id === parseInt(e.target.value)
                            );
                            handleCountryChange(c.id, "packageId", e.target.value);
                            if (selectedPackage) {
                              handleCountryChange(c.id, "name", selectedPackage.name);
                              handleCountryChange(c.id, "currency", selectedPackage.currency || "AED");
                            }
                          }}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                          disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                        >
                          <option value="">Select Package</option>
                          {employeePackages.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name} ({pkg.currency || "AED"})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => handleCountryChange(c.id, "name", e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                          placeholder="e.g., UAE Onsite"
                          disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                        />
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">
                        Currency
                      </label>
                      <select
                        value={c.currency}
                        onChange={(e) => handleCountryChange(c.id, "currency", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
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
                        Daily Rate
                      </label>
                      <input
                        type="number"
                        value={c.dailyRate}
                        onChange={(e) => handleCountryChange(c.id, "dailyRate", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">
                        Days Logged
                      </label>
                      <input
                        type="number"
                        value={c.daysWorked}
                        onChange={(e) => handleCountryChange(c.id, "daysWorked", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
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
                        onChange={(e) => handleCountryChange(c.id, "fxRate", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-end items-end pb-0.5">
                      <button
                        onClick={() => handleRemoveCountry(c.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center"
                        disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
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
                disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
              >
                <i className="fas fa-plus"></i> Add Package Split
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="p-3 md:p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                    <span className="w-3 h-2 bg-green-500 rounded-sm"></span>
                    Dubai Package
                  </div>
                  <div className="text-lg md:text-xl font-bold text-orange-600 dark:text-orange-400">
                    {countries.find((c) => c.currency === "AED")?.dailyRate || "0"}{" "}
                    {countries.find((c) => c.currency === "AED")?.currency || "AED"}
                  </div>
                  <div className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {countries.find((c) => c.currency === "AED")?.daysWorked || 0} days
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                    <span className="w-3 h-2 bg-green-500 rounded-sm"></span>
                    WFH Package
                  </div>
                  <div className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">
                    {countries.find((c) => c.currency === "INR")?.dailyRate || "0"}{" "}
                    {countries.find((c) => c.currency === "INR")?.currency || "INR"}
                  </div>
                  <div className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {countries.find((c) => c.currency === "INR")?.daysWorked || 0} days
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                    Converted
                  </div>
                  <div className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">
                    {targetCurrency}{" "}
                    {(
                      parseFloat(
                        countries.find((c) => c.currency === "AED")?.dailyRate || 0
                      ) *
                      parseFloat(
                        countries.find((c) => c.currency === "AED")?.fxRate || 0
                      )
                    ).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                    Combined Base
                  </div>
                  <div className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {targetCurrency}{" "}
                    {countries
                      .reduce(
                        (sum, c) =>
                          sum +
                          parseFloat(c.dailyRate || 0) *
                            parseFloat(c.daysWorked || 0) *
                            parseFloat(c.fxRate || 1),
                        0
                      )
                      .toLocaleString()}
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
                  Overtime
                </h3>
                <button
                  onClick={handleFetchOvertime}
                  disabled={overtimeLoading || currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                  className="ml-auto px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <i className={`fas ${overtimeLoading ? "fa-spinner fa-spin" : "fa-sync"} mr-1`}></i>
                  {overtimeLoading ? "Loading..." : "Fetch Overtime"}
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        <th className="py-3 px-4 font-semibold">Project</th>
                        <th className="py-3 px-4 font-semibold">Date</th>
                        <th className="py-3 px-4 font-semibold">Hours</th>
                        <th className="py-3 px-4 font-semibold">Overtime Amount</th>
                        <th className="py-3 px-4 font-semibold">Currency</th>
                        <th className="py-3 px-4 font-semibold w-1/4">Reason</th>
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
                              onChange={(e) => handleOvertimeChange(req.id, "project", e.target.value)}
                              className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                              placeholder="Project name"
                              disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                            />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            <input
                              type="date"
                              value={req.date}
                              onChange={(e) => handleOvertimeChange(req.id, "date", e.target.value)}
                              className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                              disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                            />
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                            <input
                              type="number"
                              step="0.5"
                              value={req.hours}
                              onChange={(e) => handleOvertimeChange(req.id, "hours", parseFloat(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                              disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                            />
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <input
                              type="number"
                              step="0.01"
                              value={req.overtime_amount}
                              onChange={(e) => handleOvertimeChange(req.id, "overtime_amount", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm rounded border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-500"
                              placeholder="0.00"
                              disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                            />
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <select
                                value={req.currency || targetCurrency}
                                onChange={(e) => handleOvertimeChange(req.id, "currency", e.target.value)}
                                className="w-20 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                                disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                              >
                                {currencies.map((curr) => (
                                  <option key={curr} value={curr}>
                                    {curr}
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                            <input
                              type="text"
                              value={req.reason}
                              onChange={(e) => handleOvertimeChange(req.id, "reason", e.target.value)}
                              className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                              placeholder="Reason"
                              disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
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
                            {req.status === "pending" && (currentPayroll?.status !== "completed" && currentPayroll?.status !== "paid") ? (
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
                      <li>
                        <strong>Overtime Amount:</strong> Enter the overtime amount to be paid for each request.
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
                        onChange={(e) => handleDeductionChange(d.id, "type", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        placeholder="e.g., PF 12%"
                        disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Currency</label>
                      <select
                        value={d.currency}
                        onChange={(e) => handleDeductionChange(d.id, "currency", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                      >
                        {currencies.map((curr) => (
                          <option key={curr} value={curr}>
                            {curr}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Amount</label>
                      <input
                        type="number"
                        value={d.amount}
                        onChange={(e) => handleDeductionChange(d.id, "amount", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Statutory</label>
                      <select
                        value={d.is_statutory}
                        onChange={(e) => handleDeductionChange(d.id, "is_statutory", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                        disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <button
                        onClick={() => handleRemoveDeduction(d.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center"
                        disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
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
                disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
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
                  disabled={summaryLoading || currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                  className="ml-auto px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <i className={`fas ${summaryLoading ? "fa-spinner fa-spin" : "fa-sync"} mr-1`}></i>
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
                      onChange={(e) => setTargetCurrency(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                      disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                    >
                      {currencies.map((curr) => (
                        <option key={curr} value={curr}>
                          {curr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Conversion Rates
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {countries.map((c) => (
                        <div key={c.id} className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">{c.currency}:</span>
                          <input
                            type="number"
                            step="0.01"
                            value={c.fxRate}
                            onChange={(e) => handleCountryChange(c.id, "fxRate", e.target.value)}
                            className="w-16 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                            disabled={currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                          />
                          <span className="text-xs text-gray-500">→ {targetCurrency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                      Gross Earnings
                    </div>
                    <div className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200">
                      {targetCurrency}{" "}
                      {localSummaryData.gross_earnings?.toLocaleString() ||
                        countries
                          .reduce(
                            (sum, c) =>
                              sum +
                              parseFloat(c.dailyRate || 0) *
                                parseFloat(c.daysWorked || 0) *
                                parseFloat(c.fxRate || 1),
                            0
                          )
                          .toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                      Total Deductions
                    </div>
                    <div className="text-lg md:text-xl font-bold text-red-500">
                      {targetCurrency}{" "}
                      {localSummaryData.total_deductions?.toLocaleString() ||
                        deductions
                          .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)
                          .toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 md:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                      Combined (INR)
                    </div>
                    <div className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {targetCurrency}{" "}
                      {localSummaryData.combined?.toLocaleString() ||
                        countries
                          .reduce(
                            (sum, c) =>
                              sum +
                              parseFloat(c.dailyRate || 0) *
                                parseFloat(c.daysWorked || 0) *
                                parseFloat(c.fxRate || 1),
                            0
                          )
                          .toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 md:p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="text-[10px] md:text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                      Final Net Pay
                    </div>
                    <div className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">
                      {targetCurrency}{" "}
                      {localSummaryData.net_pay?.toLocaleString() ||
                        (
                          countries.reduce(
                            (sum, c) =>
                              sum +
                              parseFloat(c.dailyRate || 0) *
                                parseFloat(c.daysWorked || 0) *
                                parseFloat(c.fxRate || 1),
                            0
                          ) -
                          deductions.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)
                        ).toLocaleString()}
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
                      Upon updating, the generated payslip will be automatically sent to the employee via Email.
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
                  disabled={isLoading || isSubmitting || !selectedUserId}
                  className="px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next Step</span>
                  <i className="fas fa-arrow-right text-xs md:text-sm"></i>
                </button>
              ) : (
                <button
                  onClick={handleUpdatePayroll}
                  disabled={isSubmitting || !selectedUserId || currentPayroll?.status === "completed" || currentPayroll?.status === "paid"}
                  className="px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className={`fas ${isSubmitting ? "fa-spinner fa-spin" : "fa-save"} text-xs md:text-sm`}></i>
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