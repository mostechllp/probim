import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import SearchBar from "../components/common/SearchBar";
import EntriesSelector from "../components/common/EntriesSelector";
import { showToast } from "../../components/common/Toast";
import {
  fetchOrganizations,
  deleteOrganization,
} from "../store/slices/organizationSlice";
import Pagination from "../components/common/Paginations";
import ConfirmModal from "../components/common/ConfirmModal";

const Organizations = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { organizations, loading } = useSelector(
    (state) => state.organizations || {},
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchOrganizations());
  }, [dispatch]);

  // Helper function to get full logo URL
  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    
    // If it's already a full URL, return it
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      return logoPath;
    }
    
    // Get base URL from environment or window location
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
    
    // Remove leading slash if present and construct full URL
    const cleanPath = logoPath.startsWith('/') ? logoPath.slice(1) : logoPath;
    return `${baseUrl}/storage/${cleanPath}`;
  };

  // Helper function to check if organization has multiple companies
  const hasMultipleCompanies = (org) => {
    // Check both possible field names and formats
    if (org.has_multiple_companies !== undefined) {
      return org.has_multiple_companies === true || org.has_multiple_companies === 1 || org.has_multiple_companies === "1";
    }
    if (org.multi_company !== undefined) {
      return org.multi_company === "Yes" || org.multi_company === true || org.multi_company === 1;
    }
    return false;
  };

  const hasOrganization = organizations && organizations.length > 0;

  const getFilteredOrganizations = () => {
    let filtered = organizations || [];
    if (searchTerm) {
      filtered = filtered.filter(
        (org) =>
          (org.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (org.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (org.phone || "").includes(searchTerm),
      );
    }
    return filtered;
  };

  const filteredOrganizations = getFilteredOrganizations();
  const totalFiltered = filteredOrganizations.length;
  const totalPages = Math.ceil(totalFiltered / perPage);
  const start = (currentPage - 1) * perPage;
  const pageOrganizations = filteredOrganizations.slice(start, start + perPage);

  const handleDeleteClick = (org) => {
    setSelectedOrg(org);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedOrg) return;

    setDeleteLoading(true);
    const result = await dispatch(deleteOrganization(selectedOrg.id));

    if (deleteOrganization.fulfilled.match(result)) {
      showToast(`${selectedOrg.name} deleted successfully`, "success");
    } else {
      showToast("Failed to delete organization", "error");
    }

    setDeleteLoading(false);
    setConfirmOpen(false);
    setSelectedOrg(null);
  };

  const handleManageCompanies = (org) => {
    navigate(`/admin/organizations/${org.id}/companies`, {
      state: { organization: org },
    });
  };

  return (
    <div className="w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 md:mb-6">
        <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent">
          Organization Directory
        </h2>
        <div className="flex gap-2">
          <Link
            to="/admin/designations"
            className="bg-green-500 hover:bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <i className="fas fa-briefcase"></i>
            <span>Designations</span>
          </Link>
          <Link
            to="/admin/departments"
            className="bg-green-500 hover:bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <i className="fas fa-diagram-project"></i>
            <span>Departments</span>
          </Link>
        </div>
      </div>

      {/* No Organization State - Show Add Button */}
      {!hasOrganization ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 md:p-12 text-center shadow-soft">
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-building text-3xl text-gray-400"></i>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              No Organization Found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Get started by creating your first organization
            </p>
            <Link
              to="/admin/organizations/add-organization"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full text-sm font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <i className="fas fa-plus-circle"></i> Add Organization
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="stats-grid grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-5 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-5 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex justify-between items-start mb-2 md:mb-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <i className="fas fa-building text-green-600 dark:text-green-400 text-base md:text-xl"></i>
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-green-600 dark:text-green-400">
                {organizations?.length || 0}
              </div>
              <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                Total Organizations
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-5 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex justify-between items-start mb-2 md:mb-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <i className="fas fa-chart-line text-blue-600 dark:text-blue-400 text-base md:text-xl"></i>
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                Active
              </div>
              <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                Organization Status
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-5 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
              <div className="flex justify-between items-start mb-2 md:mb-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <i className="fas fa-users text-purple-600 dark:text-purple-400 text-base md:text-xl"></i>
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                Multi-Company
              </div>
              <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                Supporting Subsidiaries
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-5">
            <EntriesSelector value={perPage} onChange={setPerPage} />
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by name, email..."
              />
            </div>
          </div>

          {/* Organizations Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-soft">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <div className="min-w-[800px] md:min-w-0">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Logo
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Organization Name
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Phone
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Email
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Address
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Created At
                      </th>
                      <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageOrganizations.map((org) => {
                      const logoUrl = getLogoUrl(org.logo);
                      const isMultiCompany = hasMultipleCompanies(org);
                      
                      return (
                        <tr
                          key={org.id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-3 md:px-4 py-2 md:py-3">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={org.name}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-xl object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<div class="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white"><i class="fas fa-building text-sm md:text-lg"></i></div>';
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white">
                                <i className="fas fa-building text-sm md:text-lg"></i>
                              </div>
                            )}
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {org.name}
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            {org.phone}
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            {org.email}
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            {org.address || '-'}
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            {org.createdAt}
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3">
                            <div className="flex gap-1 md:gap-2">
                              {/* Only show Manage Companies button if organization has multiple companies */}
                              {isMultiCompany && (
                                <button
                                  onClick={() => handleManageCompanies(org)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500 transition-colors"
                                  title="Manage Companies"
                                >
                                  <i className="fas fa-building text-xs md:text-sm"></i>
                                </button>
                              )}
                              <Link
                                to={`/admin/organizations/edit-organization/${org.id}`}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-amber-500 transition-colors"
                                title="Edit"
                              >
                                <i className="fas fa-edit text-xs md:text-sm"></i>
                              </Link>
                              <button
                                onClick={() => handleDeleteClick(org)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 transition-colors"
                                title="Delete"
                              >
                                <i className="fas fa-trash text-xs md:text-sm"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {pageOrganizations.length === 0 && (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                        >
                          No organizations found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {organizations?.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalFiltered}
              itemsPerPage={perPage}
            />
          )}
        </>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Organization"
        message={`Are you sure you want to delete ${selectedOrg?.name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
      />
    </div>
  );
};

export default Organizations;