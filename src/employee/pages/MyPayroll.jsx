import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "../../components/common/Toast";
import { format } from "date-fns";

// Redux Actions
import {
  fetchPayrolls,
  generatePayslip,
  fetchPayrollStats,
} from "../../admin/store/slices/payrollSlice";

import Pagination from "../../admin/components/common/Paginations";
import EntriesSelector from "../../admin/components/common/EntriesSelector";

const MyPayroll = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth || {});
  const {
    payrolls,
    loading,
    totalCount,
    perPage,
    stats,
  } = useSelector((state) => state.payroll);

  const [currentPageState, setCurrentPageState] = useState(1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  // Function to fetch payrolls
  const fetchPayrollsData = useCallback(() => {
    const params = {
      page: currentPageState,
      per_page: perPage || 10,
      year: yearFilter || undefined,
    };
    dispatch(fetchPayrolls(params));
  }, [dispatch, currentPageState, yearFilter, perPage]);

  useEffect(() => {
    fetchPayrollsData();
  }, [fetchPayrollsData]);

  useEffect(() => {
    const params = {
      year: yearFilter || undefined,
    };
    dispatch(fetchPayrollStats(params));
  }, [dispatch, yearFilter]);

  const handlePageChange = (page) => {
    setCurrentPageState(page);
  };

  const handleYearFilterChange = (e) => {
    setYearFilter(e.target.value);
    setCurrentPageState(1);
  };

  const handleGeneratePayslip = async (payrollId) => {
    try {
      await dispatch(generatePayslip(payrollId)).unwrap();
      showToast("Payslip downloaded successfully!", "success");
    } catch (error) {
      showToast(error || "Failed to generate payslip", "error");
    }
  };

  const formatCurrency = (amount, currencyCode = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-800",
      paid: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
      draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800",
    };
    return statusMap[status?.toLowerCase()] || statusMap.draft;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch {
      return date;
    }
  };

  const getMonthName = (monthNumber) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return months[monthNumber - 1] || monthNumber;
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: "", label: "All Time" },
    ...Array.from({ length: 5 }, (_, i) => ({
      value: String(currentYear - i),
      label: String(currentYear - i),
    })),
  ];

  // Latest Payroll for the Hero Section
  const latestPayroll = payrolls && payrolls.length > 0 ? payrolls[0] : null;
  const totalAmountYTD = stats?.total_amount || 0;
  const totalPaidMonths = stats?.total_paid || 0;

  return (
    <div className="w-full overflow-x-hidden px-4 md:px-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            My Salary & Payslips
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View your salary history, download payslips, and track earnings.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-soft border border-gray-100 dark:border-gray-700">
          <i className="fas fa-filter text-gray-400 pl-2"></i>
          <select
            value={yearFilter}
            onChange={handleYearFilterChange}
            className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none pr-4 cursor-pointer"
          >
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="dark:bg-gray-800">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Hero Card - Latest Salary */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 shadow-xl p-6 md:p-8 text-white transition-transform duration-300 hover:scale-[1.01]">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-emerald-400 opacity-10 blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold tracking-wider uppercase mb-3">
                  <i className="fas fa-star text-yellow-300 text-[10px]"></i> Latest Payslip
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mb-1">
                  {latestPayroll ? formatCurrency(latestPayroll.net_pay) : "₹0"}
                </h2>
                <p className="text-emerald-100 text-sm font-medium">
                  Net Salary for {latestPayroll ? `${getMonthName(latestPayroll.month)} ${latestPayroll.year}` : "Current Month"}
                </p>
              </div>
              {latestPayroll && (
                <div className={`px-3 py-1 rounded-lg text-xs font-bold border backdrop-blur-md ${
                  latestPayroll.status.toLowerCase() === 'paid' || latestPayroll.status.toLowerCase() === 'completed'
                    ? "bg-green-500/20 text-white border-green-400/30" 
                    : "bg-yellow-500/20 text-yellow-100 border-yellow-400/30"
                }`}>
                  {latestPayroll.status.toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex gap-6">
                <div>
                  <p className="text-emerald-200/80 text-[10px] uppercase tracking-wider mb-0.5">Gross Pay</p>
                  <p className="font-semibold">{latestPayroll ? formatCurrency(latestPayroll.gross_salary) : "-"}</p>
                </div>
                <div>
                  <p className="text-emerald-200/80 text-[10px] uppercase tracking-wider mb-0.5">Deductions</p>
                  <p className="font-semibold">{latestPayroll ? formatCurrency(latestPayroll.total_deductions) : "-"}</p>
                </div>
              </div>
              
              <button
                onClick={() => latestPayroll && handleGeneratePayslip(latestPayroll.id)}
                disabled={!latestPayroll}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-download"></i>
                Download Payslip
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Column */}
        <div className="grid grid-rows-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-gray-700 flex flex-col justify-center transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
              <i className="fas fa-wallet text-lg"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
              {formatCurrency(totalAmountYTD)}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
              Total Earnings {yearFilter ? `(${yearFilter})` : "(YTD)"}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft border border-gray-100 dark:border-gray-700 flex flex-col justify-center transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4">
              <i className="fas fa-calendar-check text-lg"></i>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
              {totalPaidMonths} Months
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
              Payslips Processed
            </p>
          </div>
        </div>
      </div>

      {/* History Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <i className="fas fa-history text-green-500"></i>
            Payment History
          </h3>
          <EntriesSelector
            value={perPage || 10}
            onChange={(val) => {
              // Update per page handled in the parent component ideally, or skip if not implemented
            }}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month/Year</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross Pay</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deductions</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Pay</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {loading && payrolls.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <i className="fas fa-spinner fa-spin text-2xl text-green-500 mb-3"></i>
                      <p>Loading your payslips...</p>
                    </div>
                  </td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700">
                      <i className="fas fa-folder-open text-gray-300 dark:text-gray-600 text-2xl"></i>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No payslips found for this period.</p>
                  </td>
                </tr>
              ) : (
                payrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-green-50/30 dark:hover:bg-gray-700/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 group-hover:border-green-300 dark:group-hover:border-green-700 transition-colors">
                          <span className="text-[10px] font-bold uppercase -mb-1">{getMonthName(payroll.month).substring(0,3)}</span>
                          <span className="text-[9px] text-gray-400">{payroll.year}</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                          {getMonthName(payroll.month)} {payroll.year}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(payroll.gross_salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 dark:text-red-400 font-medium">
                      {formatCurrency(payroll.total_deductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {formatCurrency(payroll.net_pay)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(payroll.status)}`}>
                        {payroll.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(payroll.payment_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleGeneratePayslip(payroll.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                        title="Download PDF"
                      >
                        <i className="fas fa-file-pdf text-lg"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30">
            <Pagination
              currentPage={currentPageState}
              totalItems={totalCount}
              itemsPerPage={perPage || 10}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPayroll;
