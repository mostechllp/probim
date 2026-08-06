import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "../../components/common/Toast";
import { format } from "date-fns";

// Redux Actions
import {
  fetchMyPayrollHistory,
  fetchMyPayrollSummary,
  downloadMyPayslip,
} from "../store/slices/myPayrollSlice";

import Pagination from "../../admin/components/common/Paginations";
import EntriesSelector from "../../admin/components/common/EntriesSelector";

const MyPayroll = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth || {});
  const {
    history: payrolls,
    summary: stats,
    loading,
    totalCount,
    perPage,
  } = useSelector((state) => state.myPayroll);

  const [currentPageState, setCurrentPageState] = useState(1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());

  const fetchPayrollsData = useCallback(() => {
    const params = {
      page: currentPageState,
      per_page: perPage || 10,
      year: yearFilter || undefined,
    };
    dispatch(fetchMyPayrollHistory(params));
  }, [dispatch, currentPageState, yearFilter, perPage]);

  useEffect(() => {
    fetchPayrollsData();
  }, [fetchPayrollsData]);

  useEffect(() => {
    const params = {
      year: yearFilter || undefined,
    };
    dispatch(fetchMyPayrollSummary(params));
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
      await dispatch(downloadMyPayslip(payrollId)).unwrap();
      showToast("Payslip downloaded successfully!", "success");
    } catch (error) {
      showToast(error || "Failed to download payslip", "error");
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
  const fallbackTotalAmount = payrolls?.reduce((sum, p) => sum + (Number(p.net_pay) || 0), 0) || 0;
  const fallbackPaidMonths = payrolls?.filter(p => ['paid', 'completed'].includes(p.status?.toLowerCase())).length || 0;

  const totalAmountYTD = stats?.total_amount || stats?.totalAmount || fallbackTotalAmount;
  const totalPaidMonths = stats?.total_paid || stats?.paidCount || stats?.totalPayrolls || fallbackPaidMonths;

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
      <div className="leave-table-wrapper bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-x-auto shadow-sm">
        <div className="p-5 border-b border-[var(--border)] bg-[var(--surface)] flex justify-between items-center">
          <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
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

        <table className="leave-table w-full border-collapse text-xs min-w-[900px]">
          <thead>
            <tr className="bg-[var(--surface2)]">
              <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] border-b border-[var(--border)]">
                Month/Year
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] border-b border-[var(--border)]">
                Gross Pay
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] border-b border-[var(--border)]">
                Deductions
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] border-b border-[var(--border)]">
                Net Pay
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] border-b border-[var(--border)]">
                Status
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--muted)] border-b border-[var(--border)]">
                Payment Date
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--muted)] border-b border-[var(--border)] w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && payrolls.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-[var(--muted)]">
                  <div className="flex flex-col items-center justify-center">
                    <i className="fas fa-spinner fa-spin text-3xl text-green-500 mb-3 block"></i>
                    <p>Loading your payslips...</p>
                  </div>
                </td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-[var(--muted)]">
                  <div className="flex flex-col items-center gap-2">
                    <i className="fas fa-folder-open text-3xl text-[var(--muted)] mb-2 block"></i>
                    <p>No payslips found for this period.</p>
                  </div>
                </td>
              </tr>
            ) : (
              payrolls.map((payroll) => (
                <tr key={payroll.id} className="hover:bg-[var(--surface2)] transition-colors">
                  <td className="py-3.5 px-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800`}
                      >
                        <i className="fas fa-calendar-alt text-[10px]"></i>
                        {getMonthName(payroll.month).substring(0,3)} {payroll.year}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold">
                    {formatCurrency(payroll.gross_salary)}
                  </td>
                  <td className="py-3.5 px-4 border-b border-[var(--border)] text-red-500 font-semibold">
                    {formatCurrency(payroll.total_deductions)}
                  </td>
                  <td className="py-3.5 px-4 border-b border-[var(--border)] font-bold text-green-500">
                    {formatCurrency(payroll.net_pay)}
                  </td>
                  <td className="py-3.5 px-4 border-b border-[var(--border)]">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${getStatusBadge(payroll.status)}`}>
                      {payroll.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 border-b border-[var(--border)] text-[var(--text-secondary)]">
                    {formatDate(payroll.payment_date)}
                  </td>
                  <td className="py-3.5 px-4 border-b border-[var(--border)] text-right">
                    <button
                      onClick={() => handleGeneratePayslip(payroll.id)}
                      className="text-blue-500 hover:text-blue-600 hover:underline flex items-center justify-end gap-1 text-xs ml-auto"
                      title="Download PDF"
                    >
                      <i className="fas fa-file-pdf"></i> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

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
