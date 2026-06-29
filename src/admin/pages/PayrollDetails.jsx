// src/admin/pages/PayrollView.js - Updated with dynamic path

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
  sendPayslip,
} from "../store/slices/payrollSlice";

import {
  fetchEmployeeById,
  resetCurrentEmployee,
} from "../store/slices/employeeSlice";

import { fetchEmployees } from "../store/slices/employeeSlice";

function PayrollView() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  // Get user from Redux to determine base path
  const { user } = useSelector((state) => state.auth || {});
  const isAdmin =
    user?.type === "admin" ||
    user?.role?.name === "admin" ||
    user?.role?.name === "Admin";
  const basePath = isAdmin ? "/admin" : "/employee";

  // Redux state
  const currentPayroll = useSelector(selectCurrentPayroll);
  const isLoading = useSelector(selectPayrollLoading);
  const actionLoading = useSelector(selectPayrollActionLoading);
  const error = useSelector(selectPayrollError);
  const successMessage = useSelector(selectPayrollSuccess);

  // Employee state
  const {
    employees,
    currentEmployee,
    loading: employeesLoading,
  } = useSelector((state) => state.employees);

  // Local state
  const [activeTab, setActiveTab] = useState("basic");
  const [employeeDetails, setEmployeeDetails] = useState(null);

  const tabs = [
    { id: "basic", label: "Basic Info", icon: "fa-user" },
    { id: "country", label: "Country Split", icon: "fa-globe" },
    { id: "overtime", label: "Overtime", icon: "fa-clock" },
    { id: "deductions", label: "Deductions", icon: "fa-minus-circle" },
    { id: "summary", label: "Summary", icon: "fa-clipboard-check" },
  ];

  // Fetch payroll data on mount
  useEffect(() => {
    if (id) {
      dispatch(fetchPayrollById(id));
    }
    return () => {
      dispatch(resetCurrentEmployee());
    };
  }, [dispatch, id]);

  // Fetch employees list to find employee by user_id
  useEffect(() => {
    if (!employees || employees.length === 0) {
      dispatch(fetchEmployees());
    }
  }, [dispatch, employees]);

  // Find employee by user_id from the employees list
  useEffect(() => {
    if (currentPayroll?.employee_id && employees && employees.length > 0) {
      const foundEmployee = employees.find(
        (emp) =>
          emp.user_id === parseInt(currentPayroll.employee_id) ||
          emp.id === parseInt(currentPayroll.employee_id),
      );

      if (foundEmployee) {
        dispatch(fetchEmployeeById(foundEmployee.id))
          .unwrap()
          .then((data) => {
            setEmployeeDetails(data);
          })
          .catch(() => {
            setEmployeeDetails(null);
          });
      } else {
        dispatch(fetchEmployeeById(currentPayroll.employee_id))
          .unwrap()
          .then((data) => {
            setEmployeeDetails(data);
          })
          .catch(() => {
            setEmployeeDetails(null);
          });
      }
    }
  }, [currentPayroll, employees, dispatch]);

  // Also try to fetch using currentEmployee from Redux if available
  useEffect(() => {
    if (currentEmployee && !employeeDetails) {
      setEmployeeDetails(currentEmployee);
    }
  }, [currentEmployee, employeeDetails]);

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

  // Handle send payslip email
  const handleSendPayslip = async () => {
    if (!id) return;
    try {
      const result = await dispatch(sendPayslip(id)).unwrap();
      showToast(result.message || "Payslip sent successfully!", "success");
    } catch (error) {
      showToast(error || "Failed to send payslip", "error");
    }
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

  // Get month name from month number
  const getMonthName = (monthNumber) => {
    const months = [
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
    return months[monthNumber - 1] || monthNumber;
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const statusMap = {
      paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      pending:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      draft: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      completed:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    };
    return statusMap[status?.toLowerCase()] || statusMap.draft;
  };

  // Handle payslip generation
  const handleGeneratePayslip = async () => {
    if (!id) return;
    try {
      await dispatch(generatePayslip(id)).unwrap();
      generatePayslipPDF();
    } catch (error) {
      // Error handled by slice
    }
  };

  // Generate payslip PDF preview
  const generatePayslipPDF = () => {
    const doc = new jsPDF();
    const payroll = currentPayroll;
    const stepData = payroll?.step_data || {};

    doc.setFontSize(20);
    doc.text("Employee Payslip", 14, 22);

    doc.setFontSize(12);
    const empName =
      payroll?.employee_name || employeeDetails?.name || "Unknown Employee";
    const empId = payroll?.employee_id || employeeDetails?.employee_id || "-";
    const orgName =
      employeeDetails?.organization?.name ||
      employeeDetails?.user?.organization?.name ||
      "-";

    doc.text(`Employee: ${empName} (${empId})`, 14, 32);
    doc.text(`Organization: ${orgName}`, 14, 38);
    doc.text(
      `Pay Period: ${getMonthName(payroll?.month || 6)} ${payroll?.year || 2026}`,
      14,
      44,
    );
    doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 14, 50);
    doc.text(`Status: ${payroll?.status || "Draft"}`, 14, 56);

    // Country split from step_2
    if (stepData.step_2?.location_breakdown) {
      autoTable(doc, {
        startY: 62,
        head: [
          [
            "Package / Location",
            "Days Logged",
            "Salary Components",
            "Subtotal",
          ],
        ],
        body: stepData.step_2.location_breakdown.map((loc) => [
          loc.location_name || "-",
          loc.worked_days || 0,
          loc.salary_components
            ?.map((c) => `${c.name}: ${c.amount}`)
            .join(", ") || "-",
          formatCurrency(loc.subtotal || 0, loc.currency?.code || "INR"),
        ]),
        theme: "grid",
        headStyles: { fillColor: [34, 197, 94] },
      });
    }

    // Overtime from step_3
    if (stepData.step_3?.overtime_details) {
      autoTable(doc, {
        startY: doc.lastAutoTable?.finalY + 10 || 100,
        head: [["Date", "Overtime Hours", "Amount", "Status"]],
        body: stepData.step_3.overtime_details.map((ot) => [
          formatDate(ot.date),
          ot.overtime_hours || 0,
          formatCurrency(
            ot.amount || 0,
            ot.currency || payroll?.target_currency || "INR",
          ),
          ot.status || "pending",
        ]),
        theme: "grid",
        headStyles: { fillColor: [34, 197, 94] },
      });
    }

    // Deductions from step_4
    if (stepData.step_4?.deductions) {
      autoTable(doc, {
        startY: doc.lastAutoTable?.finalY + 10 || 100,
        head: [["Deduction Type", "Currency", "Amount"]],
        body: stepData.step_4.deductions.map((d) => [
          d.type || "-",
          d.currency || "-",
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
      body: [
        [
          formatCurrency(
            payroll?.net_pay || stepData.step_2?.total_earnings || 0,
          ),
          formatCurrency(stepData.step_4?.total_deductions || 0),
          formatCurrency(payroll?.net_pay || 0),
        ],
      ],
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94] },
    });

    const fileName = `Payslip_${empName.replace(/\s/g, "_")}_${empId}.pdf`;
    doc.save(fileName);
    showToast("Payslip downloaded successfully!", "success");
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    const payroll = currentPayroll;
    if (!payroll) return null;

    const stepData = payroll.step_data || {};
    const empName = payroll.employee_name || employeeDetails?.name || "-";
    const empId = payroll.employee_id || employeeDetails?.employee_id || "-";
    const orgName =
      employeeDetails?.organization?.name ||
      employeeDetails?.user?.organization?.name ||
      "-";
    const deptName =
      employeeDetails?.department?.name ||
      employeeDetails?.user?.department?.name ||
      "-";
    const desigName =
      employeeDetails?.designation?.name ||
      employeeDetails?.user?.designation?.name ||
      "-";
    const empType =
      employeeDetails?.employment_type || employeeDetails?.user?.type || "-";

    switch (activeTab) {
      case "basic":
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
                    {empId}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Employee Name
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {empName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Organization
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {orgName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {deptName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Designation
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {desigName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Employment Type
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200 capitalize">
                    {empType}
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
                    {getMonthName(payroll.month || 6)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Pay Period Year
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-200">
                    {payroll.year || 2026}
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
                    Status
                  </label>
                  <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(payroll.status)}`}
                    >
                      {payroll.status
                        ? payroll.status.charAt(0).toUpperCase() +
                          payroll.status.slice(1)
                        : "Draft"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "country":
        const locationBreakdown = stepData.step_2?.location_breakdown || [];
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

            {locationBreakdown.length > 0 ? (
              <div className="space-y-4">
                {locationBreakdown.map((loc, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                  >
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                          {loc.location_name || "Location"}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Package: {loc.package?.name || "-"} (
                          {loc.package?.currency || "-"})
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(
                            loc.subtotal || 0,
                            loc.currency?.code || "INR",
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {loc.worked_days || 0} days worked
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-semibold">
                                Component
                              </th>
                              <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-semibold">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {loc.salary_components?.map((comp, idx) => (
                              <tr
                                key={idx}
                                className="border-b border-gray-100 dark:border-gray-700/50"
                              >
                                <td className="py-2 px-3 text-gray-800 dark:text-gray-200">
                                  {comp.name}
                                </td>
                                <td className="py-2 px-3 text-right text-gray-800 dark:text-gray-200">
                                  {formatCurrency(
                                    comp.amount,
                                    loc.currency?.code || "INR",
                                  )}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-50 dark:bg-gray-700/30 font-bold">
                              <td className="py-2 px-3 text-gray-800 dark:text-gray-200">
                                Subtotal
                              </td>
                              <td className="py-2 px-3 text-right text-green-600 dark:text-green-400">
                                {formatCurrency(
                                  loc.subtotal || 0,
                                  loc.currency?.code || "INR",
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                      Total Earnings
                    </div>
                    <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(stepData.step_2?.total_earnings || 0)}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                      Gross Salary
                    </div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(stepData.step_2?.gross_salary || 0)}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                      Total Worked Days
                    </div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {stepData.step_2?.total_worked_days || 0} days
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                      Net Salary
                    </div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(
                        stepData.step_2?.net_salary || payroll.net_pay || 0,
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="fas fa-globe text-4xl mb-3 block"></i>
                No country split data available
              </div>
            )}
          </div>
        );

      case "overtime":
        const overtimeDetails = stepData.step_3?.overtime_details || [];
        return (
          <div>
            <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-green-600 dark:text-green-400 text-sm"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Overtime Details
              </h3>
              {stepData.step_3?.total_overtime_amount !== undefined && (
                <span className="ml-auto text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Total:{" "}
                  {formatCurrency(
                    stepData.step_3.total_overtime_amount || 0,
                    currentPayroll?.target_currency || "INR",
                  )}
                </span>
              )}
            </div>

            {overtimeDetails.length > 0 ? (
              <div className="space-y-3">
                {overtimeDetails.map((ot, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/30"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                          Date
                        </label>
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {formatDate(ot.date)}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                          Overtime Hours
                        </label>
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {ot.overtime_hours || 0} hrs
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                          Amount
                        </label>
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(
                            ot.amount || 0,
                            ot.currency ||
                              currentPayroll?.target_currency ||
                              "INR",
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block">
                          Status
                        </label>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            ot.status === "pending"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : ot.status === "approved"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          {ot.status || "pending"}
                        </span>
                      </div>
                    </div>
                    {ot.projects && ot.projects.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-2">
                          Projects
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {ot.projects.map((project, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs border border-blue-200 dark:border-blue-800"
                            >
                              {project.project_name} (
                              {project.time_taken_hours || 0}h)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <i className="fas fa-clock text-4xl mb-3 block"></i>
                No overtime data available
              </div>
            )}
          </div>
        );

      case "deductions":
        const deductions = stepData.step_4?.deductions || [];
        return (
          <div>
            <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <i className="fas fa-minus-circle text-green-600 dark:text-green-400 text-sm"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Deductions
              </h3>
              {stepData.step_4?.total_deductions !== undefined && (
                <span className="ml-auto text-sm font-semibold text-red-600 dark:text-red-400">
                  Total: {formatCurrency(stepData.step_4.total_deductions || 0)}
                </span>
              )}
            </div>

            {deductions.length > 0 ? (
              <div className="space-y-3">
                {deductions.map((d, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="md:col-span-4">
                      <label className="text-xs text-gray-500 dark:text-gray-400 block">
                        Type
                      </label>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {d.type || "-"}
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-500 dark:text-gray-400 block">
                        Currency
                      </label>
                      <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {d.currency || "-"}
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-500 dark:text-gray-400 block">
                        Amount
                      </label>
                      <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(d.amount, d.currency || "INR")}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400 block">
                        Statutory
                      </label>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          d.is_statutory === "yes"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {d.is_statutory === "yes" ? "Yes" : "No"}
                      </span>
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
          </div>
        );

      case "summary":
  const conversions = stepData.step_5?.summary?.conversions;
  const targetCurrency = stepData.step_5?.target_currency || "INR";
  
  return (
    <div>
      <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4">
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
          <i className="fas fa-clipboard-check text-green-600 dark:text-green-400 text-sm"></i>
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
          Payroll Summary
        </h3>
        {targetCurrency && (
          <span className="ml-auto text-sm font-semibold text-blue-600 dark:text-blue-400">
            Target: {targetCurrency}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* Summary Cards with Mixed Currency Support */}
        {conversions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gross Salary */}
            {conversions.gross_salary && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                  Gross Salary
                </div>
                
                {/* Original Mixed Currency Breakdown */}
                <div className="mb-3">
                  <div className="text-[10px] text-gray-500 mb-1">Original (Mixed Currencies):</div>
                  {conversions.gross_salary.currencyBreakdown?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{item.currency}:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {item.currency} {item.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {!conversions.gross_salary.currencyBreakdown && conversions.gross_salary.breakdown && (
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {conversions.gross_salary.breakdown}
                    </div>
                  )}
                </div>
                
                {/* Conversion Display */}
                <div className="flex justify-between items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                  <div className="flex-1">
                    <div className="text-[10px] text-gray-500">Original (Mixed)</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {conversions.gross_salary.breakdown || 'Multiple currencies'}
                    </div>
                  </div>
                  <div className="text-center px-1">
                    <div className="text-[9px] text-gray-400">Converted</div>
                    <i className="fas fa-arrow-right text-blue-400 my-1"></i>
                  </div>
                  <div className="text-right flex-1">
                    <div className="text-[10px] text-blue-500">Converted</div>
                    <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                      {conversions.gross_salary.toCurrency || targetCurrency}{" "}
                      {conversions.gross_salary.convertedAmount?.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      ) || '0.00'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Overtime Amount */}
            {conversions.overtime_amount && (
              <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                  Overtime Amount
                </div>
                
                {/* Original Mixed Currency Breakdown */}
                <div className="mb-3">
                  <div className="text-[10px] text-gray-500 mb-1">Original (Mixed Currencies):</div>
                  {conversions.overtime_amount.currencyBreakdown?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{item.currency}:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {item.currency} {item.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {!conversions.overtime_amount.currencyBreakdown && conversions.overtime_amount.breakdown && (
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {conversions.overtime_amount.breakdown}
                    </div>
                  )}
                  {(!conversions.overtime_amount.currencyBreakdown || conversions.overtime_amount.currencyBreakdown.length === 0) && 
                   !conversions.overtime_amount.breakdown && (
                    <div className="text-sm text-gray-400">No overtime entries</div>
                  )}
                </div>
                
                {/* Conversion Display */}
                {conversions.overtime_amount.currencyBreakdown?.length > 0 && (
                  <div className="flex justify-between items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-500">Original (Mixed)</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {conversions.overtime_amount.breakdown || 'Multiple currencies'}
                      </div>
                    </div>
                    <div className="text-center px-1">
                      <div className="text-[9px] text-gray-400">Converted</div>
                      <i className="fas fa-arrow-right text-orange-400 my-1"></i>
                    </div>
                    <div className="text-right flex-1">
                      <div className="text-[10px] text-orange-500">Converted</div>
                      <div className="text-base font-bold text-orange-600 dark:text-orange-400">
                        {conversions.overtime_amount.toCurrency || targetCurrency}{" "}
                        {conversions.overtime_amount.convertedAmount?.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        ) || '0.00'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Deductions */}
            {conversions.deductions && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                  Deductions
                </div>
                
                {/* Original Mixed Currency Breakdown */}
                <div className="mb-3">
                  <div className="text-[10px] text-gray-500 mb-1">Original (Mixed Currencies):</div>
                  {conversions.deductions.currencyBreakdown?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{item.currency}:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {item.currency} {item.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {!conversions.deductions.currencyBreakdown && conversions.deductions.breakdown && (
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {conversions.deductions.breakdown}
                    </div>
                  )}
                  {(!conversions.deductions.currencyBreakdown || conversions.deductions.currencyBreakdown.length === 0) && 
                   !conversions.deductions.breakdown && (
                    <div className="text-sm text-gray-400">No deductions</div>
                  )}
                </div>
                
                {/* Conversion Display */}
                {conversions.deductions.currencyBreakdown?.length > 0 && (
                  <div className="flex justify-between items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-500">Original (Mixed)</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {conversions.deductions.breakdown || 'Multiple currencies'}
                      </div>
                    </div>
                    <div className="text-center px-1">
                      <div className="text-[9px] text-gray-400">Converted</div>
                      <i className="fas fa-arrow-right text-red-400 my-1"></i>
                    </div>
                    <div className="text-right flex-1">
                      <div className="text-[10px] text-red-500">Converted</div>
                      <div className="text-base font-bold text-red-500">
                        {conversions.deductions.toCurrency || targetCurrency}{" "}
                        {conversions.deductions.convertedAmount?.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        ) || '0.00'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Net Pay */}
            {conversions.net_pay && (
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                  Net Pay
                </div>
                
                {/* Original Mixed Currency Breakdown */}
                <div className="mb-3">
                  <div className="text-[10px] text-gray-500 mb-1">Original (Mixed Currencies):</div>
                  {conversions.net_pay.currencyBreakdown?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{item.currency}:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {item.currency} {item.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {!conversions.net_pay.currencyBreakdown && conversions.net_pay.breakdown && (
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {conversions.net_pay.breakdown}
                    </div>
                  )}
                </div>
                
                {/* Conversion Display */}
                <div className="flex justify-between items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                  <div className="flex-1">
                    <div className="text-[10px] text-gray-500">Original (Mixed)</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {conversions.net_pay.breakdown || 'Multiple currencies'}
                    </div>
                  </div>
                  <div className="text-center px-1">
                    <div className="text-[9px] text-gray-400">Converted</div>
                    <i className="fas fa-arrow-right text-green-400 my-1"></i>
                  </div>
                  <div className="text-right flex-1">
                    <div className="text-[10px] text-green-500">Converted</div>
                    <div className="text-base font-bold text-green-600 dark:text-green-400">
                      {conversions.net_pay.toCurrency || targetCurrency}{" "}
                      {conversions.net_pay.convertedAmount?.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      ) || '0.00'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Fallback when no conversion data exists
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">
                Gross Earnings
              </div>
              <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {formatCurrency(
                  stepData.step_2?.total_earnings || payroll.net_pay || 0,
                )}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">
                Total Deductions
              </div>
              <div className="text-xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(stepData.step_4?.total_deductions || 0)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                Conversion Rate
              </div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {stepData.conversion_rate || 1} (
                {stepData.conversion_from || "AED"} →{" "}
                {stepData.currency || "INR"})
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
        )}

        {/* Currency Conversion Info */}
        {stepData.step_5?.target_currency && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <i className="fas fa-exchange-alt text-blue-500"></i>
              <div>
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  Currency Conversion
                </h4>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                  Converted from mixed currencies to {stepData.step_5.target_currency}
                </p>
                {stepData.step_5.conversion_rates && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(stepData.step_5.conversion_rates).map(([currency, rate]) => (
                      <span key={currency} className="text-[10px] bg-blue-100 dark:bg-blue-800/50 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300">
                        {currency} → {stepData.step_5.target_currency}: {rate}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
            onClick={() => navigate(`${basePath}/payroll`)}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Back to Payroll
          </button>
        </div>
      </div>
    );
  }

  const monthDisplay = getMonthName(currentPayroll.month || 6);
  const yearDisplay = currentPayroll.year || 2026;

  return (
    <div className="w-full overflow-x-hidden px-4 md:px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
        <Link
          to={`${basePath}/payroll`}
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
              {currentPayroll.employee_name ||
                employeeDetails?.name ||
                "Employee"}{" "}
              - {monthDisplay} {yearDisplay}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSendPayslip}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <i
                className={`fas ${actionLoading ? "fa-spinner fa-spin" : "fa-paper-plane"}`}
              ></i>
              {actionLoading ? "Sending..." : "Send Payslip"}
            </button>
            <Link
              to={`${basePath}/payroll/edit/${currentPayroll.id}`}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm"
            >
              <i className="fas fa-edit"></i> Edit
            </Link>
            <button
              onClick={() => navigate(`${basePath}/payroll`)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm"
            >
              <i className="fas fa-arrow-left"></i> Back
            </button>
          </div>
        </div>
      </div>

      {/* Status Banner */}
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
            Status:{" "}
            {currentPayroll.status
              ? currentPayroll.status.charAt(0).toUpperCase() +
                currentPayroll.status.slice(1)
              : "Draft"}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mb-6 overflow-x-auto">
        <div className="flex min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 flex items-center gap-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "text-green-600 border-b-2 border-green-600 bg-gray-50 dark:bg-gray-700/50"
                  : "text-gray-600 dark:text-gray-400 hover:text-green-600 hover:bg-gray-50 dark:hover:bg-gray-700/30"
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 shadow-soft">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default PayrollView;
