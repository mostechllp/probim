import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import employeeReducer from "./slices/employeeSlice"
import notificationReducer from "./slices/notificationSlice"
import organizationReducer from "./slices/organizationSlice"
import companyReducer from "./slices/companySlice";
import attendanceReducer from "./slices/attendanceSlice"
import leaveReducer from "./slices/LeaveSlice"
import designationReducer from "./slices/designationSlice"
import taskReportReducer from './slices/taskReportSlice';
import dashboardReducer from "./slices/dashboardSlice";
import departmentReducer from "./slices/departmentSlice"
import documentsReducer from "./slices/documentsSlice"
import wfhReducer from "./slices/wfhSlice"
import reportsReducer from "./slices/reportSlice"
import onboardingReducer from "./slices/onboardingSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
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
        reports: reportsReducer,
        onboarding: onboardingReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        })
})
