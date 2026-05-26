import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { showToast } from "../../components/common/Toast";
import { fetchEmployeeById } from "@admin/store/slices/employeeSlice";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiBriefcase,
  FiFileText,
  FiDownload,
  FiEdit,
  FiArrowLeft,
  FiXCircle,
  FiCreditCard,
  FiPhoneCall,
  FiFlag,
  FiHeart,
  FiHome,
  FiCalendar,
  FiAward,
} from "react-icons/fi";
import { FaIdCard, FaVenusMars, FaPassport } from "react-icons/fa";
import { fetchOrganizations } from "../store/slices/organizationSlice";
import { fetchCompanies } from "../store/slices/companySlice";
import { fetchRoles } from "../store/slices/roleSlice";

const EmployeeDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("basic");

  const { currentEmployee } = useSelector((state) => state.employees || {});
  const { organizations = [] } = useSelector(
    (state) => state.organizations || {},
  );
  const { roles = [] } = useSelector((state) => state.roles || {});

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/immutability
      fetchEmployeeData();
    }
  }, [dispatch, id]);

  useEffect(() => {
    // Fetch organizations, companies, and roles for display
    dispatch(fetchOrganizations());
    dispatch(fetchCompanies());
    dispatch(fetchRoles());
  }, [dispatch]);

  const getOrganizationName = (organizationId) => {
    if (!organizationId) return "N/A";
    const org = organizations.find(
      (org) => org.id === parseInt(organizationId),
    );
    return org?.name || "N/A";
  };

  const getRoleName = (roleId) => {
    if (!roleId) return "N/A";
    const role = roles.find((role) => role.id === parseInt(roleId));
    return role?.name || `Role ID: ${roleId}`;
  };

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      await dispatch(fetchEmployeeById(id));
    } catch (error) {
      showToast("Failed to load employee details", error);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentUrl = (documentPath) => {
    if (!documentPath) return null;
    const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";
    return `${baseUrl}/storage/${documentPath}`;
  };

  const getPhotoUrl = (photoValue) => {
    if (!photoValue) return null;

    if (photoValue.startsWith("/tmp/")) {
      const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";
      return `${baseUrl}/storage/temp/${photoValue.replace("/tmp/", "")}`;
    }

    if (photoValue.startsWith("data:")) return photoValue;
    if (photoValue.startsWith("http://") || photoValue.startsWith("https://"))
      return photoValue;

    const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

    if (photoValue.startsWith("/storage/")) return `${baseUrl}${photoValue}`;

    if (!photoValue.includes("/")) {
      return `${baseUrl}/storage/avatars/${photoValue}`;
    }

    return `${baseUrl}/storage/${photoValue}`;
  };

  const getEmployeePhoto = () => {
    const possiblePhotoFields = [
      currentEmployee?.avatar,
      currentEmployee?.avatar_path,
      currentEmployee?.passport_size_photo,
      currentEmployee?.profile_photo,
      currentEmployee?.photo,
      currentEmployee?.user?.avatar,
      currentEmployee?.user?.avatar_path,
    ];

    for (const fieldValue of possiblePhotoFields) {
      if (fieldValue && typeof fieldValue === "string") {
        const resolvedPhoto = getPhotoUrl(fieldValue);
        if (resolvedPhoto) return resolvedPhoto;
      }
    }

    if (currentEmployee?.avatar && typeof currentEmployee.avatar === "object") {
      if (currentEmployee.avatar.path) {
        return getPhotoUrl(currentEmployee.avatar.path);
      }
    }

    return null;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";

    try {
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString("en-GB");
      }

      if (typeof dateValue === "string") {
        if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateValue.split("-");
          return `${day}/${month}/${year}`;
        }

        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("en-GB");
        }
      }

      return dateValue;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const formatSpecialDays = (specialDays) => {
    if (!specialDays) return null;

    try {
      let days = specialDays;

      if (typeof specialDays === "string") {
        try {
          days = JSON.parse(specialDays);
        } catch (e) {
          console.error("Failed to parse special days string:", e);
          return null;
        }
      }

      if (Array.isArray(days) && days.length > 0) {
        return days.map((day) => ({
          name: day.name,
          date: day.date ? formatDate(day.date) : "No date",
        }));
      }

      if (days && days.special_days && Array.isArray(days.special_days)) {
        return days.special_days.map((day) => ({
          name: day.name,
          date: day.date ? formatDate(day.date) : "No date",
        }));
      }

      return null;
    } catch (e) {
      console.error("Error formatting special days:", e);
      return null;
    }
  };

  // Check if employee is skilled
  const isSkilled = () => {
    return (
      currentEmployee?.is_skilled === 1 || currentEmployee?.is_skilled === true
    );
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: <FiUser /> },
    { id: "passport", label: "Passport", icon: <FaPassport /> },
    { id: "visa", label: "Visa & Labor", icon: <FiCreditCard /> },
    { id: "eid", label: "EID", icon: <FaIdCard /> },
    { id: "contact", label: "Contact", icon: <FiPhoneCall /> },
    { id: "documents", label: "Documents", icon: <FiFileText /> },
  ];

  const documentFields = [
    {
      key: "passport_1st_page",
      label: "Passport 1st Page",
      icon: "fas fa-passport",
    },
    {
      key: "passport_2nd_page",
      label: "Passport 2nd Page",
      icon: "fas fa-passport",
    },
    {
      key: "passport_outer_page",
      label: "Passport Outer",
      icon: "fas fa-passport",
    },
    { key: "passport_id_page", label: "Passport ID", icon: "fas fa-id-card" },
    { key: "visa_page", label: "Visa Page", icon: "fas fa-file-contract" },
    { key: "labor_card", label: "Labor Card", icon: "fas fa-id-card" },
    {
      key: "labor_contract",
      label: "Labor Contract",
      icon: "fas fa-file-signature",
    },
    { key: "eid_1st_page", label: "EID Front Side", icon: "fas fa-id-card" },
    { key: "eid_2nd_page", label: "EID Back Side", icon: "fas fa-id-card" },
    {
      key: "educational_1st_page",
      label: "Educational Certificate (Front)",
      icon: "fas fa-graduation-cap",
    },
    {
      key: "educational_2nd_page",
      label: "Educational Certificate (Back)",
      icon: "fas fa-graduation-cap",
    },
    {
      key: "home_country_id_proof",
      label: "Home Country ID Proof",
      icon: "fas fa-home",
    },
  ];

  if (loading) {
    return (
      <div className="w-full overflow-x-hidden">
        <main className="content px-4 py-4 md:px-6 md:py-6">
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!currentEmployee) {
    return (
      <div className="w-full overflow-x-hidden">
        <main className="content px-4 py-4 md:px-6 md:py-6">
          <div className="text-center py-12">
            <FiUser className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">
              Employee not found
            </h3>
            <button
              onClick={() => navigate("/admin/employees")}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Back to Employees
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden">
      <main className="content px-4 py-4 md:px-6 md:py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/admin/employees")}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to Employees"
                >
                  <FiArrowLeft className="text-gray-600 text-xl" />
                </button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Employee Details
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    View complete employee information
                  </p>
                </div>
              </div>
              <Link
                to={`/admin/employees/edit/${currentEmployee.id}`}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <FiEdit /> Edit Employee
              </Link>
            </div>
          </div>

          {/* Profile Summary Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {getEmployeePhoto() ? (
                <img
                  src={getEmployeePhoto()}
                  alt={`${currentEmployee.first_name || "Employee"} photo`}
                  className="w-24 h-24 rounded-full object-cover border-2 border-green-100 shadow-md"
                  onError={(e) => {
                    console.error("Failed to load image:", getEmployeePhoto());
                    e.target.style.display = "none";
                    e.target.parentElement.querySelector(
                      ".fallback-avatar",
                    ).style.display = "flex";
                  }}
                />
              ) : null}
              {!getEmployeePhoto() && (
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md fallback-avatar">
                  {currentEmployee.first_name?.charAt(0)}
                  {currentEmployee.last_name?.charAt(0)}
                </div>
              )}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-800">
                  {currentEmployee.first_name} {currentEmployee.last_name}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    {currentEmployee.user?.type?.toUpperCase() || "EMPLOYEE"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      currentEmployee.user?.status === "active"
                        ? "bg-green-100 text-green-700"
                        : currentEmployee.user?.status === "onboarding"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {currentEmployee.user?.status === "active"
                      ? "Active"
                      : currentEmployee.user?.status === "onboarding"
                      ? "Onboarding"
                      : "Inactive"}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    ID: {currentEmployee.employee_id}
                  </span>
                  {isSkilled() && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      <FiAward className="inline mr-1" /> Skilled
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 justify-center md:justify-start text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <FiMail className="text-green-500" />{" "}
                    {currentEmployee.personal_email || "N/A"}
                  </div>
                  <div className="flex items-center gap-1">
                    <FiPhone className="text-green-500" />{" "}
                    {currentEmployee.personal_number || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white border border-gray-200 rounded-xl mb-6 overflow-x-auto">
            <div className="flex min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 flex items-center gap-2 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "text-green-600 border-b-2 border-green-600 bg-gray-50"
                      : "text-gray-600 hover:text-green-600 hover:bg-gray-50"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            {/* Basic Information Tab */}
            {activeTab === "basic" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiUser className="text-green-500" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Full Name
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.first_name} {currentEmployee.last_name}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Employee ID
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.employee_id}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Username
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.user?.username || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        User Type
                      </label>
                      <p className="text-gray-800 font-medium mt-1 capitalize">
                        {currentEmployee.user?.type || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Employee Category
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {isSkilled() ? "Skilled" : "Unskilled"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <FaVenusMars /> Gender
                      </label>
                      <p className="text-gray-800 font-medium mt-1 capitalize">
                        {currentEmployee.gender || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <FiCalendar /> Date of Birth
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.dob
                          ? formatDate(currentEmployee.dob)
                          : "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <FiCalendar /> Joining Date
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.joining_date
                          ? formatDate(currentEmployee.joining_date)
                          : "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <FiFlag /> Nationality
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.nationality || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <FiHeart /> Marital Status
                      </label>
                      <p className="text-gray-800 font-medium mt-1 capitalize">
                        {currentEmployee.marital_status || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Dependents
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.dependents || "0"}
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-4 flex items-center gap-2">
                  <FiBriefcase className="text-green-500" /> Organization
                  Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Organization
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {getOrganizationName(
                          currentEmployee.user?.organization_id,
                        )}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Company
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.user?.company?.company_name ||
                          currentEmployee.user?.company?.name ||
                          "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Trade License Type
                      </label>
                      <p className="text-gray-800 font-medium mt-1 capitalize">
                        {currentEmployee.user?.company?.trade_license || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Designation
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.user?.designation?.name || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Department
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.user?.department?.name || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Role
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {getRoleName(currentEmployee.user?.role_id)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Special Days Section */}
                <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-4 flex items-center gap-2">
                  <FiHeart className="text-green-500" /> Special Days
                </h3>
                <div className="border-t border-gray-100 pt-4">
                  {(() => {
                    const formattedSpecialDays = formatSpecialDays(
                      currentEmployee.special_days,
                    );
                    if (
                      !formattedSpecialDays ||
                      formattedSpecialDays.length === 0
                    ) {
                      return (
                        <p className="text-gray-600">
                          No special days recorded
                        </p>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formattedSpecialDays.map((day, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-3 flex items-center gap-3"
                          >
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 font-semibold text-sm">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                {day.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {day.date}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Passport Information Tab */}
            {activeTab === "passport" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaPassport className="text-green-500" /> Passport Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Passport Full Name
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.passport_full_name || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Passport Number
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.passport_number || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Issued From
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.passport_issued_from || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Issued Date
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.passport_issued_date
                          ? formatDate(currentEmployee.passport_issued_date)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Expiry Date
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.passport_expiry_date
                          ? formatDate(currentEmployee.passport_expiry_date)
                          : "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Place of Birth
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.place_of_birth || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Father's Name
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.father_name || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Mother's Name
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.mother_name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="border-b border-gray-100 pb-3">
                    <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <FiHome /> Address
                    </label>
                    <p className="text-gray-800 font-medium mt-1">
                      {currentEmployee.address || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Visa & Labor Tab */}
            {activeTab === "visa" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiCreditCard className="text-green-500" /> Visa Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Visa Type
                      </label>
                      <p className="text-gray-800 font-medium mt-1 capitalize">
                        {currentEmployee.visa_type?.replace("_", " ") || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Visa Number
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.visa_number || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Visa Issued Date
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.visa_issued_date
                          ? formatDate(currentEmployee.visa_issued_date)
                          : "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Visa Expiry Date
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.visa_expiry_date
                          ? formatDate(currentEmployee.visa_expiry_date)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Labor Number
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.labor_number || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Labor Issued Date
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.labor_issued_date
                          ? formatDate(currentEmployee.labor_issued_date)
                          : "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Labor Expiry Date
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.labor_expiry_date
                          ? formatDate(currentEmployee.labor_expiry_date)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EID Tab */}
            {activeTab === "eid" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaIdCard className="text-green-500" /> Emirates ID Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        EID Number
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.eid_number || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        EID Issued Date
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.eid_issued_date
                          ? formatDate(currentEmployee.eid_issued_date)
                          : "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        EID Expiry Date
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.eid_expiry_date
                          ? formatDate(currentEmployee.eid_expiry_date)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information Tab */}
            {activeTab === "contact" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiPhoneCall className="text-green-500" /> Contact Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Company Email
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.company_email || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Personal Email
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.personal_email || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Company Mobile Number
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.company_mobile_number || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Personal Number
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.personal_number || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Other Number
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.other_number || "N/A"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Home Country Number
                      </label>
                      <p className="text-gray-800 font-medium mt-1">
                        {currentEmployee.home_country_number || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FiFileText className="text-green-500" /> Employee Documents
                </h3>

                {/* Avatar/Photo Document */}
                {(currentEmployee.avatar || currentEmployee.avatar_path) && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Profile Photo
                    </h4>
                    <a
                      href={getEmployeePhoto()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <FiDownload /> View Profile Photo
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documentFields.map((doc) => {
                    const documentPath = currentEmployee[doc.key];
                    const hasDocument =
                      documentPath && !currentEmployee[`remove_${doc.key}`];

                    return (
                      <div
                        key={doc.key}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <i
                              className={`${doc.icon} text-green-600 text-lg`}
                            ></i>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800 text-sm">
                              {doc.label}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {hasDocument ? "Uploaded" : "Not Uploaded"}
                            </p>
                          </div>
                        </div>
                        {hasDocument ? (
                          <a
                            href={getDocumentUrl(documentPath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm hover:bg-green-100 transition-colors w-full justify-center"
                          >
                            <FiDownload /> View Document
                          </a>
                        ) : (
                          <div className="text-center py-2 text-gray-400 text-sm">
                            <FiXCircle className="inline mr-1" /> No document
                            uploaded
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDetails;
