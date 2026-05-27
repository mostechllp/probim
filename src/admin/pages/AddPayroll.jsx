import { useState } from "react";
import { Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
function AddPayroll() {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, label: "Basic Info" },
    { id: 2, label: "Salary Structure" },
    { id: 3, label: "Country Split" },
    { id: 4, label: "Overtime" },
    { id: 5, label: "Deductions" },
    { id: 6, label: "Summary" },
  ];

  // eslint-disable-next-line no-unused-vars
  const [countries, setCountries] = useState([
    { id: 1, name: "UAE", currency: "AED", dailyRate: "600", daysWorked: "10", fxRate: "22.5" },
    { id: 2, name: "India", currency: "INR", dailyRate: "2000", daysWorked: "20", fxRate: "1" }
  ]);

  const [overtimeRequests, setOvertimeRequests] = useState([
    {
      id: 1,
      project: "Dubai Mall Expansion",
      date: "2026-05-20",
      hours: 4,
      status: "pending",
      reason: "Client requested emergency revisions"
    },
    {
      id: 2,
      project: "Airport Terminal 3",
      date: "2026-05-21",
      hours: 2.5,
      status: "pending",
      reason: "Project deadline approaching"
    }
  ]);

  const handleOvertimeAction = (id, newStatus) => {
    setOvertimeRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
  };

  // eslint-disable-next-line no-unused-vars
  const [deductions, setDeductions] = useState([
    { id: 1, type: "PF (Employee 12%)", country: "India", amount: "6000", statutory: "Yes" },
    { id: 2, type: "Professional Tax", country: "India", amount: "200", statutory: "Yes" },
    { id: 3, type: "TDS / Income Tax", country: "India", amount: "4500", statutory: "Yes" },
    { id: 4, type: "Gratuity (UAE 8.33%)", country: "UAE", amount: "1125", statutory: "Yes" }
  ]);

  const generatePayslipPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text("Employee Payslip", 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Employee: Ahmed Al Mansoori (EMP-0042)`, 14, 32);
    doc.text(`Pay Period: May 2026`, 14, 38);
    doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 14, 44);

    // Salary Structure
    autoTable(doc, {
      startY: 50,
      head: [['Salary Component', 'Amount (INR)']],
      body: [
        ['Basic Salary', '50,000'],
        ['HRA', '20,000'],
        ['Conveyance', '1,600'],
        ['Special Allowance', '5,150'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }
    });

    // Multi-Location Packages
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Package / Location', 'Days Logged', 'Daily Rate', 'Amount (INR)']],
      body: [
        ['Package 2 - Dubai Onsite', '10', 'AED 600', '1,35,000'],
        ['Package 1 - Home Country (WFH)', '20', 'INR 2000', '40,000'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }
    });

    // Overtime
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Overtime Project', 'Date', 'Hours', 'Status']],
      body: overtimeRequests.map(req => [req.project, req.date, req.hours.toString(), req.status]),
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }
    });

    // Deductions
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Deduction Type', 'Country', 'Amount (INR)']],
      body: deductions.map(d => [d.type, d.country, d.amount.toString()]),
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] }
    });

    // Summary
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Gross Earnings', 'Total Deductions', 'Net Pay']],
      body: [['INR 1,75,000', 'INR 11,825', 'INR 1,63,175']],
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }
    });

    // Save PDF
    doc.save("Payslip_Ahmed_Al_Mansoori.pdf");
    toast.success("Payslip generated and sent via email!");
  };

  return (
    <div className="w-full overflow-x-hidden px-4 md:px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-6 flex-wrap">
        <Link
          to="/admin/payroll"
          className="text-green-500 hover:text-green-600 font-medium"
        >
          Payroll
        </Link>
        <i className="fas fa-chevron-right text-gray-400 text-[10px] md:text-xs"></i>
        <span className="text-gray-500 dark:text-gray-400">Add Payroll</span>
      </div>

      {/* Page Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-green-600 dark:from-gray-200 dark:to-green-400 bg-clip-text text-transparent">
          <i className="fas fa-plus-circle mr-2"></i> Add New Payroll
        </h2>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure employee salary, country-wise work splits, and deductions
        </p>
      </div>

      {/* Stepper */}
      <div className="flex flex-wrap gap-2 mb-6">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
              currentStep === step.id
                ? "bg-green-500 text-white shadow-md"
                : currentStep > step.id 
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {step.id}. {step.label}
          </button>
        ))}
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 lg:p-8 shadow-soft">
        <div className="space-y-6">
          {/* Step 1 - Basic Info */}
          {currentStep === 1 && (
            <>
              {/* Employee Information Card */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4 md:mb-6">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <i className="fas fa-user text-green-600 dark:text-green-400 text-xs md:text-sm"></i>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                    Employee Information
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-user text-green-500 mr-1"></i>
                      Employee <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20">
                      <option>Select Employee</option>
                      <option>Ahmed Al Mansoori</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-id-card text-green-500 mr-1"></i>
                      Employee ID
                    </label>
                    <input 
                      type="text" 
                      value="EMP-0042" 
                      readOnly 
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm md:text-base text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-building text-green-500 mr-1"></i>
                      Organization <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20">
                      <option>Select Organization</option>
                      <option>Alpha Corp</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-diagram-project text-green-500 mr-1"></i>
                      Department
                    </label>
                    <input 
                      type="text" 
                      value="Engineering" 
                      readOnly 
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm md:text-base text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-briefcase text-green-500 mr-1"></i>
                      Designation
                    </label>
                    <input 
                      type="text" 
                      value="Senior Developer" 
                      readOnly 
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm md:text-base text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-clock text-green-500 mr-1"></i>
                      Employment Type
                    </label>
                    <input 
                      type="text" 
                      value="Full-time" 
                      readOnly 
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm md:text-base text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                    />
                  </div>
                </div>
              </div>

              {/* Pay Period Card */}
              <div>
                <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4 md:mb-6">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <i className="fas fa-calendar-alt text-green-600 dark:text-green-400 text-xs md:text-sm"></i>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                    Pay Period
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-calendar-month text-green-500 mr-1"></i>
                      Pay Period Month <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20">
                      <option>Select Month</option>
                      <option>January</option>
                      <option>February</option>
                      <option>March</option>
                      <option>April</option>
                      <option>May</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-calendar-year text-green-500 mr-1"></i>
                      Pay Period Year <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20">
                      <option>2024</option>
                      <option>2025</option>
                      <option>2026</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-calendar-plus text-green-500 mr-1"></i>
                      Period Start Date
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value="01/05/2026" 
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" 
                      />
                      <i className="far fa-calendar absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-calendar-times text-green-500 mr-1"></i>
                      Period End Date
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value="31/05/2026" 
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" 
                      />
                      <i className="far fa-calendar absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-money-bill-wave text-green-500 mr-1"></i>
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value="30/05/2026" 
                        className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" 
                      />
                      <i className="far fa-calendar absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-university text-green-500 mr-1"></i>
                      Payment Mode <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20">
                      <option>Select Payment Mode</option>
                      <option>Bank Transfer (NEFT)</option>
                      <option>Bank Transfer (RTGS)</option>
                      <option>Cheque</option>
                      <option>Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-calendar-week text-green-500 mr-1"></i>
                      Total Working Days
                    </label>
                    <input 
                      type="text" 
                      value="26" 
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                      <i className="fas fa-calendar-check text-green-500 mr-1"></i>
                      Days Present
                    </label>
                    <input 
                      type="text" 
                      value="30" 
                      className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" 
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 2 - Salary Structure */}
          {currentStep === 2 && (
            <div>
              <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4 md:mb-6">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-coins text-green-600 dark:text-green-400 text-xs md:text-sm"></i>
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                  Salary Structure — Earnings
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                    <i className="fas fa-chart-line text-green-500 mr-1"></i>
                    Annual CTC <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="text" value="12,00,000" className="w-full pl-7 pr-3 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                    <i className="fas fa-money-bill text-green-500 mr-1"></i>
                    Basic Salary <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="text" value="50,000" className="w-full pl-7 pr-3 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                    <i className="fas fa-home text-green-500 mr-1"></i>
                    HRA <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="text" value="20,000" className="w-full pl-7 pr-3 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                    <i className="fas fa-car text-green-500 mr-1"></i>
                    Conveyance Allowance
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="text" value="1,600" className="w-full pl-7 pr-3 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                    <i className="fas fa-notes-medical text-green-500 mr-1"></i>
                    Medical Allowance
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="text" value="1,250" className="w-full pl-7 pr-3 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                    <i className="fas fa-star text-green-500 mr-1"></i>
                    Special Allowance
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="text" value="5,150" className="w-full pl-7 pr-3 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                    <i className="fas fa-plane text-green-500 mr-1"></i>
                    LTA
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="text" value="2,000" className="w-full pl-7 pr-3 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                    <i className="fas fa-trophy text-green-500 mr-1"></i>
                    Performance Bonus
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="text" value="0" className="w-full pl-7 pr-3 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 md:mb-2">
                    <i className="fas fa-clock text-green-500 mr-1"></i>
                    Overtime Pay
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input type="text" value="0" className="w-full pl-7 pr-3 py-2 md:py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm md:text-base text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Gross Earnings</div>
                  <div className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200">₹80,000</div>
                  <div className="text-[9px] md:text-[10px] text-gray-400 mt-0.5">Before deductions</div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total Deductions</div>
                  <div className="text-lg md:text-xl font-bold text-red-500">₹12,315</div>
                  <div className="text-[9px] md:text-[10px] text-gray-400 mt-0.5">PF + ESI + PT + TDS</div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Employee PF</div>
                  <div className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200">₹6,000</div>
                  <div className="text-[9px] md:text-[10px] text-gray-400 mt-0.5">12% of basic</div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="text-[10px] md:text-xs text-green-600 dark:text-green-400 font-medium mb-1">Net Take-Home</div>
                  <div className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">₹67,685</div>
                  <div className="text-[9px] md:text-[10px] text-green-500/70 mt-0.5">INR this month</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 - Country Split / Packages */}
          {currentStep === 3 && (
            <div>
              <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4 md:mb-6">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-globe text-green-600 dark:text-green-400 text-xs md:text-sm"></i>
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                  Salary Packages (Multi-Location)
                </h3>
              </div>
              
              <div className="space-y-3">
                {countries.map((c) => (
                  <div key={c.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="md:col-span-3">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Package</label>
                      <select className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20">
                        <option>{c.name === "UAE" ? "Package 2 - Dubai Onsite" : "Package 1 - Home Country / WFH"}</option>
                        <option>Package 1 - Home Country / WFH</option>
                        <option>Package 2 - Dubai Onsite</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Currency</label>
                      <select className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20">
                        <option>{c.currency}</option>
                        <option>AED</option>
                        <option>INR</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Daily Rate</label>
                      <input type="text" value={c.dailyRate} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block">Days Logged</label>
                      <input type="text" value={c.daysWorked} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] md:text-xs text-gray-500 mb-1 block text-blue-500">Manual FX Rate</label>
                      <input type="text" value={c.fxRate} className="w-full px-3 py-2 text-sm rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="md:col-span-1 flex justify-end items-end pb-0.5">
                      <button className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center">
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="mt-3 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors border border-green-100 dark:border-green-800 flex items-center gap-2">
                <i className="fas fa-plus"></i> Add Package Split
              </button>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="p-3 md:p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                    <span className="w-3 h-2 bg-green-500 rounded-sm"></span>
                    Pkg 2: Dubai (AED)
                  </div>
                  <div className="text-lg md:text-xl font-bold text-orange-600 dark:text-orange-400">AED 6,000</div>
                  <div className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">10 days × AED 600</div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                    <span className="w-3 h-2 bg-green-500 rounded-sm"></span>
                    Pkg 1: WFH (INR)
                  </div>
                  <div className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">₹40,000</div>
                  <div className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">20 days × ₹2,000</div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                    Converted (AED → INR)
                  </div>
                  <div className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">₹1,35,000</div>
                  <div className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">AED 6,000 × 22.5</div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                    Combined Base (INR)
                  </div>
                  <div className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400">₹1,75,000</div>
                  <div className="text-[9px] md:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Total this month before deductions</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 - Overtime */}
          {currentStep === 4 && (
            <div>
              <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4 md:mb-6">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-green-600 dark:text-green-400 text-xs md:text-sm"></i>
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                  Overtime (Unprocessed)
                </h3>
              </div>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                        <th className="py-3 px-4 font-semibold">Project</th>
                        <th className="py-3 px-4 font-semibold">Date</th>
                        <th className="py-3 px-4 font-semibold">Hours</th>
                        <th className="py-3 px-4 font-semibold w-1/3">Reason</th>
                        <th className="py-3 px-4 font-semibold text-center">Status</th>
                        <th className="py-3 px-4 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overtimeRequests.length > 0 ? (
                        overtimeRequests.map((req) => (
                          <tr key={req.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                              <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-medium border border-blue-100 dark:border-blue-800">
                                {req.project}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{req.date}</td>
                            <td className="py-3 px-4 text-sm font-semibold text-gray-800 dark:text-gray-200">{req.hours} hrs</td>
                            <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs" title={req.reason}>
                              {req.reason}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {req.status === "pending" && (
                                <span className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full text-[10px] font-bold border border-yellow-200 dark:border-yellow-800 uppercase">
                                  Pending
                                </span>
                              )}
                              {req.status === "approved_project" && (
                                <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full text-[10px] font-bold border border-purple-200 dark:border-purple-800 uppercase" title="Approved to Project Hours only">
                                  Proj Hours
                                </span>
                              )}
                              {req.status === "approved_payroll" && (
                                <span className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-full text-[10px] font-bold border border-green-200 dark:border-green-800 uppercase" title="Approved to Project Hours & Payroll">
                                  + Payroll
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {req.status === "pending" ? (
                                <div className="flex flex-col gap-1.5 items-center">
                                  <button 
                                    onClick={() => handleOvertimeAction(req.id, "approved_project")}
                                    className="w-full text-[10px] px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 rounded font-semibold transition-colors"
                                  >
                                    Project Hours Only
                                  </button>
                                  <button 
                                    onClick={() => handleOvertimeAction(req.id, "approved_payroll")}
                                    className="w-full text-[10px] px-2 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900/20 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 rounded font-semibold transition-colors"
                                  >
                                    + Add to Payroll
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center text-gray-400 text-xs">
                                  Actioned
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                            No un-processed overtime requests found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                <div className="flex gap-2">
                  <i className="fas fa-info-circle mt-0.5"></i>
                  <div>
                    <p className="font-semibold mb-1">Approval Rules:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><strong>Project Hours Only:</strong> Added to manhour tracking, but no extra pay.</li>
                      <li><strong>+ Add to Payroll:</strong> Added to manhour tracking AND included in this payroll cycle.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5 - Deductions */}
          {currentStep === 5 && (
            <div>
              <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4 md:mb-6">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-minus-circle text-green-600 dark:text-green-400 text-xs md:text-sm"></i>
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                  Deductions
                </h3>
              </div>
              
              <div className="space-y-3">
                {deductions.map((d) => (
                  <div key={d.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="md:col-span-4">
                      <select className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20">
                        <option>{d.type}</option>
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <select className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20">
                        <option>{d.country}</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <input type="text" value={d.amount} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
                    </div>
                    <div className="md:col-span-2">
                      <select className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20">
                        <option>{d.statutory}</option>
                        <option>No</option>
                      </select>
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <button className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center">
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="mt-3 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-semibold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors border border-green-100 dark:border-green-800 flex items-center gap-2">
                <i className="fas fa-plus"></i> Add Deduction
              </button>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">India Deductions</div>
                  <div className="text-lg md:text-xl font-bold text-red-500">₹10,700</div>
                  <div className="text-[9px] md:text-[10px] text-gray-400 mt-0.5">PF + PT + TDS</div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">UAE Deductions (INR)</div>
                  <div className="text-lg md:text-xl font-bold text-red-500">₹1,125</div>
                  <div className="text-[9px] md:text-[10px] text-gray-400 mt-0.5">Gratuity</div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                  <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total Deductions</div>
                  <div className="text-lg md:text-xl font-bold text-red-600 dark:text-red-500">₹11,825</div>
                  <div className="text-[9px] md:text-[10px] text-gray-400 mt-0.5">All countries</div>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="text-[10px] md:text-xs text-green-600 dark:text-green-400 font-medium mb-1">Final Net Pay</div>
                  <div className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">₹1,63,175</div>
                  <div className="text-[9px] md:text-[10px] text-green-500/70 mt-0.5">After all deductions</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6 - Summary */}
          {currentStep === 6 && (
            <div>
              <div className="flex items-center gap-2 pb-3 border-b-2 border-green-100 dark:border-green-900/30 mb-4 md:mb-6">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clipboard-check text-green-600 dark:text-green-400 text-xs md:text-sm"></i>
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-200">
                  Payroll Summary
                </h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Review the payroll details before final submission.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Gross Earnings</div>
                    <div className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-200">₹80,000</div>
                  </div>
                  <div className="p-3 md:p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total Deductions</div>
                    <div className="text-lg md:text-xl font-bold text-red-500">₹12,315</div>
                  </div>
                  <div className="p-3 md:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Combined (INR)</div>
                    <div className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400">₹1,75,000</div>
                  </div>
                  <div className="p-3 md:p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="text-[10px] md:text-xs text-green-600 dark:text-green-400 font-medium mb-1">Final Net Pay</div>
                    <div className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">₹1,63,175</div>
                  </div>
                </div>

                {/* Delivery Note */}
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                  <i className="fas fa-envelope text-blue-500 mt-1"></i>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Payslip Delivery</h4>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                      Upon submission, the generated payslip will be automatically sent to the employee via Email only. System-generated offer letters (if applicable) will also use this delivery method.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
            {currentStep > 1 && (
              <button 
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <i className="fas fa-arrow-left text-xs md:text-sm"></i>
                <span>Previous</span>
              </button>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                className="px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <i className="fas fa-save text-xs md:text-sm"></i>
                <span>Save as Draft</span>
              </button>
              
              {currentStep < 6 ? (
                <button 
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <span>Next Step</span>
                  <i className="fas fa-arrow-right text-xs md:text-sm"></i>
                </button>
              ) : (
                <button 
                  onClick={generatePayslipPDF}
                  className="px-4 md:px-6 py-2 md:py-2.5 rounded-full font-semibold bg-green-500 text-white hover:bg-green-600 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <i className="fas fa-paper-plane text-xs md:text-sm"></i>
                  <span>Generate & Email Payslip</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddPayroll;