// src/admin/pages/PayrollView.js

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { showToast } from "../components/common/Toast";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  fetchPayrollById,
  generatePayslip,
  clearPayrollError,
  clearPayrollSuccess,
  selectCurrentPayroll,
  selectPayrollLoading,
  selectPayrollActionLoading,
  selectPayrollError,
  selectPayrollSuccess,
} from "../store/slices/payrollSlice";

import {
  fetchEmployeeById,
} from "../store/slices/employeeSlice";

function PayrollView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  // Redux state
  const currentPayroll = useSelector(selectCurrentPayroll);
  const isLoading = useSelector(selectPayrollLoading);
  const actionLoading = useSelector(selectPayrollActionLoading);
  const error = useSelector(selectPayrollError);
  const successMessage = useSelector(selectPayrollSuccess);

  // Local state
  const [activeStep, setActiveStep] = useState(1);
  const [employeeDetails, setEmployeeDetails] = useState(null);

  const steps = [
    { id: 1, label: "Basic Info", icon: "fa-user" },
    { id: 2, label: "Country Split", icon: "fa-globe" },
    { id: 3, label: "Overtime", icon: "fa-clock" },
    { id: 4, label: "Deductions", icon: "fa-minus-circle" },
    { id: 5, label: "Summary", icon: "fa-clipboard-check" },
  ];

  // Fetch payroll data on mount
  useEffect(() => {
    if (id) {
      dispatch(fetchPayrollById(id));
    }
  }, [dispatch, id]);

  // Fetch employee details when payroll data is loaded
  useEffect(() => {
    if (currentPayroll?.employee_id) {
      dispatch(fetchEmployeeById(currentPayroll.employee_id))
        .unwrap()
        .then((data) => setEmployeeDetails(data))
        .catch(() => setEmployeeDetails(null));
    }
  }, [currentPayroll, dispatch]);

  // Handle success/error messages
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

  // Format currency
  const formatCurrency = (amount, currency = "INR") => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "-";
    try {
      return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusMap = {
      paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      draft: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    };
    return statusMap[status?.toLowerCase()] || statusMap.draft;
  };

  // Handle payslip generation
  const handleGeneratePayslip = async () => {
    if (!id) return;
    try {
      await dispatch(generatePayslip(id)).unwrap();
      // Generate PDF preview
      generatePayslipPDF();
    } catch (error) {
      // Error handled by slice
    }
  };

  // Generate payslip PDF preview
  const generatePayslipPDF = () => {
    const doc = new jsPDF();
    const payroll = currentPayroll;

    doc.setFontSize(20);
    doc.text("Employee Payslip", 14, 22);

    doc.setFontSize(12);
    const empName = payroll?.employee_name || employeeDetails?.name || "Unknown Employee";
    const empId = payroll?.employee_id || employeeDetails?.employee_id || "-";
    const orgName = payroll?.organization_name || employeeDetails?.organization?.name || "-";
    
    doc.text(`Employee: ${empName} (${empId})`, 14, 32);
    doc.text(`Organization: ${orgName}`, 14, 38);
    doc.text(
      `Pay Period: ${payroll?.pay_period_month || ""} ${payroll?.pay_period_year || ""}`,
      14,
      44,
    );
    doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 14, 50);
    doc.text(`Status: ${payroll?.status || "Draft"}`, 14, 56);

    // Country split table
    if (payroll?.countries && payroll.countries.length > 0) {
      autoTable(doc, {
        startY: 62,
        head: [["Package / Location", "Days Logged", "Daily Rate", "Amount"]],
        body: payroll.countries.map((c) => [
          c.name || c.package_name || "-",
          c.days_worked || c.days || "-",
          `${c.currency || ""} ${c.daily_rate || c.rate || ""}`,
          formatCurrency(c.total_amount || c.amount, c.currency || "INR"),
        ]),
        theme: "grid",
        headStyles: { fillColor: [34, 197, 94] },
      });
    }

    // Overtime table
    if (payroll?.overtime_requests && payroll.overtime_requests.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable?.finalY + 10 || 100,
        head: [["Overtime Project", "Date", "Hours", "Status"]],
        body: payroll.overtime_requests.map((req) => [
          req.project || req.project_name || "-",
          formatDate(req.date),
          req.hours?.toString() || "0",
          req.status || "pending",
        ]),
        theme: "grid",
        headStyles: { fillColor: [34, 197, 94] },
      });
    }

    // Deductions table
    if (payroll?.deductions && payroll.deductions.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable?.finalY + 10 || 100,
        head: [["Deduction Type", "Country", "Amount"]],
        body: payroll.deductions.map((d) => [
          d.type || d.deduction_type || "-",
          d.country || "-",
          formatCurrency(d.amount, d.currency || "INR"),
        ]),
        theme: "grid",
        headStyles: { fillColor: [239, 68, 68] },
      });
    }

    // Summary
    autoTable(doc, {
      startY: doc.lastAutoTable?.finalY + 10 || 100,
      head: [["Gross Earnings", "Total Deductions", "Net Pay"]],
      body: [[
        formatCurrency(payroll?.gross_earnings || 0),
        formatCurrency(payroll?.total_deductions || 0),
        formatCurrency(payroll?.net_pay || 0),
      ]],
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });

    const fileName = `Payslip_${empName.replace(/\s/g, "_")}_${empId}.pdf`;
    doc.save(fileName);
    showToast("Payslip downloaded successfully!", "success");
  };

  // Render step content based on active step
  const renderStepContent = () => {
    const payroll = currentPayroll;
    if (!payroll) return null;

    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Employee Information Card */}
            <div>
              <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user text-green-600 dark:text-green-400 text-sm"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  Employee Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Employee ID
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {payroll.employee_id || employeeDetails?.employee_id || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Employee Name
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {payroll.employee_name || employeeDetails?.name || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Organization
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {payroll.organization_name || employeeDetails?.organization?.name || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {payroll.department || employeeDetails?.department?.name || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Designation
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {payroll.designation || employeeDetails?.designation?.name || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Employment Type
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 capitalize">
                    {payroll.employment_type || employeeDetails?.employment_type || "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* Pay Period Card */}
            <div>
              <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-alt text-green-600 dark:text-green-400 text-sm"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  Pay Period
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Pay Period Month
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 capitalize">
                    {payroll.pay_period_month || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Pay Period Year
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {payroll.pay_period_year || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Period Start Date
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {formatDate(payroll.period_start)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Period End Date
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {formatDate(payroll.period_end)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Payment Date
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {formatDate(payroll.payment_date)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Payment Mode
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {payroll.payment_mode || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Total Working Days
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {payroll.total_working_days || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Days Present
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {payroll.days_present || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-globe text-green-600 dark:text-green-400 text-sm"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Salary Packages (Multi-Location)
              </h3>
            </div>

            {(payroll.countries && payroll.countries.length > 0) ? (
              <div className="space-y-3">
                {payroll.countries.map((c, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                  >
                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-500 mb-1 block">Package</label>
                      <div className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        {c.package_name || c.name || "-"}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Currency</label>
                      <div className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        {c.currency || "-"}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Daily Rate</label>
                      <div className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        {c.currency || ""} {c.daily_rate || c.rate || "-"}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Days Logged</label>
                      <div className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        {c.days_worked || c.days || "-"}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Manual FX Rate</label>
                      <div className="px-3 py-2 text-sm rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400">
                        {c.fx_rate || c.exchange_rate || "-"}
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <label className="text-xs text-gray-500 mb-1 block">Amount</label>
                      <div className="px-3 py-2 text-sm font-semibold rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400">
                        {formatCurrency(c.total_amount || c.amount, c.currency || "INR")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="fas fa-globe text-4xl mb-3 block"></i>
                No country split data available
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                  Dubai Package (AED)
                </div>
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(payroll.dubai_total || 0, "AED")}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                  WFH Package (INR)
                </div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(payroll.wfh_total || 0)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                  Converted (AED → INR)
                </div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(payroll.converted_total || 0)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                  Combined Base (INR)
                </div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(payroll.combined_base || 0)}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-green-600 dark:text-green-400 text-sm"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Overtime Requests
              </h3>
            </div>

            {(payroll.overtime_requests && payroll.overtime_requests.length > 0) ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                        <th className="py-3 px-4 font-semibold">Project</th>
                        <th className="py-3 px-4 font-semibold">Date</th>
                        <th className="py-3 px-4 font-semibold">Hours</th>
                        <th className="py-3 px-4 font-semibold w-1/3">Reason</th>
                        <th className="py-3 px-4 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payroll.overtime_requests.map((req, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                            <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-medium border border-blue-100 dark:border-blue-800">
                              {req.project || req.project_name || "-"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(req.date)}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {req.hours || 0} hrs
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {req.reason || "-"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold border uppercase ${
                              req.status === "pending"
                                ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                                : req.status === "approved_project"
                                ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                                : req.status === "approved_payroll"
                                ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                                : "bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600"
                            }`}>
                              {req.status || "pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="fas fa-clock text-4xl mb-3 block"></i>
                No overtime requests available
              </div>
            )}

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
        );

      case 4:
        return (
          <div>
            <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-minus-circle text-green-600 dark:text-green-400 text-sm"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Deductions
              </h3>
            </div>

            {(payroll.deductions && payroll.deductions.length > 0) ? (
              <div className="space-y-3">
                {payroll.deductions.map((d, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                  >
                    <div className="md:col-span-4">
                      <label className="text-xs text-gray-500 mb-1 block">Type</label>
                      <div className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        {d.type || d.deduction_type || "-"}
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-500 mb-1 block">Country</label>
                      <div className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        {d.country || "-"}
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-500 mb-1 block">Amount</label>
                      <div className="px-3 py-2 text-sm font-semibold rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                        {formatCurrency(d.amount, d.currency || "INR")}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Statutory</label>
                      <div className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                        {d.statutory ? "Yes" : "No"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="fas fa-minus-circle text-4xl mb-3 block"></i>
                No deductions available
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                  India Deductions
                </div>
                <div className="text-xl font-bold text-red-500">
                  {formatCurrency(payroll.india_deductions || 0)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                  UAE Deductions (INR)
                </div>
                <div className="text-xl font-bold text-red-500">
                  {formatCurrency(payroll.uae_deductions || 0)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                  Total Deductions
                </div>
                <div className="text-xl font-bold text-red-600 dark:text-red-500">
                  {formatCurrency(payroll.total_deductions || 0)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                  Final Net Pay
                </div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(payroll.net_pay || 0)}
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-clipboard-check text-green-600 dark:text-green-400 text-sm"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Payroll Summary
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                    Gross Earnings
                  </div>
                  <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    {formatCurrency(payroll.gross_earnings || 0)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                    Total Deductions
                  </div>
                  <div className="text-xl font-bold text-red-500">
                    {formatCurrency(payroll.total_deductions || 0)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">
                    Combined (INR)
                  </div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(payroll.combined_base || 0)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                    Final Net Pay
                  </div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(payroll.net_pay || 0)}
                  </div>
                </div>
              </div>

              {/* Status and Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block">
                    Status
                  </label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(payroll.status)}`}>
                    {payroll.status || "Draft"}
                  </span>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block">
                    Payment Date
                  </label>
                  <div className="text-base font-semibold text-gray-800 dark:text-gray-200">
                    {formatDate(payroll.payment_date)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <label className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 block">
                    Payment Mode
                  </label>
                  <div className="text-base font-semibold text-gray-800 dark:text-gray-200">
                    {payroll.payment_mode || "-"}
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
                    {payroll.status === "completed" || payroll.status === "paid"
                      ? "Payslip has been sent to the employee via Email."
                      : "Upon submission, the generated payslip will be automatically sent to the employee via Email."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full overflow-x-hidden px-4 md:px-6">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (!currentPayroll) {
    return (
      <div className="w-full overflow-x-hidden px-4 md:px-6">
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <i className="fas fa-file-invoice text-6xl text-gray-300 dark:text-gray-600 mb-4 block"></i>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Payroll not found
          </h3>
          <button
            onClick={() => navigate("/admin/payroll")}
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
      <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
        <Link
          to="/admin/payroll"
          className="text-green-500 hover:text-green-600 font-medium"
        >
          Payroll
        </Link>
        <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        <span className="text-gray-500 dark:text-gray-400">View Payroll</span>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-green-600 dark:from-gray-200 dark:to-green-400 bg-clip-text text-transparent">
              <i className="fas fa-file-invoice mr-2"></i> Payroll Details
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {currentPayroll.employee_name || "Employee"} - {currentPayroll.pay_period_month} {currentPayroll.pay_period_year}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGeneratePayslip}
              disabled={actionLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <i className={`fas ${actionLoading ? "fa-spinner fa-spin" : "fa-file-pdf"}`}></i>
              {actionLoading ? "Generating..." : "Download Payslip"}
            </button>
            <Link
              to={`/admin/payroll/edit/${currentPayroll.id}`}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm"
            >
              <i className="fas fa-edit"></i> Edit
            </Link>
            <button
              onClick={() => navigate("/admin/payroll")}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm"
            >
              <i className="fas fa-arrow-left"></i> Back
            </button>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`mb-4 p-3 rounded-lg border ${
        currentPayroll.status === "completed" || currentPayroll.status === "paid"
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
          : currentPayroll.status === "pending"
          ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300"
          : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
      }`}>
        <div className="flex items-center gap-2">
          <i className={`fas ${
            currentPayroll.status === "completed" || currentPayroll.status === "paid"
              ? "fa-check-circle"
              : currentPayroll.status === "pending"
              ? "fa-clock"
              : "fa-file"
          }`}></i>
          <span className="font-semibold capitalize">
            Status: {currentPayroll.status || "Draft"}
          </span>
          <span className="text-sm opacity-75">
            {currentPayroll.status === "completed" || currentPayroll.status === "paid"
              ? `• Processed on ${formatDate(currentPayroll.updated_at)}`
              : currentPayroll.status === "pending"
              ? "• Awaiting finalization"
              : "• In progress"}
          </span>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex flex-wrap gap-2 mb-6">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeStep === step.id
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {step.id}. {step.label}
          </button>
        ))}
      </div>

      {/* Content Container */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-soft">
        {renderStepContent()}
      </div>
    </div>
  );
}

export default PayrollView;