import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiFileText, FiDownload, FiChevronRight, FiChevronLeft, FiPrinter, FiSettings, FiLoader } from "react-icons/fi";
import { setStep, updateOfferLetter } from "../../store/slices/onboardingSlice";
import jsPDF from "jspdf";

const OfferLetterPreview = () => {
  const dispatch = useDispatch();

  // Use a more robust selector to prevent crashes
  const onboarding = useSelector((state) => state.onboarding);
  const employeeDetails = onboarding?.employeeDetails || {};
  const offerLetter = onboarding?.offerLetter || {};

  const [template, setTemplate] = useState(offerLetter.template || "standard");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateContent = (empName, pos, date, basicSalary, otherAllowance, totalSalary, paymentCycle) => {
    let formattedDate = date;
    if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split("-");
      formattedDate = `${day}/${month}/${year}`;
    }

    const formattedBasic = basicSalary ? `AED ${parseFloat(basicSalary).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "[Basic Salary]";
    const formattedAllowance = otherAllowance ? `AED ${parseFloat(otherAllowance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "AED 0.00";
    const formattedTotal = totalSalary ? `AED ${parseFloat(totalSalary).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "[Total Salary]";
    const cycle = paymentCycle || "Monthly";

    return `Date: ${new Date().toLocaleDateString('en-GB')}

PRIVATE & CONFIDENTIAL

To: ${empName || "[Candidate Name]"}
Position Offered: ${pos || "[Job Title]"}

Subject: Offer of Employment

Dear ${empName || "Candidate"},

On behalf of the Company, we are pleased to extend this formal offer of employment for the position of ${pos || "[Job Title]"}. We were highly impressed by your qualifications and experience, and we believe your skills will be a valuable addition to our organization.

Below are the key terms and conditions of your employment offer:

1. POSITION AND RESPONSIBILITIES
Your initial designation will be ${pos || "[Job Title]"}, reporting directly to the Department Head. Your duties and responsibilities will be as standard for this position, along with any other assignments delegated by the management.

2. PROBATIONARY PERIOD
In accordance with the UAE Labor Law, you will serve a probationary period of six (6) months starting from your date of joining, which is proposed to be ${formattedDate || "[Joining Date]"}. During this period, your performance will be evaluated, and employment may be terminated by either party with written notice as per standard regulations.

3. COMPENSATION AND BENEFITS
Your compensation package is structured on a ${cycle.toLowerCase()} cycle as follows:
   - Basic Salary: ${formattedBasic}
   - Housing and Other Allowances: ${formattedAllowance}
   - Total Gross Monthly Salary: ${formattedTotal}
   
All payments will be processed via bank transfer through the Wages Protection System (WPS) in accordance with UAE regulations. You will also be eligible for standard benefits, including comprehensive medical insurance and annual flight allowance, as per company policy.

4. LEAVE ENTITLEMENTS
You will be entitled to paid annual leave of 30 calendar days per completed year of service, in addition to standard public holidays announced by the UAE government.

5. CONFIDENTIALITY AND CODE OF CONDUCT
During and after your employment, you agree to maintain the strict confidentiality of all proprietary business, customer, and operational information. You will also be expected to adhere to the company's code of conduct and professional standards.

This offer of employment is contingent upon the successful validation of your references, educational credentials, and the procurement of a valid UAE work permit and residency visa.

Please indicate your acceptance of this offer by signing and returning a copy of this letter. We are thrilled at the prospect of you joining our team and look forward to building a successful future together.

Sincerely,

Human Resources Department
UAE Operations

---------------------------------------------------------
ACCEPTANCE OF OFFER:
I, ${empName || "[Candidate Name]"}, hereby accept the terms and conditions of employment as detailed above.

Signature: ____________________      Date: ____________________`;
  };

  const [content, setContent] = useState("");

  useEffect(() => {
    const initialContent = offerLetter.content || generateContent(
      employeeDetails.fullName,
      employeeDetails.designation,
      employeeDetails.joiningDate,
      employeeDetails.basicSalary,
      employeeDetails.otherAllowance,
      employeeDetails.totalMonthlySalary,
      employeeDetails.paymentCycle
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent(initialContent);
  }, [employeeDetails, offerLetter.content]);

  const handleNext = () => {
    dispatch(updateOfferLetter({ content, template, generated: true }));
    dispatch(setStep(5));
  };

  const handleBack = () => {
    dispatch(setStep(3));
  };

  const downloadPDF = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxLineWidth = pageWidth - (margin * 2);

      // Apply styling based on template
      if (template === "modern") {
        // Modern Minimalist Template
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(44, 62, 80);
        doc.text("OFFER OF EMPLOYMENT", margin, 25);

        doc.setDrawColor(52, 152, 219); // Blue accent
        doc.setLineWidth(1.5);
        doc.line(margin, 29, 60, 29);
      } else {
        // Standard Classic Template
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(44, 62, 80);
        doc.text("OFFER OF EMPLOYMENT", pageWidth / 2, 25, { align: "center" });

        doc.setDrawColor(46, 204, 113); // Green accent
        doc.setLineWidth(0.8);
        doc.line(margin, 29, pageWidth - margin, 29);
      }

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(60, 60, 60);

      const splitText = doc.splitTextToSize(content, maxLineWidth);
      
      let y = 40;
      splitText.forEach(line => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 6.5;
      });

      const filename = `Offer_Letter_${employeeDetails.fullName?.replace(/\s+/g, "_") || "Candidate"}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF offer letter.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    // Create an iframe dynamically
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    
    // Format the text into HTML paragraphs
    const formattedHtml = content
      .split("\n")
      .map(para => para.trim() ? `<p style="margin-bottom: 12px; line-height: 1.6; font-size: 14px; font-family: 'Times New Roman', Times, serif; color: #333;">${para}</p>` : `<div style="height: 12px;"></div>`)
      .join("");

    const isModern = template === "modern";

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Offer Letter - ${employeeDetails.fullName || "Candidate"}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              color: #333;
              padding: 10px;
            }
            .header {
              text-align: ${isModern ? 'left' : 'center'};
              border-bottom: 2px solid ${isModern ? '#3498db' : '#2ecc71'};
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: ${isModern ? '28px' : '24px'};
              margin: 0;
              color: #2c3e50;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Offer of Employment</h1>
          </div>
          <div class="content">
            ${formattedHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.frameElement.remove();
              }, 100);
            }
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  if (!onboarding) return <div className="p-10 text-center">Loading Onboarding Data...</div>;

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      {/* Configuration Sidebar */}
      <div className="space-y-6 lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FiSettings className="text-green-600" />
            Settings
          </h3>
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase">Template</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
            >
              <option value="standard">Standard UAE</option>
              <option value="modern">Modern</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 p-6 text-center">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={downloadPDF} 
              disabled={isGenerating}
              className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border hover:border-green-500 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <FiLoader size={20} className="text-green-600 animate-spin" />
              ) : (
                <FiDownload size={20} className="text-gray-400" />
              )}
              <span className="text-[10px] font-bold">{isGenerating ? "SAVING..." : "PDF"}</span>
            </button>
            <button 
              onClick={handlePrint}
              className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border hover:border-green-500 transition-all flex flex-col items-center justify-center gap-2"
            >
              <FiPrinter size={20} className="text-gray-400" />
              <span className="text-[10px] font-bold">PRINT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-8 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiFileText className="text-green-600" />
              <span className="text-sm font-bold">Offer Letter Preview</span>
            </div>
          </div>

          <div className="p-6 md:p-10">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[500px] p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg shadow-inner outline-none resize-none font-serif text-sm md:text-base leading-relaxed text-gray-800 dark:text-gray-200"
            />
          </div>

          <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-between">
            <button onClick={handleBack} className="flex items-center gap-2 font-bold text-gray-500 hover:text-gray-900">
              <FiChevronLeft size={20} /> Back
            </button>
            <button
              onClick={handleNext}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            >
              Review <FiChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferLetterPreview;
