import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import adminProfileAuthReducer from "../admin/store/slices/authSlice"
import employeeReducer from "../admin/store/slices/employeeSlice";
import notificationReducer from "../admin/store/slices/notificationSlice";
import organizationReducer from "../admin/store/slices/organizationSlice";
import companyReducer from "../admin/store/slices/companySlice";
import attendanceReducer from "../admin/store/slices/attendanceSlice";
import leaveReducer from "../admin/store/slices/LeaveSlice";
import designationReducer from "../admin/store/slices/designationSlice";
import taskReportReducer from "../admin/store/slices/taskReportSlice";
import dashboardReducer from "../admin/store/slices/dashboardSlice";
import departmentReducer from "../admin/store/slices/departmentSlice";
import documentsReducer from "../admin/store/slices/documentsSlice";
import wfhReducer from "../admin/store/slices/wfhSlice";
import onboardingReducer from "../admin/store/slices/onboardingSlice";
import roleReducer from "../admin/store/slices/roleSlice";
import settingsReducer from "../admin/store/slices/settingsSlice";
import projectReducer from "../admin/store/slices/projectSlice";
import projectAssignmentReducer from "../admin/store/slices/projectAssignmentSlice";
import payrollReducer from "../admin/store/slices/payrollSlice"
import moduleReducer from "../admin/store/slices/moduleSlice"
import adminAttendanceReducer from "../admin/store/slices/attendanceRequestSlice"
import offboardingReducer from "../admin/store/slices/offboardingSlice";
import checklistCategoryReducer from "../admin/store/slices/checklistCategorySlice";
import assetReducer from "../admin/store/slices/assetSlice";
import checklistReducer from "../admin/store/slices/checklistSlice";

// Employee reducers
import leavesReducer from "../employee/store/slices/leavesSlice";
import tasksReducer from "../employee/store/slices/tasksSlice";
import notesReducer from "../employee/store/slices/notesSlice";
import themeReducer from "../employee/store/slices/themeSlice";
import EmpWfhReducer from "../employee/store/slices/wfhSlice";
import taskReportsReducer from "../employee/store/slices/taskReportsSlice";
import EmpAttendanceReducer from "../employee/store/slices/attendanceSlice";
import EmpAttendanceTypeReducer from "../employee/store/slices/attendanceTypeSlice";
import employeeProjectReducer from "../employee/store/slices/employeeProjectSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminProfileAuth: adminProfileAuthReducer,
    employees: employeeReducer,
    notifications: notificationReducer,
    organizations: organizationReducer,
    companies: companyReducer,
    attendance: attendanceReducer,
    leaves: leaveReducer,
    designations: designationReducer,
    taskReports: taskReportReducer,
    dashboard: dashboardReducer,
    departments: departmentReducer,
    documents: documentsReducer,
    wfh: wfhReducer,
    onboarding: onboardingReducer,
    roles: roleReducer,
    settings: settingsReducer,
    projects: projectReducer,
    projectAssignments: projectAssignmentReducer,
    payroll: payrollReducer,
    modules: moduleReducer,
    adminAttendance: adminAttendanceReducer,
    offboarding: offboardingReducer,
    assets: assetReducer,
    checklist: checklistReducer,
    checklistCategory: checklistCategoryReducer,

    // Employee
    EmpLeaves: leavesReducer,
    tasks: tasksReducer,
    notes: notesReducer,
    theme: themeReducer,
    EmpWfh: EmpWfhReducer,
    EmpTaskReports: taskReportsReducer,
    EmpAttendance: EmpAttendanceReducer,
    EmpAttendanceType: EmpAttendanceTypeReducer,
    employeeProjects: employeeProjectReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});