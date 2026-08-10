// src/pages/Payroll.jsx (or wherever your main payroll route is)
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import PayrollCalendar from "../components/payroll/PayrollCalender";
import PayrollList from "../components/payroll/PayrollList";

const Payroll = () => {
  const { user } = useSelector((state) => state.auth || {});
  const isAdmin = user?.type === "admin" || user?.role?.name === "admin" || user?.role?.name === "Admin";
  const basePath = isAdmin ? "/admin" : "/employee";

  return (
    <div className="w-full overflow-x-hidden px-4 md:px-6">
      <Routes>
        <Route path="/" element={<Navigate to="calendar" replace />} />
        <Route path="calendar" element={<PayrollCalendar />} />
        <Route path="list/:year?/:month?" element={<PayrollList />} />
        <Route path="list" element={<PayrollList />} />
      </Routes>
    </div>
  );
};

export default Payroll;