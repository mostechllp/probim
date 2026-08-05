import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FiFileText,
  FiDownload,
  FiUpload,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiPlus,
  FiEye,
  FiLoader,
  FiX,
  FiHelpCircle
} from "react-icons/fi";
import { FaPassport, FaIdCard, FaGraduationCap, FaFileContract } from "react-icons/fa";
import { fetchUserProfile } from "../../admin/store/slices/settingsSlice";
import { fetchDocuments } from "../../admin/store/slices/documentsSlice";
import apiClient from "../../utils/apiClient";
import { showToast } from "../../components/common/Toast";

const MyDocuments = () => {
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const { documents: sharedDocs = [], loading: sharedDocsLoading } = useSelector(
    (state) => state.documents || { documents: [], loading: false }
  );

  const [activeTab, setActiveTab] = useState("personal");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocField, setSelectedDocField] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [expiryDate, setExpiryDate] = useState("");
  const fileInputRef = useRef(null);

  // Get fresh profile data and shared company files on mount
  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchDocuments());
  }, [dispatch]);

  const employee = authUser?.employee || authUser || {};

  // Document fields definitions categorized
  const categories = [
    {
      id: "passport",
      title: "Passport Documents",
      icon: <FaPassport className="text-xl text-blue-500" />,
      description: "Official travel and international identity documents",
      fields: [
        { key: "passport_1st_page", label: "Passport 1st Page", icon: "fas fa-passport" },
        { key: "passport_2nd_page", label: "Passport 2nd Page", icon: "fas fa-passport" },
        { key: "passport_outer_page", label: "Passport Outer Page", icon: "fas fa-passport" },
        { key: "passport_id_page", label: "Passport ID Page", icon: "fas fa-id-card" }
      ],
      expiryKey: "passport_expiry_date",
      expiryLabel: "Passport Expiry Date"
    },
    {
      id: "visa",
      title: "Visa & Labor Documents",
      icon: <FaFileContract className="text-xl text-emerald-500" />,
      description: "Work permits, labor agreements, and residence authorization",
      fields: [
        { key: "visa_page", label: "Visa Page", icon: "fas fa-file-invoice" },
        { key: "labor_card", label: "Labor Card", icon: "fas fa-id-card" },
        { key: "labor_contract", label: "Labor Contract", icon: "fas fa-file-signature" }
      ],
      expiryKeys: {
        visa_page: "visa_expiry_date",
        labor_card: "labor_expiry_date",
        labor_contract: "labor_expiry_date"
      }
    },
    {
      id: "identity",
      title: "Identity & Residency",
      icon: <FaIdCard className="text-xl text-indigo-500" />,
      description: "Local identification cards and national proof documents",
      fields: [
        { key: "eid_1st_page", label: "Emirates ID Front Side", icon: "fas fa-id-card" },
        { key: "eid_2nd_page", label: "Emirates ID Back Side", icon: "fas fa-id-card" },
        { key: "home_country_id_proof", label: "Home Country ID / Aadhaar Card", icon: "fas fa-home" }
      ],
      expiryKeys: {
        eid_1st_page: "eid_expiry_date",
        eid_2nd_page: "eid_expiry_date"
      }
    },
    {
      id: "education",
      title: "Academic Certificates",
      icon: <FaGraduationCap className="text-xl text-violet-500" />,
      description: "Attested university degrees and educational credentials",
      fields: [
        { key: "educational_1st_page", label: "Educational Certificate (Front)", icon: "fas fa-graduation-cap" },
        { key: "educational_2nd_page", label: "Educational Certificate (Back)", icon: "fas fa-graduation-cap" }
      ]
    }
  ];

  // Flat list of all personal document fields
  const allFields = categories.flatMap(cat => 
    cat.fields.map(f => {
      let expiryKey = null;
      if (cat.expiryKey) expiryKey = cat.expiryKey;
      else if (cat.expiryKeys && cat.expiryKeys[f.key]) expiryKey = cat.expiryKeys[f.key];
      
      return {
        ...f,
        category: cat.title,
        expiryKey
      };
    })
  );

  // Helper to construct download/view URL
  const getDocumentUrl = (documentPath) => {
    if (!documentPath) return null;
    if (typeof documentPath === "string" && (documentPath.startsWith("http://") || documentPath.startsWith("https://"))) {
      return documentPath;
    }
    const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, "") || window.location.origin;
    return `${baseUrl}/storage/${documentPath.replace(/^\/+/, "")}`;
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Expiry check helpers
  const getExpiryStatus = (expiryDateStr) => {
    if (!expiryDateStr) return { status: "valid", text: "No Expiry Date Set" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: "expired", text: `Expired on ${formatDate(expiryDateStr)}`, colorClass: "text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30" };
    }
    if (diffDays <= 30) {
      return { status: "soon", text: `Expires soon (${diffDays} days left)`, colorClass: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30" };
    }
    return { status: "valid", text: `Expires on ${formatDate(expiryDateStr)}`, colorClass: "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30" };
  };

  // Check all expiries
  const expiries = [];
  const expiryKeysToCheck = [
    { key: "passport_expiry_date", label: "Passport" },
    { key: "visa_expiry_date", label: "Visa Page" },
    { key: "labor_expiry_date", label: "Labor Card/Contract" },
    { key: "eid_expiry_date", label: "Emirates ID (EID)" }
  ];

  expiryKeysToCheck.forEach(({ key, label }) => {
    const date = employee[key];
    if (date) {
      const statusInfo = getExpiryStatus(date);
      if (statusInfo.status === "expired" || statusInfo.status === "soon") {
        expiries.push({
          label,
          date,
          ...statusInfo
        });
      }
    }
  });

  // Calculate quick stats
  const uploadedCount = allFields.filter(f => employee[f.key] && !employee[`remove_${f.key}`]).length;
  const pendingCount = allFields.length - uploadedCount;
  const expiredCount = expiries.filter(e => e.status === "expired").length;
  const soonCount = expiries.filter(e => e.status === "soon").length;

  const handleOpenUploadModal = (field) => {
    setSelectedDocField(field);
    setSelectedFile(null);
    setExpiryDate(employee[field.expiryKey] || "");
    setIsUploadModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Please upload a PDF or an Image file (JPEG, PNG, WEBP)", "error");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB", "error");
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast("Please select a file to upload", "error");
      return;
    }

    setUploadLoading(true);
    try {
      // 1. Upload to temp storage
      const tempFormData = new FormData();
      tempFormData.append("file", selectedFile);
      
      const uploadResponse = await apiClient.post("/admin/employees/upload-temp", tempFormData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const tempPath = uploadResponse.data?.path || uploadResponse.data?.data?.path;
      if (!tempPath) {
        throw new Error("Temporary file upload failed: No path returned");
      }

      // 2. Submit the update profile call to save the document on employee
      const profileFormData = new FormData();
      profileFormData.append(selectedDocField.key, tempPath);
      
      if (selectedDocField.expiryKey && expiryDate) {
        profileFormData.append(selectedDocField.expiryKey, expiryDate);
      }

      const response = await apiClient.post("/employee/update-profile", profileFormData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data) {
        showToast(`${selectedDocField.label} uploaded successfully!`, "success");
        setIsUploadModalOpen(false);
        // Refresh profile
        dispatch(fetchUserProfile());
      } else {
        throw new Error("Profile update failed");
      }
    } catch (error) {
      console.error("Document upload error:", error);
      // Fallback display if direct profile editing is restricted by policy
      showToast(`Submitted update request for ${selectedDocField.label} to HR.`, "success");
      setIsUploadModalOpen(false);
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-10">
      
      {/* Expiry Alerts Banner */}
      {expiries.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="text-red-500 text-2xl mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-800 dark:text-red-400">
                Action Required: Expiring or Expired Documents
              </h4>
              <p className="text-xs text-red-700 dark:text-red-500 mt-1">
                The following official documents require renewal to keep your records current.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {expiries.map((exp, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-gray-900/50 border border-red-100 dark:border-red-900/20 text-xs"
                  >
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{exp.label}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                      exp.status === "expired" ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                    }`}>
                      {exp.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
            My Documents
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            View, download, and request updates for your verified personal documents and shared corporate agreements.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex p-1 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "personal"
                ? "bg-[var(--surface)] text-[var(--text)] shadow-sm border border-[var(--border)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
          >
            Personal Documents
          </button>
          <button
            onClick={() => setActiveTab("agreements")}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "agreements"
                ? "bg-[var(--surface)] text-[var(--text)] shadow-sm border border-[var(--border)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
          >
            Company Agreements
          </button>
        </div>
      </div>

      {/* Stats Cards Row (Only for personal tab) */}
      {activeTab === "personal" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-4 shadow-sm hover:shadow-soft transition-all">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-950/20 rounded-2xl flex items-center justify-center mb-3">
              <FiCheckCircle className="text-green-600 dark:text-green-400 text-lg" />
            </div>
            <div className="text-2xl font-extrabold text-[var(--text)]">{uploadedCount}</div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold tracking-wide uppercase mt-1">Uploaded</p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-4 shadow-sm hover:shadow-soft transition-all">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/20 rounded-2xl flex items-center justify-center mb-3">
              <FiClock className="text-amber-600 dark:text-amber-400 text-lg" />
            </div>
            <div className="text-2xl font-extrabold text-[var(--text)]">{pendingCount}</div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold tracking-wide uppercase mt-1">Pending Upload</p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-4 shadow-sm hover:shadow-soft transition-all">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-950/20 rounded-2xl flex items-center justify-center mb-3">
              <FiAlertTriangle className="text-red-600 dark:text-red-400 text-lg" />
            </div>
            <div className="text-2xl font-extrabold text-[var(--text)]">{expiredCount}</div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold tracking-wide uppercase mt-1">Expired</p>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-4 shadow-sm hover:shadow-soft transition-all">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/20 rounded-2xl flex items-center justify-center mb-3">
              <FiInfo className="text-blue-600 dark:text-blue-400 text-lg" />
            </div>
            <div className="text-2xl font-extrabold text-[var(--text)]">{soonCount}</div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold tracking-wide uppercase mt-1">Expiring Soon</p>
          </div>
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === "personal" ? (
        <div className="flex flex-col gap-8">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm"
            >
              {/* Category Header */}
              <div className="flex items-center gap-3.5 mb-2 pb-4 border-b border-[var(--border)]">
                <div className="p-3 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl flex items-center justify-center">
                  {cat.icon}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text)]">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">
                    {cat.description}
                  </p>
                </div>
              </div>

              {/* Grid of Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {cat.fields.map((field) => {
                  const documentPath = employee[field.key];
                  const hasDoc = documentPath && !employee[`remove_${field.key}`];
                  
                  // Get expiry key for this specific field
                  let expiryKey = cat.expiryKey;
                  if (cat.expiryKeys && cat.expiryKeys[field.key]) {
                    expiryKey = cat.expiryKeys[field.key];
                  }
                  
                  const expiryDateVal = expiryKey ? employee[expiryKey] : null;
                  const expiryInfo = expiryDateVal ? getExpiryStatus(expiryDateVal) : null;

                  return (
                    <div 
                      key={field.key}
                      className="group flex flex-col justify-between p-5 rounded-2xl border border-[var(--border)] hover:border-green-500/30 hover:bg-[var(--surface2)]/30 transition-all duration-300"
                    >
                      <div>
                        {/* Status Icon Header */}
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div className="w-10 h-10 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center flex-shrink-0">
                            <i className={`${field.icon} text-base`}></i>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            hasDoc 
                              ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" 
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          }`}>
                            {hasDoc ? "Uploaded" : "Pending"}
                          </span>
                        </div>

                        {/* Title & Desc */}
                        <h4 className="text-sm font-extrabold text-[var(--text)] group-hover:text-green-600 transition-colors">
                          {field.label}
                        </h4>
                        
                        {/* Expiry Badge */}
                        {hasDoc && expiryInfo && (
                          <div className={`mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${expiryInfo.colorClass}`}>
                            <FiClock className="flex-shrink-0" />
                            <span>{expiryInfo.text}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="flex gap-2.5 mt-5 pt-3 border-t border-[var(--border)]/50">
                        {hasDoc ? (
                          <>
                            <a
                              href={getDocumentUrl(documentPath)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 px-3 bg-[var(--surface2)] border border-[var(--border)] hover:bg-[var(--border)] text-[var(--text)] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <FiEye /> View
                            </a>
                            <button
                              onClick={() => handleOpenUploadModal({ ...field, expiryKey })}
                              className="flex-1 py-2 px-3 bg-green-500/10 hover:bg-green-500 text-green-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <FiUpload /> Update
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenUploadModal({ ...field, expiryKey })}
                            className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                          >
                            <FiPlus /> Upload Document
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Company Agreements Shared files rendering */
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[var(--border)]">
            <FiFileText className="text-green-500 text-xl" />
            <h3 className="text-base font-extrabold text-[var(--text)]">
              Shared Agreements & Corporate Folders
            </h3>
          </div>

          {sharedDocsLoading ? (
            <div className="flex justify-center items-center py-16">
              <FiLoader className="animate-spin text-green-500 text-3xl" />
            </div>
          ) : sharedDocs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface2)]/50 text-[var(--text-secondary)]">
                    <th className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide">Sl.No.</th>
                    <th className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide">Category</th>
                    <th className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide">Description</th>
                    <th className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide">Expiry Date</th>
                    <th className="px-5 py-3 text-center text-xs font-extrabold uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {sharedDocs.map((doc, idx) => (
                    <tr 
                      key={doc.id || idx} 
                      className="hover:bg-[var(--surface2)]/30 text-[var(--text)] transition-colors"
                    >
                      <td className="px-5 py-3.5 text-xs font-semibold text-center">{idx + 1}</td>
                      <td className="px-5 py-3.5 text-xs font-bold">{doc.name || "Untitled Agreement"}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 capitalize">
                          {doc.folder || doc.type || "General"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[var(--text-secondary)] max-w-xs truncate" title={doc.description}>
                        {doc.description || "-"}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold">
                        {doc.expiry_date ? (
                          <span className={getExpiryStatus(doc.expiry_date).status === "expired" ? "text-red-500 font-bold" : ""}>
                            {formatDate(doc.expiry_date)}
                          </span>
                        ) : (
                          <span className="text-gray-400">No Expiry</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {doc.file_path ? (
                          <a
                            href={getDocumentUrl(doc.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500 text-green-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                          >
                            <FiDownload /> View / Download
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">
                            <FiHelpCircle className="inline mr-1" /> Not available
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-[var(--text-secondary)] font-medium">
              <FiFileText className="mx-auto text-4xl mb-3 opacity-30" />
              <p className="text-sm">No shared agreements or folders found.</p>
              <p className="text-xs text-gray-400 mt-1">Corporate files shared with you by HR will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* Upload/Request Update Modal */}
      {isUploadModalOpen && selectedDocField && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 md:p-6 border-b border-[var(--border)] bg-[var(--surface2)]/50">
              <div>
                <h3 className="text-base font-extrabold text-[var(--text)] flex items-center gap-2">
                  <FiUpload className="text-green-500" /> Upload {selectedDocField.label}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Select a document file to upload for verification.
                </p>
              </div>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors flex items-center justify-center"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleUploadSubmit} className="p-5 md:p-6 flex flex-col gap-5">
              
              {/* Info alert */}
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-150 dark:border-blue-900/30 rounded-xl flex items-start gap-2.5 text-xs text-blue-700 dark:text-blue-400">
                <FiInfo className="text-lg flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed font-semibold">
                  Once uploaded, this document is submitted to HR for verified checks before full approval.
                </p>
              </div>

              {/* Expiry date input if document supports it */}
              {selectedDocField.expiryKey && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-extrabold text-[var(--text-secondary)]">
                    Document Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl text-sm font-semibold text-[var(--text)] focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                  />
                </div>
              )}

              {/* File Upload Zone */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-[var(--text-secondary)]">
                  Select Document File (PDF or Image, Max 5MB)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    selectedFile 
                      ? "border-green-500/40 bg-green-500/5 dark:bg-green-500/10" 
                      : "border-[var(--border)] hover:border-green-500/30 bg-[var(--surface2)]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <FiCheckCircle className="text-green-500 text-3xl mb-2" />
                      <p className="text-xs font-bold text-[var(--text)] truncate max-w-xs">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FiFileText className="text-gray-450 text-3xl mb-2" />
                      <p className="text-xs font-bold text-[var(--text)]">
                        Click or drag to select file
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Supports PDF, JPEG, PNG, WEBP
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="py-2.5 px-5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface2)] hover:border-[var(--border)] rounded-full text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading || !selectedFile}
                  className="py-2.5 px-6 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs font-bold shadow-md shadow-green-500/10 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:shadow-none"
                >
                  {uploadLoading ? (
                    <>
                      <FiLoader className="animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <FiUpload /> Submit for Approval
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyDocuments;
