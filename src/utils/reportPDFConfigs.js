import PDFGenerator from "./pdfGenerator";
import { formatDate, getDaysDifference } from "./reportUtils";

export const generateEmployeeDetailsPDF = (employees, filters = {}) => {
  const pdf = new PDFGenerator();
  pdf.init("landscape");

  const stats = `Total: ${employees.length} | Active: ${employees.filter(e => e.status === "Active").length} | Inactive: ${employees.filter(e => e.status === "Inactive").length}`;
  
  pdf.addHeader("Employee Details Report", "", { ...filters, stats });

  const columns = [
    "S.No", "Emp ID", "Name", "Company", "Department", "Designation",
    "Passport No", "Passport Expiry", "Visa No", "Visa Expiry",
    "Labor No", "Labor Expiry", "EID No", "EID Expiry", "Joining Date",
    "Email", "Phone", "Status"
  ];

  const data = employees.map((emp, index) => [
    index + 1,
    emp.emp_id,
    emp.name,
    emp.company_name,
    emp.department_name,
    emp.designation_name,
    emp.passport_no,
    formatDate(emp.passport_expiry),
    emp.visa_no,
    formatDate(emp.visa_expiry),
    emp.labor_no,
    formatDate(emp.labor_expiry),
    emp.eid_no,
    formatDate(emp.eid_expiry),
    formatDate(emp.joining_date),
    emp.email,
    emp.phone,
    emp.status,
  ]);

  pdf.addTable(columns, data, 55);
  pdf.addFooter();
  pdf.save(`employee_details_${new Date().toISOString().split("T")[0]}.pdf`);
};

export const generateAttendancePDF = (records, filters = {}) => {
  const pdf = new PDFGenerator();
  pdf.init("landscape");

  const totalPresent = records.filter(r => r.status !== "Absent" && !r.lateBy).length;
  const totalLate = records.filter(r => r.lateBy && r.lateBy > 0).length;
  const totalAbsent = records.filter(r => r.status === "Absent").length;
  const stats = `Total: ${records.length} | Present: ${totalPresent} | Late: ${totalLate} | Absent: ${totalAbsent}`;
  
  pdf.addHeader("Attendance Report", `Period: ${filters.start_date} to ${filters.end_date}`, { ...filters, stats });

  const columns = ["S.No", "Date", "Employee", "Department", "Punch In", "Punch Out", "Duration", "Status", "Late By"];

  const data = records.map((record, index) => [
    index + 1,
    record.date,
    record.employeeName || record.name,
    record.department,
    record.punchIn || record.punch_in,
    record.punchOut || record.punch_out || "Not Punched Out",
    record.duration,
    record.lateBy ? "Late" : (record.status === "Absent" ? "Absent" : "Present"),
    record.lateBy ? `${record.lateBy} min` : "-",
  ]);

  pdf.addTable(columns, data, 55);
  pdf.addFooter();
  pdf.save(`attendance_report_${filters.start_date}_to_${filters.end_date}.pdf`);
};

export const generateLeavesPDF = (leaves, filters = {}) => {
  const pdf = new PDFGenerator();
  pdf.init("landscape");

  const pending = leaves.filter(l => l.status === "Pending").length;
  const approved = leaves.filter(l => l.status === "Approved").length;
  const rejected = leaves.filter(l => l.status === "Rejected").length;
  const stats = `Total: ${leaves.length} | Pending: ${pending} | Approved: ${approved} | Rejected: ${rejected}`;
  
  pdf.addHeader("Leave Requests Report", "", { ...filters, stats });

  const columns = ["S.No", "Request Date", "Employee", "Leave Type", "From", "To", "Days", "Status"];

  const data = leaves.map((leave, index) => [
    index + 1,
    formatDate(leave.created_at || leave.request_date),
    leave.employee_name || leave.employee?.name || "-",
    leave.leave_type?.name || leave.type,
    formatDate(leave.from_date || leave.fromDate),
    formatDate(leave.to_date || leave.toDate),
    leave.number_of_days || leave.days,
    leave.status,
  ]);

  pdf.addTable(columns, data, 55);
  pdf.addFooter();
  pdf.save(`leave_requests_${new Date().toISOString().split("T")[0]}.pdf`);
};

export const generateEmployeeExpiryPDF = (employees, title, filters = {}) => {
  const pdf = new PDFGenerator();
  pdf.init("landscape");

  const expiring7 = employees.filter(e => e.daysLeft <= 7).length;
  const expiring15 = employees.filter(e => e.daysLeft > 7 && e.daysLeft <= 15).length;
  const expiring30 = employees.filter(e => e.daysLeft > 15 && e.daysLeft <= 30).length;
  const stats = `Total: ${employees.length} | 7 days: ${expiring7} | 15 days: ${expiring15} | 30 days: ${expiring30}`;
  
  pdf.addHeader(title, `Expiry period: ${filters.expiryDays || 30} days`, { ...filters, stats });

  const columns = ["S.No", "Emp ID", "Name", "Company", "Department", "Passport Expiry", "Visa Expiry", "Labor Expiry", "EID Expiry", "Days Left"];

  const data = employees.map((emp, index) => [
    index + 1,
    emp.emp_id,
    emp.name,
    emp.company_name,
    emp.department_name,
    formatDate(emp.passport_expiry),
    formatDate(emp.visa_expiry),
    formatDate(emp.labor_expiry),
    formatDate(emp.eid_expiry),
    emp.daysLeft ? `${emp.daysLeft} days` : "-",
  ]);

  pdf.addTable(columns, data, 55);
  pdf.addFooter();
  pdf.save(`${title.toLowerCase().replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
};

export const generateCompanyExpiryPDF = (companies, title, filters = {}) => {
  const pdf = new PDFGenerator();
  pdf.init("landscape");

  const stats = `Total companies with expiring documents: ${companies.length}`;
  
  pdf.addHeader(title, `Expiry period: ${filters.expiryDays || 30} days`, { ...filters, stats });

  const columns = ["S.No", "Company Name", "Trade License", "TL Expiry", "Days Left (TL)", "Est. Card", "EC Expiry", "Days Left (EC)"];

  const data = companies.map((company, index) => [
    index + 1,
    company.name,
    company.trade_license_number || "-",
    formatDate(company.trade_license_expiry),
    getDaysDifference(company.trade_license_expiry) || "-",
    company.establishment_card_number || "-",
    formatDate(company.establishment_card_expiry),
    getDaysDifference(company.establishment_card_expiry) || "-",
  ]);

  pdf.addTable(columns, data, 55);
  pdf.addFooter();
  pdf.save(`${title.toLowerCase().replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
};

export const generateCompanyUpcomingRenewalsPDF = (companies, title, filters = {}) => {
  const pdf = new PDFGenerator();
  pdf.init("landscape");

  const stats = `Total companies with upcoming renewals: ${companies.length} | Period: ${filters.minDays || 31}-${filters.maxDays || 90} days`;
  
  // Create filter summary text
  let filterText = `Renewal period: ${filters.minDays || 31} to ${filters.maxDays || 90} days from today`;
  if (filters.search) {
    filterText += ` | Search: "${filters.search}"`;
  }
  
  pdf.addHeader(title, filterText, { ...filters, stats });

  const columns = [
    "S.No", 
    "Company Name", 
    "Trade License", 
    "TL Expiry", 
    "Days Left (TL)", 
    "Est. Card", 
    "EC Expiry", 
    "Days Left (EC)"
  ];

  const data = companies.map((company, index) => {
    const tlDays = getDaysDifference(company.trade_license_expiry);
    const ecDays = getDaysDifference(company.establishment_card_expiry);
    
    return [
      index + 1,
      company.name,
      company.trade_license_number || "-",
      formatDate(company.trade_license_expiry),
      tlDays !== null && tlDays >= (filters.minDays || 31) && tlDays <= (filters.maxDays || 90) ? `${tlDays} days` : "-",
      company.establishment_card_number || "-",
      formatDate(company.establishment_card_expiry),
      ecDays !== null && ecDays >= (filters.minDays || 31) && ecDays <= (filters.maxDays || 90) ? `${ecDays} days` : "-",
    ];
  });

  pdf.addTable(columns, data, 55);
  pdf.addFooter();
  pdf.save(`${title.toLowerCase().replace(/ /g, "_")}_${filters.minDays || 31}_${filters.maxDays || 90}days_${new Date().toISOString().split("T")[0]}.pdf`);
};

export const generateEmployeeUpcomingRenewalsPDF = (employees, title, filters = {}) => {
  const pdf = new PDFGenerator();
  pdf.init("landscape");

  // Calculate statistics
  const totalEmployees = employees.length;
  const renewing31to45 = employees.filter(emp => {
    const earliest = getEarliestUpcomingExpiryForEmployee(emp, filters.minDays || 31, filters.maxDays || 90);
    return earliest && earliest.days >= 31 && earliest.days <= 45;
  }).length;
  const renewing46to60 = employees.filter(emp => {
    const earliest = getEarliestUpcomingExpiryForEmployee(emp, filters.minDays || 31, filters.maxDays || 90);
    return earliest && earliest.days >= 46 && earliest.days <= 60;
  }).length;
  const renewing61to90 = employees.filter(emp => {
    const earliest = getEarliestUpcomingExpiryForEmployee(emp, filters.minDays || 31, filters.maxDays || 90);
    return earliest && earliest.days >= 61 && earliest.days <= 90;
  }).length;

  const stats = `Total: ${totalEmployees} | 31-45 days: ${renewing31to45} | 46-60 days: ${renewing46to60} | 61-90 days: ${renewing61to90}`;
  
  // Create filter summary text
  let filterText = `Renewal period: ${filters.minDays || 31} to ${filters.maxDays || 90} days from today`;
  if (filters.company && filters.company !== "all") filterText += ` | Company: ${filters.company}`;
  if (filters.department && filters.department !== "all") filterText += ` | Department: ${filters.department}`;
  if (filters.search) filterText += ` | Search: "${filters.search}"`;
  
  pdf.addHeader(title, filterText, { ...filters, stats });

  const columns = [
    "S.No", "Emp ID", "Name", "Company", "Department",
    "Passport Expiry", "Visa Expiry", "Labor Expiry", "EID Expiry", "Days Left (Earliest)"
  ];

  const data = employees.map((emp, index) => {
    // Find earliest upcoming expiry
    const minDays = filters.minDays || 31;
    const maxDays = filters.maxDays || 90;
    
    const expiryItems = [
      { date: emp.passport_expiry, name: "Passport", key: "passport" },
      { date: emp.visa_expiry, name: "Visa", key: "visa" },
      { date: emp.labor_expiry, name: "Labor", key: "labor" },
      { date: emp.eid_expiry, name: "EID", key: "eid" },
    ].map(item => ({
      ...item,
      days: getDaysDifference(item.date)
    })).filter(
      item => item.days !== null && item.days >= minDays && item.days <= maxDays
    );

    const earliest = expiryItems.length > 0 ? 
      expiryItems.reduce((min, item) => item.days < min.days ? item : min, expiryItems[0]) : 
      null;

    // Get the earliest days left display
    let daysLeftDisplay = "-";
    if (earliest) {
      let bgColor = "";
      if (earliest.days >= 31 && earliest.days <= 45) bgColor = "blue";
      else if (earliest.days >= 46 && earliest.days <= 60) bgColor = "cyan";
      // eslint-disable-next-line no-unused-vars
      else if (earliest.days >= 61 && earliest.days <= 90) bgColor = "green";
      daysLeftDisplay = `${earliest.days} days (${earliest.name})`;
    }

    return [
      index + 1,
      emp.emp_id || "-",
      emp.name || "-",
      emp.company_name || "-",
      emp.department_name || "-",
      formatDate(emp.passport_expiry),
      formatDate(emp.visa_expiry),
      formatDate(emp.labor_expiry),
      formatDate(emp.eid_expiry),
      daysLeftDisplay,
    ];
  });

  pdf.addTable(columns, data, 55);
  pdf.addFooter();
  pdf.save(`${title.toLowerCase().replace(/ /g, "_")}_${filters.minDays || 31}_${filters.maxDays || 90}days_${new Date().toISOString().split("T")[0]}.pdf`);
};

// Helper function to get earliest upcoming expiry for an employee
const getEarliestUpcomingExpiryForEmployee = (employee, minDays, maxDays) => {
  const expiryItems = [
    { date: employee.passport_expiry, name: "Passport" },
    { date: employee.visa_expiry, name: "Visa" },
    { date: employee.labor_expiry, name: "Labor" },
    { date: employee.eid_expiry, name: "EID" },
  ].map(item => ({
    ...item,
    days: getDaysDifference(item.date)
  })).filter(
    item => item.days !== null && item.days >= minDays && item.days <= maxDays
  );

  if (expiryItems.length === 0) return null;
  return expiryItems.reduce((min, item) => item.days < min.days ? item : min, expiryItems[0]);
};