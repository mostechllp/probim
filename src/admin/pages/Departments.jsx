import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SearchBar from "../components/common/SearchBar";
import EntriesSelector from "../components/common/EntriesSelector";
import Pagination from "../components/common/Paginations";
import { showToast } from "../../components/common/Toast";
import {
  fetchDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  clearError,
} from "../store/slices/departmentSlice";
import DepartmentModal from "../components/department/DepartmentModal";
import ConfirmModal from "../components/common/ConfirmModal";

const Departments = () => {
  const dispatch = useDispatch();
  const { departments, loading, error } = useSelector(
    (state) => state.departments || {},
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const getFilteredDepartments = () => {
    let filtered = [...(departments || [])]; // Create a copy

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((dept) =>
        (dept.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Sort by id in descending order (newest first)
    filtered.sort((a, b) => {
      // If using numeric IDs
      if (a.id && b.id) {
        return b.id - a.id;
      }
      return 0;
    });

    return filtered;
  };

  const filteredDepartments = getFilteredDepartments();
  const totalFiltered = filteredDepartments.length;
  const totalPages = Math.ceil(totalFiltered / perPage);
  const start = (currentPage - 1) * perPage;
  const pageDepartments = filteredDepartments.slice(start, start + perPage);

  const handleAddDepartment = async (data) => {
    setModalLoading(true);
    try {
      const result = await dispatch(addDepartment(data));
      if (addDepartment.fulfilled.match(result)) {
        showToast("Department added successfully", "success");
        setIsAddModalOpen(false);
      } else {
        showToast(result.payload || "Failed to add department", "error");
      }
    } catch (error) {
      showToast("An error occurred", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditDepartment = async (data) => {
    setModalLoading(true);
    try {
      const result = await dispatch(
        updateDepartment({
          id: selectedDepartment.id,
          data: data,
        }),
      );
      if (updateDepartment.fulfilled.match(result)) {
        showToast("Department updated successfully", "success");
        setIsEditModalOpen(false);
        setSelectedDepartment(null);
      } else {
        showToast(result.payload || "Failed to update department", "error");
      }
    } catch (error) {
      showToast("An error occurred", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteDepartment = async () => {
    setModalLoading(true);
    try {
      const result = await dispatch(deleteDepartment(selectedDepartment.id));
      if (deleteDepartment.fulfilled.match(result)) {
        showToast(`${selectedDepartment.name} deleted successfully`, "success");
        setIsDeleteModalOpen(false);
        setSelectedDepartment(null);
      } else {
        showToast(result.payload || "Failed to delete department", "error");
      }
    } catch (error) {
      showToast("An error occurred", error);
    } finally {
      setModalLoading(false);
    }
  };

  const openEditModal = (department) => {
    setSelectedDepartment(department);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (department) => {
    setSelectedDepartment(department);
    setIsDeleteModalOpen(true);
  };

  const totalDepartments = departments?.length || 0;

  return (
    <div className="w-full overflow-x-hidden">
      <main className="content px-4 py-4 md:px-6 md:py-6 w-full overflow-x-hidden">
        {/* Stats Cards */}
        <div className="stats-grid grid grid-cols-2 sm:grid-cols-2 gap-3 md:gap-5 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-5 border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-0.5 hover:shadow-soft">
            <div className="flex justify-between items-start mb-2 md:mb-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <i className="fas fa-building text-green-600 dark:text-green-400 text-base md:text-xl"></i>
              </div>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold text-green-600 dark:text-green-400">
              {totalDepartments}
            </div>
            <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
              Total Departments
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
              Department Status
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-4 md:mb-6">
          <h2 className="text-lg md:text-2xl font-bold gradient-heading bg-clip-text text-transparent">
            Department
          </h2>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-5">
          <EntriesSelector value={perPage} onChange={setPerPage} />
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by department..."
            />
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              <i className="fas fa-plus-circle"></i> Add Department
            </button>
          </div>
        </div>

        {/* Departments Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto shadow-soft">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="min-w-[600px] md:min-w-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Sl.No.
                    </th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Department Name
                    </th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Created At
                    </th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Updated At
                    </th>
                    <th className="px-3 md:px-4 py-2 md:py-3 text-left text-[10px] md:text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageDepartments.map((department, idx) => (
                    <tr
                      key={department.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {start + idx + 1}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {department.name}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {department.createdAt}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                        {department.updatedAt}
                      </td>
                      <td className="px-3 md:px-4 py-2 md:py-3">
                        <div className="flex gap-1 md:gap-2">
                          <button
                            onClick={() => openEditModal(department)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-amber-500 transition-colors"
                            title="Edit"
                          >
                            <i className="fas fa-edit text-xs md:text-sm"></i>
                          </button>
                          {/* <button
                            onClick={() => openDeleteModal(department)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 transition-colors"
                            title="Delete"
                          >
                            <i className="fas fa-trash text-xs md:text-sm"></i>
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pageDepartments.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        {searchTerm
                          ? "No departments found matching your search"
                          : "No departments found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalDepartments > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalFiltered}
            itemsPerPage={perPage}
          />
        )}
      </main>

      {/* Modals */}
      <DepartmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        // No editingDepartment prop for add mode
      />

      {/* Edit Department Modal */}
      <DepartmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDepartment(null);
        }}
        editingDepartment={selectedDepartment} // 
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDepartment(null);
        }}
        onConfirm={handleDeleteDepartment}
        departmentName={selectedDepartment?.name}
        isLoading={modalLoading}
      />
    </div>
  );
};

export default Departments;
