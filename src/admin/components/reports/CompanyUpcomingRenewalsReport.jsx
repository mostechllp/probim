import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import SearchBar from "../common/SearchBar";
import EntriesSelector from "../common/EntriesSelector";
import { showToast } from "../../../components/common/Toast";
import Pagination from "../common/Paginations";
import { fetchCompanyUpcomingRenewalsReport } from "../../store/slices/reportSlice";
import ExportModal from "../../../components/common/ExportModal";
import { exportToCSV, formatDate, getDaysDifference } from "../../../utils/reportUtils";
import { generateCompanyUpcomingRenewalsPDF } from "../../../utils/reportPDFConfigs";

const CompanyUpcomingRenewalsReport = () => {
  const dispatch = useDispatch();
  const { organizations = [], loading } = useSelector(
    (state) => state.organizations || {},
  );

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter states
  const [minDays, setMinDays] = useState(31);
  const [maxDays, setMaxDays] = useState(90);

  useEffect(() => {
    dispatch(
      fetchCompanyUpcomingRenewalsReport({
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
  }, [searchTerm, minDays, maxDays, perPage]);

  // Transform organization data to extract document expiry fields
  const transformOrganization = (org) => {
    // Handle both organization and individual company structures
    const companies = org.companies || (org.id ? [org] : []);

    if (companies.length > 0) {
      return companies.map((company) => ({
        id: company.id,
        name: company.company_name || org.name || "-",
        organization_id: org.id,
        organization_name: org.name,
        trade_license_number:
          company.trade_license_number || org.trade_license_number,
        trade_license_expiry:
          company.trade_license_expiry || org.trade_license_expiry,
        establishment_card_number:
          company.establishment_card_number || org.establishment_card_number,
        establishment_card_expiry:
          company.establishment_card_expiry || org.establishment_card_expiry,
        phone: company.phone || org.phone,
        email: company.email || org.email,
        address: company.address || org.address,
      }));
    }

    // Single organization/company
    return [
      {
        id: org.id,
        name: org.company_name || org.name || "-",
        trade_license_number: org.trade_license_number,
        trade_license_expiry: org.trade_license_expiry,
        establishment_card_number: org.establishment_card_number,
        establishment_card_expiry: org.establishment_card_expiry,
        phone: org.phone,
        email: org.email,
        address: org.address,
      },
    ];
  };

  // Check if a date is within the upcoming renewal range (31-90 days)
  const isUpcomingRenewal = (dateStr) => {
    const daysLeft = getDaysDifference(dateStr);
    return daysLeft !== null && daysLeft >= minDays && daysLeft <= maxDays;
  };

  // Get companies with upcoming renewals
  const getCompaniesWithUpcomingRenewals = () => {
    let allCompanies = [];

    if (Array.isArray(organizations)) {
      organizations.forEach((org) => {
        const companies = transformOrganization(org);
        allCompanies = [...allCompanies, ...companies];
      });
    }

    let filtered = allCompanies.filter((company) => {
      // Check if any document is expiring within the upcoming renewal range
      return (
        isUpcomingRenewal(company.trade_license_expiry) ||
        isUpcomingRenewal(company.establishment_card_expiry)
      );
    });

    // Apply search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          (company.name || "").toLowerCase().includes(searchLower) ||
          (company.trade_license_number || "")
            .toLowerCase()
            .includes(searchLower) ||
          (company.establishment_card_number || "")
            .toLowerCase()
            .includes(searchLower),
      );
    }

    // Sort by earliest upcoming expiry date
    filtered.sort((a, b) => {
      const getEarliestUpcomingDays = (company) => {
        const expiryDates = [
          {
            date: company.trade_license_expiry,
            days: getDaysDifference(company.trade_license_expiry),
          },
          {
            date: company.establishment_card_expiry,
            days: getDaysDifference(company.establishment_card_expiry),
          },
        ].filter(
          (item) =>
            item.days !== null && item.days >= minDays && item.days <= maxDays,
        );

        if (expiryDates.length === 0) return null;
        return Math.min(...expiryDates.map((item) => item.days));
      };

      const daysA = getEarliestUpcomingDays(a);
      const daysB = getEarliestUpcomingDays(b);

      if (!daysA && !daysB) return 0;
      if (!daysA) return 1;
      if (!daysB) return -1;

      return daysA - daysB;
    });

    return filtered;
  };

  // Transform data for export
  const getExportData = () => {
    const filteredCompanies = getCompaniesWithUpcomingRenewals();
    return filteredCompanies.map((company) => ({
      company_name: company.name,
      trade_license_number: company.trade_license_number || "-",
      trade_license_expiry: formatDate(company.trade_license_expiry),
      trade_license_days_left: getDaysDifference(company.trade_license_expiry) || "-",
      establishment_card_number: company.establishment_card_number || "-",
      establishment_card_expiry: formatDate(company.establishment_card_expiry),
      establishment_card_days_left: getDaysDifference(company.establishment_card_expiry) || "-",
      phone: company.phone || "-",
      email: company.email || "-",
      renewal_range: `${minDays}-${maxDays} days`,
    }));
  };

  const filteredCompanies = getCompaniesWithUpcomingRenewals();
  const totalFiltered = filteredCompanies.length;
  const totalPages = Math.ceil(totalFiltered / perPage);
  const start = (currentPage - 1) * perPage;
  const pageCompanies = filteredCompanies.slice(start, start + perPage);

  const handleResetFilters = () => {
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
    { key: "company_name", label: "Company Name" },
    { key: "trade_license_number", label: "Trade License" },
    { key: "trade_license_expiry", label: "TL Expiry Date" },
    { key: "trade_license_days_left", label: "Days Left (TL)" },
    { key: "establishment_card_number", label: "Establishment Card" },
    { key: "establishment_card_expiry", label: "EC Expiry Date" },
    { key: "establishment_card_days_left", label: "Days Left (EC)" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "renewal_range", label: "Renewal Range" },
  ];

  const filename = `company_upcoming_renewals_${minDays}_${maxDays}days_${new Date().toISOString().split("T")[0]}`;

  if (format === "csv") {
    exportToCSV(exportData, headers, `${filename}.csv`);
    showToast("Company upcoming renewals exported successfully!", "success");
  } else if (format === "pdf") {
    // Use the correct PDF generator for upcoming renewals
    generateCompanyUpcomingRenewalsPDF(filteredCompanies, "Company Upcoming Renewals Report", {
      minDays: minDays,
      maxDays: maxDays,
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

  // Calculate stats for different upcoming periods
  const getCountForRange = (start, end) => {
    let allCompanies = [];
    if (Array.isArray(organizations)) {
      organizations.forEach((org) => {
        const companies = transformOrganization(org);
        allCompanies = [...allCompanies, ...companies];
      });
    }

    let count = 0;
    allCompanies.forEach((company) => {
      const tlDays = getDaysDifference(company.trade_license_expiry);
      const ecDays = getDaysDifference(company.establishment_card_expiry);

      if (
        (tlDays !== null && tlDays >= start && tlDays <= end) ||
        (ecDays !== null && ecDays >= start && ecDays <= end)
      ) {
        count++;
      }
    });
    return count;
  };

  const renewing31to45Days = getCountForRange(31, 45);
  const renewing46to60Days = getCountForRange(46, 60);
  const renewing61to90Days = getCountForRange(61, 90);

  // Get document type stats for upcoming renewals
  const getDocumentStats = () => {
    let allCompanies = [];
    if (Array.isArray(organizations)) {
      organizations.forEach((org) => {
        const companies = transformOrganization(org);
        allCompanies = [...allCompanies, ...companies];
      });
    }

    let tradeLicenseUpcoming = 0;
    let establishmentCardUpcoming = 0;

    allCompanies.forEach((company) => {
      if (isUpcomingRenewal(company.trade_license_expiry))
        tradeLicenseUpcoming++;
      if (isUpcomingRenewal(company.establishment_card_expiry))
        establishmentCardUpcoming++;
    });

    return { tradeLicenseUpcoming, establishmentCardUpcoming };
  };

  const stats = getDocumentStats();

  // Fix typo in breadcrumb
  const breadcrumbText = "Company Upcoming Renewal Report";

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
            <span className="text-gray-500">{breadcrumbText}</span>
          </div>
          <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-green-600 bg-clip-text text-transparent">
            {breadcrumbText}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Companies with documents expiring within {minDays}-{maxDays} days
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

        {/* Info Cards for Document Types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Trade License Upcoming
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.tradeLicenseUpcoming}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-file-alt text-blue-600 dark:text-blue-400"></i>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Establishment Card Upcoming
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.establishmentCardUpcoming}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-id-card text-purple-600 dark:text-purple-400"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            Showing documents expiring between {minDays} and {maxDays} days from today
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
              placeholder="Search by company name, trade license, establishment card..."
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
        {loading && filteredCompanies.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <i className="fas fa-spinner fa-spin text-3xl text-green-500 mb-3"></i>
            <p className="text-gray-500 dark:text-gray-400">
              Loading company renewal data...
            </p>
          </div>
        ) : (
          <>
            {/* Upcoming Renewals Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-soft">
              <div className="min-w-[800px] md:min-w-0">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        S.No
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        COMPANY NAME
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        TRADE LICENSE
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        TL EXPIRY
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        DAYS LEFT
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        EST. CARD
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        EC EXPIRY
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        DAYS LEFT
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageCompanies.length > 0 ? (
                      pageCompanies.map((company, idx) => {
                        const tlDays = getDaysDifference(
                          company.trade_license_expiry,
                        );
                        const ecDays = getDaysDifference(
                          company.establishment_card_expiry,
                        );

                        // Only show if at least one document is in the upcoming range
                        const showTradeLicense =
                          tlDays !== null &&
                          tlDays >= minDays &&
                          tlDays <= maxDays;
                        const showEstablishmentCard =
                          ecDays !== null &&
                          ecDays >= minDays &&
                          ecDays <= maxDays;

                        if (!showTradeLicense && !showEstablishmentCard)
                          return null;

                        return (
                          <tr
                            key={company.id}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center">
                              {start + idx + 1}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200">
                              {company.name}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-mono text-gray-600 dark:text-gray-400">
                              {company.trade_license_number || "-"}
                            </td>
                            <td
                              className={`px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm ${showTradeLicense ? getUpcomingClass(company.trade_license_expiry) : ""}`}
                            >
                              {formatDate(company.trade_license_expiry)}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                              {showTradeLicense && tlDays !== null ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                    tlDays >= 31 && tlDays <= 45
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                      : tlDays >= 46 && tlDays <= 60
                                        ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  }`}
                                >
                                  <i className="fas fa-hourglass-half text-[10px]"></i>
                                  {tlDays} days
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-mono text-gray-600 dark:text-gray-400">
                              {company.establishment_card_number || "-"}
                            </td>
                            <td
                              className={`px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm ${showEstablishmentCard ? getUpcomingClass(company.establishment_card_expiry) : ""}`}
                            >
                              {formatDate(company.establishment_card_expiry)}
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm">
                              {showEstablishmentCard && ecDays !== null ? (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                    ecDays >= 31 && ecDays <= 45
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                      : ecDays >= 46 && ecDays <= 60
                                        ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400"
                                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  }`}
                                >
                                  <i className="fas fa-hourglass-half text-[10px]"></i>
                                  {ecDays} days
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
                          colSpan="8"
                          className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <i className="fas fa-calendar-plus text-4xl text-gray-300 dark:text-gray-600"></i>
                            <p>No companies with upcoming renewals found</p>
                            <p className="text-xs">
                              Try changing the renewal period or search term
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
        title="Export Company Upcoming Renewals"
        totalRecords={getExportData().length}
        formats={["csv", "pdf"]}
        defaultFormat="csv"
      />
    </div>
  );
};

export default CompanyUpcomingRenewalsReport;