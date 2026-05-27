import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import SearchBar from "../common/SearchBar";
import EntriesSelector from "../common/EntriesSelector";
import { showToast } from "../../../components/common/Toast";
import Pagination from "../common/Paginations";
import { fetchEmployeeUpcomingRenewalsReport } from "../../store/slices/reportSlice";
import ExportModal from "../../../components/common/ExportModal";
import { exportToCSV, formatDate, getDaysDifference } from "../../../utils/reportUtils";
import { generateEmployeeUpcomingRenewalsPDF } from "../../../utils/reportPDFConfigs";

const EmployeeUpcomingRenewalsReport = () => {
  const dispatch = useDispatch();
  const { employees = [], loading } = useSelector(
    (state) => state.employees || {},
  );

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter states
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [minDays, setMinDays] = useState(31);
  const [maxDays, setMaxDays] = useState(90);

  useEffect(() => {
    dispatch(
      fetchEmployeeUpcomingRenewalsReport({
        page: currentPage,
        per_page: perPage,
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      }),
    );
  }, [dispatch]);

  // Reset to first page when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchTerm, selectedCompany, selectedDepartment, minDays, maxDays, perPage]);

  // Transform employee data to extract document expiry fields
  const transformEmployee = (emp) => {
    const raw = emp.raw;
    const user = raw?.user;
    const company = user?.company;
    const department = user?.department;

    return {
      id: emp.id,
      emp_id: raw?.employee_id || "-",
      name: emp.name,
      company_name: company?.company_name || "-",
      department_name: department?.name || "-",
      passport_expiry: raw?.passport_expiry_date,
      visa_expiry: raw?.visa_expiry_date,
      labor_expiry: raw?.labor_expiry_date,
      eid_expiry: raw?.eid_expiry_date,
      // Additional fields for better export
      email: raw?.company_email || raw?.personal_email || user?.email || "-",
      phone: raw?.company_mobile_number || raw?.personal_number || "-",
    };
  };

  // Check if a date is within the upcoming renewal range
  const isUpcomingRenewal = (dateStr) => {
    const daysLeft = getDaysDifference(dateStr);
    return daysLeft !== null && daysLeft >= minDays && daysLeft <= maxDays;
  };

  // Get the earliest upcoming expiry with document type
  const getEarliestUpcomingExpiry = (employee) => {
    const expiryItems = [
      { date: employee.passport_expiry, name: "Passport", key: "passport" },
      { date: employee.visa_expiry, name: "Visa", key: "visa" },
      { date: employee.labor_expiry, name: "Labor Card", key: "labor" },
      { date: employee.eid_expiry, name: "EID", key: "eid" },
    ].map(item => ({
      ...item,
      days: getDaysDifference(item.date)
    })).filter(
      item => item.days !== null && item.days >= minDays && item.days <= maxDays
    );

    if (expiryItems.length === 0) return null;
    return expiryItems.reduce((min, item) => 
      item.days < min.days ? item : min, expiryItems[0]
    );
  };

  // Get employees with upcoming renewals
  const getEmployeesWithUpcomingRenewals = () => {
    const transformedEmps = Array.isArray(employees)
      ? employees.map(transformEmployee)
      : [];

    let filtered = transformedEmps.filter((emp) => {
      // Check if any document is expiring within the upcoming renewal range
      return (
        isUpcomingRenewal(emp.passport_expiry) ||
        isUpcomingRenewal(emp.visa_expiry) ||
        isUpcomingRenewal(emp.labor_expiry) ||
        isUpcomingRenewal(emp.eid_expiry)
      );
    });

    // Apply company filter
    if (selectedCompany !== "all") {
      filtered = filtered.filter((emp) => emp.company_name === selectedCompany);
    }

    // Apply department filter
    if (selectedDepartment !== "all") {
      filtered = filtered.filter(
        (emp) => emp.department_name === selectedDepartment,
      );
    }

    // Apply search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          (emp.emp_id || "").toLowerCase().includes(searchLower) ||
          (emp.name || "").toLowerCase().includes(searchLower) ||
          (emp.company_name || "").toLowerCase().includes(searchLower) ||
          (emp.department_name || "").toLowerCase().includes(searchLower) ||
          (emp.email || "").toLowerCase().includes(searchLower) ||
          (emp.phone || "").toLowerCase().includes(searchLower),
      );
    }

    // Sort by earliest upcoming expiry date
    filtered.sort((a, b) => {
      const expiryA = getEarliestUpcomingExpiry(a);
      const expiryB = getEarliestUpcomingExpiry(b);

      if (!expiryA && !expiryB) return 0;
      if (!expiryA) return 1;
      if (!expiryB) return -1;

      return expiryA.days - expiryB.days;
    });

    return filtered;
  };

  // Transform data for export
  const getExportData = () => {
    const filteredEmployees = getEmployeesWithUpcomingRenewals();
    return filteredEmployees.map((emp) => {
      const earliest = getEarliestUpcomingExpiry(emp);
      return {
        emp_id: emp.emp_id,
        name: emp.name,
        company_name: emp.company_name,
        department_name: emp.department_name,
        passport_expiry: formatDate(emp.passport_expiry),
        visa_expiry: formatDate(emp.visa_expiry),
        labor_expiry: formatDate(emp.labor_expiry),
        eid_expiry: formatDate(emp.eid_expiry),
        earliest_document: earliest ? earliest.name : "-",
        days_left: earliest ? `${earliest.days} days` : "-",
        email: emp.email,
        phone: emp.phone,
        renewal_range: `${minDays}-${maxDays} days`,
      };
    });
  };

  const filteredEmployees = getEmployeesWithUpcomingRenewals();
  const totalFiltered = filteredEmployees.length;
  const totalPages = Math.ceil(totalFiltered / perPage);
  const start = (currentPage - 1) * perPage;
  const pageEmployees = filteredEmployees.slice(start, start + perPage);

  const handleResetFilters = () => {
    setSelectedCompany("all");
    setSelectedDepartment("all");
    setMinDays(31);
    setMaxDays(90);
    setSearchTerm("");
    setCurrentPage(1);
    showToast("Filters reset successfully", "success");
  };

  const handleExport = async (format) => {
    const exportData = getExportData();
    
    if (exportData.length === 0) {
      showToast("No data to export", "warning");
      return;
    }

    const headers = [
      { key: "emp_id", label: "Employee ID" },
      { key: "name", label: "Name" },
      { key: "company_name", label: "Company" },
      { key: "department_name", label: "Department" },
      { key: "passport_expiry", label: "Passport Expiry" },
      { key: "visa_expiry", label: "Visa Expiry" },
      { key: "labor_expiry", label: "Labor Expiry" },
      { key: "eid_expiry", label: "EID Expiry" },
      { key: "earliest_document", label: "Earliest Document" },
      { key: "days_left", label: "Days Left" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "renewal_range", label: "Renewal Range" },
    ];

    const filename = `employee_upcoming_renewals_${minDays}_${maxDays}days_${new Date().toISOString().split("T")[0]}`;

    if (format === "csv") {
      exportToCSV(exportData, headers, `${filename}.csv`);
      showToast("Employee upcoming renewals exported successfully!", "success");
    } else if (format === "pdf") {
      generateEmployeeUpcomingRenewalsPDF(filteredEmployees, "Employee Upcoming Renewals Report", {
        minDays: minDays,
        maxDays: maxDays,
        company: selectedCompany !== "all" ? selectedCompany : null,
        department: selectedDepartment !== "all" ? selectedDepartment : null,
        search: searchTerm || null,
        generated_date: new Date().toISOString(),
      });
      showToast("PDF report generated successfully!", "success");
    }
  };

  const getUpcomingClass = (expiryDate) => {
    const daysLeft = getDaysDifference(expiryDate);
    if (!daysLeft) return "";

    if (daysLeft >= 31 && daysLeft <= 45) {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
    if (daysLeft >= 46 && daysLeft <= 60) {
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400";
    }
    if (daysLeft >= 61 && daysLeft <= 90) {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
    return "";
  };

  // Get unique companies and departments for filters
  const transformedEmps = Array.isArray(employees)
    ? employees.map(transformEmployee)
    : [];
  const uniqueCompanies = [
    ...new Set(
      transformedEmps.map((emp) => emp.company_name).filter((c) => c !== "-"),
    ),
  ];
  const uniqueDepartments = [
    ...new Set(
      transformedEmps
        .map((emp) => emp.department_name)
        .filter((d) => d !== "-"),
    ),
  ];

  // Calculate stats for different upcoming periods
  const getCountForRange = (start, end) => {
    let count = 0;
    transformedEmps.forEach((emp) => {
      const expiryDates = [
        getDaysDifference(emp.passport_expiry),
        getDaysDifference(emp.visa_expiry),
        getDaysDifference(emp.labor_expiry),
        getDaysDifference(emp.eid_expiry),
      ].filter((days) => days !== null && days >= start && days <= end);

      if (expiryDates.length > 0) count++;
    });
    return count;
  };

  const renewing31to45Days = getCountForRange(31, 45);
  const renewing46to60Days = getCountForRange(46, 60);
  const renewing61to90Days = getCountForRange(61, 90);

  // Get document type stats for upcoming renewals
  const getDocumentStats = () => {
    let passportUpcoming = 0;
    let visaUpcoming = 0;
    let laborUpcoming = 0;
    let eidUpcoming = 0;

    transformedEmps.forEach((emp) => {
      if (isUpcomingRenewal(emp.passport_expiry)) passportUpcoming++;
      if (isUpcomingRenewal(emp.visa_expiry)) visaUpcoming++;
      if (isUpcomingRenewal(emp.labor_expiry)) laborUpcoming++;
      if (isUpcomingRenewal(emp.eid_expiry)) eidUpcoming++;
    });

    return { passportUpcoming, visaUpcoming, laborUpcoming, eidUpcoming };
  };

  const docStats = getDocumentStats();

  return (
    <div className="w-full overflow-x-hidden">
      <main className="content px-4 py-4 md:px-6 md:py-6 w-full overflow-x-hidden">
        {/* Page Header with Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-6 flex-wrap">
            <Link
              to="/admin/reports"
              className="text-green-500 hover:text-green-600 font-medium"
            >
              Reports
            </Link>
            <i className="fas fa-chevron-right text-gray-400 text-[10px] md:text-xs"></i>
            <span className="text-gray-500">
              Employee Upcoming Renewals Report
            </span>
          </div>
          <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-green-600 bg-clip-text text-transparent">
            Employee Upcoming Renewals Report
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Employees with documents expiring within {minDays}-{maxDays} days
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  31 - 45 days
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {renewing31to45Days}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-calendar-week text-blue-600 dark:text-blue-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  46 - 60 days
                </p>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {renewing46to60Days}
                </p>
              </div>
              <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-calendar-alt text-cyan-600 dark:text-cyan-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  61 - 90 days
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {renewing61to90Days}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-calendar-check text-green-600 dark:text-green-400"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Document Type Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Passport Upcoming
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {docStats.passportUpcoming}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-passport text-blue-600 dark:text-blue-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Visa Upcoming
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {docStats.visaUpcoming}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-id-card text-purple-600 dark:text-purple-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Labor Upcoming
                </p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {docStats.laborUpcoming}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-briefcase text-orange-600 dark:text-orange-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  EID Upcoming
                </p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {docStats.eidUpcoming}
                </p>
              </div>
              <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-id-card text-teal-600 dark:text-teal-400"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Company Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <i className="fas fa-building mr-1"></i> Company
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
              >
                <option value="all">All Companies</option>
                {uniqueCompanies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <i className="fas fa-diagram-project mr-1"></i> Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
              >
                <option value="all">All Departments</option>
                {uniqueDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Renewal Period Range */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                <i className="fas fa-hourglass-half mr-1"></i> Renewal Period (Days)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minDays}
                  onChange={(e) => setMinDays(Number(e.target.value))}
                  min="1"
                  className="w-1/2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                  placeholder="Min"
                />
                <span className="text-gray-500 dark:text-gray-400 self-center">
                  to
                </span>
                <input
                  type="number"
                  value={maxDays}
                  onChange={(e) => setMaxDays(Number(e.target.value))}
                  min="1"
                  className="w-1/2 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-green-500"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                <i className="fas fa-undo-alt"></i> Reset
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <i className="fas fa-info-circle mr-1"></i>
            Showing employees with documents expiring between {minDays} and {maxDays} days from today
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-5">
          <EntriesSelector
            value={perPage}
            onChange={(val) => {
              setPerPage(val);
              setCurrentPage(1);
            }}
          />
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <SearchBar
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setCurrentPage(1);
              }}
              placeholder="Search by name, emp ID, company, email, phone..."
            />
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <i className="fas fa-download"></i> Export Report
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && filteredEmployees.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <i className="fas fa-spinner fa-spin text-3xl text-green-500 mb-3"></i>
            <p className="text-gray-500 dark:text-gray-400">
              Loading employee renewal data...
            </p>
          </div>
        ) : (
          <>
            {/* Upcoming Renewals Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-soft">
              <div className="min-w-[1000px] lg:min-w-0">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        S.No
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        EMP ID
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        NAME
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        COMPANY
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        DEPARTMENT
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        PASSPORT EXPIRY
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        VISA EXPIRY
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        LABOR EXPIRY
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        EID EXPIRY
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        DAYS LEFT
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageEmployees.length > 0 ? (
                      pageEmployees.map((emp, idx) => {
                        const earliest = getEarliestUpcomingExpiry(emp);
                        
                        return (
                          <tr
                            key={emp.id}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
                              {start + idx + 1}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-mono text-gray-700 dark:text-gray-300">
                              {emp.emp_id}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {emp.name}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              {emp.company_name}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                              {emp.department_name}
                            </td>
                            <td
                              className={`px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm ${getUpcomingClass(emp.passport_expiry)}`}
                            >
                              {formatDate(emp.passport_expiry)}
                            </td>
                            <td
                              className={`px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm ${getUpcomingClass(emp.visa_expiry)}`}
                            >
                              {formatDate(emp.visa_expiry)}
                            </td>
                            <td
                              className={`px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm ${getUpcomingClass(emp.labor_expiry)}`}
                            >
                              {formatDate(emp.labor_expiry)}
                            </td>
                            <td
                              className={`px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm ${getUpcomingClass(emp.eid_expiry)}`}
                            >
                              {formatDate(emp.eid_expiry)}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                              {earliest ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                    earliest.days >= 31 && earliest.days <= 45
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                      : earliest.days >= 46 && earliest.days <= 60
                                        ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  }`}
                                >
                                  <i className="fas fa-calendar-day text-[10px]"></i>
                                  {earliest.days} days ({earliest.name})
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan="10"
                          className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <i className="fas fa-calendar-plus text-4xl text-gray-300 dark:text-gray-600"></i>
                            <p>No employees with upcoming renewals found</p>
                            <p className="text-xs">
                              Try changing the renewal period or filters
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalFiltered > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalFiltered}
                itemsPerPage={perPage}
              />
            )}
          </>
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        title="Export Employee Upcoming Renewals"
        totalRecords={getExportData().length}
        formats={["csv", "pdf"]}
        defaultFormat="csv"
      />
    </div>
  );
};

export default EmployeeUpcomingRenewalsReport;