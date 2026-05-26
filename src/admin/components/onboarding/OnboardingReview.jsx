/* eslint-disable react-hooks/static-components */
import { useDispatch, useSelector } from "react-redux";
import { FiCheckCircle, FiFileText, FiUser, FiChevronLeft, FiSend, FiShield, FiGlobe, FiBriefcase, FiAlertTriangle, FiX, FiDollarSign, FiCalendar } from "react-icons/fi";
import { setStep, completeOnboarding } from "../../store/slices/onboardingSlice";
import { showToast } from "../../components/common/Toast";
import { fetchEmployees } from "../../store/slices/employeeSlice";
import { fetchOrganizations } from "../../store/slices/organizationSlice";
import { fetchCompanies } from "../../store/slices/companySlice";
import { fetchDesignations } from "../../store/slices/designationSlice";
import { fetchDepartments } from "../../store/slices/departmentSlice";
import { fetchRoles } from "../../store/slices/roleSlice";
import React from "react";
import apiClient from "../../../utils/apiClient";

const OnboardingReview = () => {
  const dispatch = useDispatch();
  const onboardingState = useSelector((state) => state.onboarding) || {};
  const { employeeDetails = {}, resumeData = {} } = onboardingState;

  // Redux Selectors for Metadata
  const { organizations = [] } = useSelector((state) => state.organizations || {});
  const { companies = [] } = useSelector((state) => state.companies || {});
  const { designations = [] } = useSelector((state) => state.designations || {});
  const { departments = [] } = useSelector((state) => state.departments || {});
  const { roles = [] } = useSelector((state) => state.roles || {});

  // Local state for duplicate submission prevention and loader
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorModal, setErrorModal] = React.useState({ isOpen: false, title: "", errors: [] });

  // Pre-fetch metadata lists on component mount
  React.useEffect(() => {
    dispatch(fetchOrganizations());
    dispatch(fetchDesignations());
    dispatch(fetchDepartments());
    dispatch(fetchRoles());
  }, [dispatch]);

  // Dynamically fetch companies once organizations are available or user organization context is resolved
  React.useEffect(() => {
    const storedUser = localStorage.getItem("hr-user");
    const hrUser = storedUser ? JSON.parse(storedUser) : null;
    const orgId = hrUser?.employee?.organization_id || hrUser?.organization_id || (organizations[0]?.id || "");
    if (orgId) {
      dispatch(fetchCompanies(orgId));
    }
  }, [dispatch, organizations]);

  const generateRandomDob = () => {
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 45;
    const maxYear = currentYear - 22;
    const randomYear = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
    const randomMonth = Math.floor(Math.random() * 12) + 1;
    const randomDay = Math.floor(Math.random() * 28) + 1; // standardizing max days to 28 to avoid invalid days like Feb 30

    const yearStr = randomYear.toString();
    const monthStr = randomMonth.toString().padStart(2, "0");
    const dayStr = randomDay.toString().padStart(2, "0");

    return `${yearStr}-${monthStr}-${dayStr}`; // Format: YYYY-MM-DD
  };

  const generateEmployeeId = (dob, joiningDate) => {
    if (!dob || !joiningDate) return "";

    let dobFormatted = dob;
    let joiningFormatted = joiningDate;

    if (dob.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = dob.split("/");
      dobFormatted = `${year}-${month}-${day}`;
    }

    if (joiningDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = joiningDate.split("/");
      joiningFormatted = `${year}-${month}-${day}`;
    }

    const dobDate = new Date(dobFormatted);
    const joiningDateObj = new Date(joiningFormatted);

    if (isNaN(dobDate.getTime()) || isNaN(joiningDateObj.getTime())) {
      return "";
    }

    const dobDay = String(dobDate.getDate()).padStart(2, "0");
    const dobMonth = String(dobDate.getMonth() + 1).padStart(2, "0");
    const dobYear = dobDate.getFullYear();

    const joiningDay = String(joiningDateObj.getDate()).padStart(2, "0");
    const joiningMonth = String(joiningDateObj.getMonth() + 1).padStart(2, "0");
    const joiningYear = joiningDateObj.getFullYear();

    return `EMP-${dobDay}${dobMonth}${dobYear}-${joiningDay}${joiningMonth}${joiningYear}`;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const hrUser = JSON.parse(localStorage.getItem("hr-user")) || {};
      const orgId = hrUser?.employee?.organization_id || hrUser?.organization_id || (organizations[0]?.id || "");
      const companyId = hrUser?.employee?.company_id || hrUser?.company_id || (companies[0]?.id || "");

      // ── Step 1: Fetch latest roles directly from API to avoid stale Redux state ──
      let activeRoles = [...roles];
      try {
        const rolesRes = await apiClient.get("/admin/roles");
        const fetched = rolesRes.data?.data || rolesRes.data;
        if (Array.isArray(fetched) && fetched.length > 0) {
          activeRoles = fetched;
        }
      } catch (_) {
        // fall back to Redux roles
      }

      // ── Step 2: Find 'Employee' role — auto-create if missing ──
      let employeeRole =
        activeRoles.find((r) => r.name?.toLowerCase().trim() === "employee") ||
        activeRoles.find((r) => r.name?.toLowerCase().includes("employee")) ||
        activeRoles[0] ||
        null;

      if (!employeeRole) {
        try {
          const createRes = await apiClient.post("/admin/roles", {
            name: "Employee",
            description: "Default Employee Role",
            status: "active",
          });
          const created = createRes.data?.data || createRes.data;
          if (created?.id) {
            employeeRole = created;
            dispatch(fetchRoles()); // sync Redux state
          }
        } catch (createErr) {
          console.error("Failed to auto-create Employee role:", createErr);
        }
      }

      // ── Step 3: Resolve IDs ──
      const matchedDesignation = designations.find(
        (d) => d.name?.toLowerCase().trim() === (employeeDetails.designation || "").toLowerCase().trim()
      );
      const matchedDepartment = departments.find(
        (d) => d.name?.toLowerCase().trim() === (employeeDetails.department || "").toLowerCase().trim()
      );

      const designation_id = matchedDesignation?.id || designations[0]?.id || null;
      const department_id = matchedDepartment?.id || departments[0]?.id || null;
      const role_id = employeeRole?.id || null;

      // ── Step 4: Guard — if still no role, show actionable error ──
      if (!role_id) {
        setErrorModal({
          isOpen: true,
          title: "System Configuration Required",
          errors: [{
            field: "Employee Role Missing",
            message: "No 'Employee' role exists in the system and it could not be created automatically. Please go to Settings → Roles and create an 'Employee' role, then retry onboarding.",
          }],
        });
        showToast("Onboarding failed: No Employee role found in the system.", "error");
        setIsSubmitting(false);
        return;
      }

      // ── Step 5: Parse full name ──
      const fullName = (employeeDetails.fullName || "").trim();
      const parts = fullName.split(" ");
      const first_name = parts[0] || "Unknown";
      const last_name = parts.slice(1).join(" ") || "";

      // ── Step 6: Generate DOB + Employee ID ──
      let dob = "";
      if (employeeDetails.specialDayEvent?.toLowerCase().trim() === "birthday" && employeeDetails.specialDayDate) {
        dob = employeeDetails.specialDayDate;
      } else {
        dob = generateRandomDob();
      }
      const employeeId = generateEmployeeId(dob, employeeDetails.joiningDate);

      // ── Step 7: Clean phone number ──
      const cleanPhone = (employeeDetails.phone || "")
        .replace(/\+/g, "")
        .replace(/[\s\-]/g, "")
        .trim();

      // ── Step 8: Nationality mapping ──
      const nationalityMap = {
        "india": "Indian",
        "pakistan": "Pakistani",
        "philippines": "Filipino",
        "united arab emirates": "Emirati",
        "united kingdom": "British",
        "united states": "American",
      };
      const rawNationality = (employeeDetails.nationality || "Indian").trim();
      const candidateNationality = nationalityMap[rawNationality.toLowerCase()] || rawNationality;

      // ── Step 9: Normalize joining date to YYYY-MM-DD ──
      let joiningDate = employeeDetails.joiningDate || "";
      if (joiningDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = joiningDate.split("/");
        joiningDate = `${year}-${month}-${day}`;
      }

      // ── Step 10: Build FormData payload (backend requires multipart, same as AddEmployee) ──
      console.log("[Onboarding] Resolved role_id:", role_id, "| employeeRole:", employeeRole);
      console.log("[Onboarding] Resolved designation_id:", designation_id, "| department_id:", department_id);

      const body = new FormData();
      body.append("first_name", first_name);
      body.append("last_name", last_name);
      body.append("employee_id", employeeId);
      body.append("gender", "male");
      body.append("dob", dob);
      body.append("marital_status", "single");
      body.append("personal_email", employeeDetails.email || "");
      body.append("phone", cleanPhone);
      body.append("joining_date", joiningDate);
      body.append("nationality", candidateNationality);
      if (orgId) body.append("organization_id", String(parseInt(orgId)));
      body.append("company_id", companyId ? String(parseInt(companyId)) : "");
      if (department_id) body.append("department_id", String(parseInt(department_id)));
      if (designation_id) body.append("designation_id", String(parseInt(designation_id)));
      body.append("role_id", String(parseInt(role_id)));
      body.append("type", "employee");
      body.append("status", "onboarding");
      body.append("address", employeeDetails.address || "");
      body.append("basic_salary", employeeDetails.basicSalary || "");
      body.append("other_allowance", employeeDetails.otherAllowance || "0");
      body.append("total_salary", employeeDetails.totalMonthlySalary || "0");
      body.append("payment_cycle", employeeDetails.paymentCycle || "Monthly");
      body.append("bank_name", employeeDetails.bankName || "");
      body.append("account_number", employeeDetails.accountNumber || "");
      body.append("special_day_event", employeeDetails.specialDayEvent || "");
      body.append("special_day_date", employeeDetails.specialDayDate || "");

      // Debug: log all FormData entries
      console.log("[Onboarding] FormData entries:");
      for (let [k, v] of body.entries()) console.log(`  ${k}: ${v}`);

      // ── Step 11: Friendly error mapper ──
      const getFriendlyErrorMessage = (rawMsg) => {
        if (!rawMsg) return "Something went wrong. Please try again.";
        const msg = rawMsg.toLowerCase();
        if (msg.includes("email") && (msg.includes("duplicate") || msg.includes("unique") || msg.includes("already")))
          return "This email address is already registered in the system. Please use a different email.";
        if (msg.includes("employee_id") && (msg.includes("duplicate") || msg.includes("unique")))
          return "This Employee ID already exists. A new unique ID will be generated automatically on retry.";
        if (msg.includes("phone") && (msg.includes("duplicate") || msg.includes("unique")))
          return "This phone number is already registered with another employee.";
        if (msg.includes("duplicate entry") || msg.includes("integrity constraint") || msg.includes("sqlstate"))
          return "A record with these details already exists. Please check the email or phone number and try again.";
        if (msg.includes("network") || msg.includes("timeout") || msg.includes("connection"))
          return "Unable to connect to the server. Please check your internet connection and try again.";
        if (msg.includes("unauthorized") || msg.includes("unauthenticated") || msg.includes("403"))
          return "Your session has expired. Please log in again and retry.";
        if (msg.includes("server error") || msg.includes("500"))
          return "The server encountered an error. Please try again in a moment.";
        if (msg.includes("role") && (msg.includes("required") || msg.includes("invalid") || msg.includes("id")))
          return "A valid role is required. Please ensure an 'Employee' role exists in Settings → Roles.";
        return "Unable to create the employee record. Please verify the details and try again.";
      };

      // ── Field label map for error display ──
      const fieldLabels = {
        first_name: "First Name",
        last_name: "Last Name",
        employee_id: "Employee ID",
        gender: "Gender",
        dob: "Date of Birth",
        marital_status: "Marital Status",
        personal_email: "Email Address",
        company_email: "Company Email",
        phone: "Phone Number",
        personal_number: "Phone Number",
        joining_date: "Joining Date",
        nationality: "Nationality",
        organization_id: "Organization",
        company_id: "Company",
        department_id: "Department",
        designation_id: "Designation",
        role_id: "Role",
        type: "Employee Type",
        status: "Status",
        address: "Address",
        passport_number: "Passport Number",
        visa_number: "Visa Number",
        eid_number: "EID Number",
      };

      // ── Step 12: Submit ──
      let apiSuccess = false;
      try {
        await apiClient.post("/admin/employees", body);
        apiSuccess = true;
        showToast("Employee record created successfully!", "success");
        dispatch(fetchEmployees());
      } catch (apiError) {
        const errData = apiError.response?.data;

        if (errData?.errors && Object.keys(errData.errors).length > 0) {
          const errorList = Object.entries(errData.errors).map(
            ([field, msgs]) => ({
              field: fieldLabels[field] || field.replace(/_/g, " "),
              message: getFriendlyErrorMessage(Array.isArray(msgs) ? msgs[0] : msgs),
            })
          );
          setErrorModal({
            isOpen: true,
            title: "Unable to Create Employee",
            errors: errorList,
          });
        } else {
          const rawMsg = errData?.message || "";
          setErrorModal({
            isOpen: true,
            title: "Unable to Create Employee",
            errors: [{ field: "Action Required", message: getFriendlyErrorMessage(rawMsg) }],
          });
        }
        showToast("Employee creation failed. Please fix the issue and try again.", "error");
      }

      if (apiSuccess) {
        dispatch(completeOnboarding());
        showToast("Onboarding submitted successfully!", "success");
      }
    } catch {
      setErrorModal({
        isOpen: true,
        title: "Something Went Wrong",
        errors: [{ field: "Error", message: "An unexpected error occurred while submitting the onboarding. Please check your connection and try again." }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    dispatch(setStep(4));
  };

  const handleSaveDraft = () => {
    localStorage.setItem("onboarding-draft", JSON.stringify(onboardingState));
    showToast("Draft saved successfully!", "success");
  };

  const SummaryCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-2">
        <Icon className="text-green-600" size={18} />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  return (
    <>
      {/* Error Modal */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-slideUp">
            {/* Modal Header — green to match website theme */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <FiAlertTriangle className="text-white" size={22} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base leading-tight">{errorModal.title}</h3>
                  <p className="text-white/75 text-xs mt-0.5">Please review and fix the issue below</p>
                </div>
              </div>
              <button
                onClick={() => setErrorModal({ isOpen: false, title: "", errors: [] })}
                className="text-white/70 hover:text-white transition-colors p-1.5 hover:bg-white/15 rounded-lg"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Error List */}
            <div className="px-6 py-5 space-y-3 max-h-72 overflow-y-auto">
              {errorModal.errors.map((err, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20"
                >
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 dark:text-green-400 text-xs font-bold">{idx + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">
                      {err.field.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 leading-relaxed">{err.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setErrorModal({ isOpen: false, title: "", errors: [] })}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto animate-fadeIn space-y-8">
        {/* Summary Header - Green theme with subtle elegant background styling */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-3xl p-8 text-white shadow-xl shadow-green-600/20 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative animate-fadeIn">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2 text-white">Final Review & Submission</h2>
            <p className="text-green-100 max-w-md text-sm leading-relaxed">
              Please verify all information before finalizing the onboarding process. Once submitted, the employee will receive their portal access and offer letter.
            </p>
          </div>
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg">
              <FiCheckCircle size={32} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Ready to Submit</span>
          </div>
          {/* Decorative Circles */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-green-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Employee Summary */}
          <SummaryCard title="Employee Details" icon={FiUser}>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-400">
                  <FiUser size={24} />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{employeeDetails.fullName}</p>
                  <p className="text-sm text-gray-500">{employeeDetails.designation} • {employeeDetails.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4">
                <div className="flex items-center gap-3 text-sm">
                  <FiBriefcase className="text-gray-400" />
                  <span className="text-gray-500 font-medium w-24">Experience:</span>
                  <span className="text-gray-900 dark:text-gray-300 font-semibold">{employeeDetails.experience}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FiGlobe className="text-gray-400" />
                  <span className="text-gray-500 font-medium w-24">Nationality:</span>
                  <span className="text-gray-900 dark:text-gray-300 font-semibold">{employeeDetails.nationality}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <FiShield className="text-gray-400" />
                  <span className="text-gray-500 font-medium w-24">Joining:</span>
                  <span className="text-gray-900 dark:text-gray-300 font-semibold">
                    {employeeDetails.joiningDate?.match(/^\d{4}-\d{2}-\d{2}$/)
                      ? (() => {
                        const [year, month, day] = employeeDetails.joiningDate.split("-");
                        return `${day}/${month}/${year}`;
                      })()
                      : employeeDetails.joiningDate}
                  </span>
                </div>
                {employeeDetails.specialDayEvent && employeeDetails.specialDayDate && (
                  <div className="flex items-center gap-3 text-sm">
                    <FiCalendar className="text-gray-400" />
                    <span className="text-gray-500 font-medium w-24">{employeeDetails.specialDayEvent}:</span>
                    <span className="text-gray-900 dark:text-gray-300 font-semibold">
                      {employeeDetails.specialDayDate?.split("-").reverse().join("/")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </SummaryCard>

          {/* Documents Summary */}
          <SummaryCard title="Onboarding Assets" icon={FiFileText}>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg flex items-center justify-center">
                    <FiFileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Resume - Parsed</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{resumeData?.fileName || "resume.pdf"}</p>
                  </div>
                </div>
                <span className="text-green-500 font-bold text-[10px] bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">COMPLETED</span>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg flex items-center justify-center">
                    <FiFileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Offer Letter</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Auto-Generated</p>
                  </div>
                </div>
                <span className="text-green-500 font-bold text-[10px] bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">GENERATED</span>
              </div>
            </div>
          </SummaryCard>

          {/* Salary & Bank Details Summary */}
          <div className="md:col-span-2">
            <SummaryCard title="Salary & Bank Details" icon={FiDollarSign}>
              <div className="space-y-6">
                {/* Standard aggregates with dynamic currency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Basic Salary</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {employeeDetails.currency || "AED"} {parseFloat(employeeDetails.basicSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Other Allowance</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {employeeDetails.currency || "AED"} {parseFloat(employeeDetails.otherAllowance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Monthly Salary</p>
                    <p className="text-sm font-extrabold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-3 py-1 rounded-lg inline-block">
                      {employeeDetails.currency || "AED"} {parseFloat(employeeDetails.totalMonthlySalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Payment Cycle</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{employeeDetails.paymentCycle || "Monthly"}</p>
                  </div>
                </div>

                {/* Dynamic component breakdown list */}
                {Array.isArray(employeeDetails.salaryComponents) && employeeDetails.salaryComponents.length > 0 && (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700/60">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">Salary Components Breakdown</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {employeeDetails.salaryComponents.map((comp, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900/35 rounded-xl border border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{comp.name}</span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white shrink-0 ml-2">
                            {employeeDetails.currency || "AED"} {comp.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Country-specific Bank Transfer Info */}
                <div className="border-t border-gray-100 dark:border-gray-700/60 pt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Bank Country</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{employeeDetails.bankCountry || "UAE"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Bank Name</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{employeeDetails.bankName || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Account Number</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{employeeDetails.accountNumber || "-"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    {employeeDetails.bankCountry === "India" ? (
                      <>
                        {employeeDetails.bankIfsc && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">IFSC Code</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{employeeDetails.bankIfsc}</p>
                          </div>
                        )}
                        {employeeDetails.bankBranch && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Branch Name</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{employeeDetails.bankBranch}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {employeeDetails.bankIban && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">IBAN Number</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                              {(() => {
                                // Re-format space separators for display
                                const raw = employeeDetails.bankIban.replace(/\s/g, "");
                                let formatted = "";
                                for (let i = 0; i < raw.length; i++) {
                                  if (i > 0 && i % 4 === 0) formatted += " ";
                                  formatted += raw[i];
                                }
                                return formatted;
                              })()}
                            </p>
                          </div>
                        )}
                        {employeeDetails.bankSwift && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">SWIFT/BIC Code</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{employeeDetails.bankSwift}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Render Bank details custom fields if they exist */}
                  {Array.isArray(employeeDetails.customBankFields) && employeeDetails.customBankFields.length > 0 && (
                    <div className="pt-3 mt-3 border-t border-gray-50 dark:border-gray-700/30">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Additional Bank Information</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {employeeDetails.customBankFields.map((field, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{field.key}</p>
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{field.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SummaryCard>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 md:p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-soft border border-gray-100 dark:border-gray-700">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-5 py-2.5 font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all hover:translate-x-[-4px]"
          >
            <FiChevronLeft size={20} />
            Go Back
          </button>

          <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
            <button
              onClick={handleSaveDraft}
              className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold rounded-full border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm whitespace-nowrap"
            >
              <span className="sm:hidden">Save Draft</span>
              <span className="hidden sm:inline">Save as Draft</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <span className="sm:hidden">Submit</span>
                  <span className="hidden sm:inline">Submit Onboarding</span>
                  <FiSend size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingReview;
