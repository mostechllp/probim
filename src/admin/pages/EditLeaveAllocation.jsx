import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { showToast } from '../../components/common/Toast';
import { fetchLeaveTypes, fetchLeaveBalances, updateLeaveAllocation } from '@admin/store/slices/LeaveSlice';

const EditLeaveAllocation = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { leaveTypes = [], leaveAllocations = [], loading } = useSelector((state) => state.leaves || {});
  const [allocations, setAllocations] = useState({});
  const [updating, setUpdating] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState({});
  const [photoError, setPhotoError] = useState(false);
  const [fetchingBalances, setFetchingBalances] = useState(true);
  const { user } = useSelector((state) => state.auth || {});
  const routePrefix = (user?.type === "employee" || user?.type === "hr" || user?.type === "manager" || user?.type === "team_lead") ? "/employee" : "/admin";
  const leavesUrl = (user?.type === "employee" || user?.type === "hr" || user?.type === "manager" || user?.type === "team_lead") ? "/employee/leave-management" : "/admin/leaves";
  
  // Get employee data from leaveAllocations
  const employee = leaveAllocations.find(emp => String(emp.employee_id) === String(id));
  
  console.log("Employee from leaveAllocations:", employee);

  // Helper function to get employee photo URL
  const getEmployeePhoto = () => {
    if (!employee) return null;
    
    const photoValue = employee.avatar;
    
    if (!photoValue || photoError) return null;
    
    if (typeof photoValue === "string") {
      if (photoValue.startsWith("data:")) return photoValue;
      if (photoValue.startsWith("http")) return photoValue;
      
      const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";
      if (photoValue.startsWith("/storage/")) return `${baseUrl}${photoValue}`;
      return `${baseUrl}/storage/${photoValue}`;
    }
    
    return null;
  };

  // Fetch leave types only
  useEffect(() => {
    if (id) {
      dispatch(fetchLeaveTypes());
    }
  }, [dispatch, id]);

  // Fetch leave balances for this specific employee
  useEffect(() => {
    const fetchBalances = async () => {
      if (id && leaveTypes.length > 0) {
        setFetchingBalances(true);
        try {
          const result = await dispatch(fetchLeaveBalances({ employee_id: parseInt(id) })).unwrap();
          console.log("Fetched leave balances:", result);
          
          // Initialize allocations object
          const initialAllocs = {};
          const balances = {};
          
          // Handle different response structures
          let allocationsData = [];
          
          if (result && result.allocations) {
            allocationsData = Object.values(result.allocations);
          } else if (result && Array.isArray(result)) {
            allocationsData = result;
          } else if (result && result.data && Array.isArray(result.data)) {
            allocationsData = result.data;
          }
          
          console.log("Processed allocations data:", allocationsData);
          
          // Populate allocations and balances
          allocationsData.forEach(alloc => {
            const leaveTypeId = alloc.leave_type_id || alloc.leave_type?.id;
            if (leaveTypeId) {
              const allocatedDays = parseFloat(alloc.allocated_days || alloc.allocated || 0);
              const usedDays = parseFloat(alloc.used || 0);
              
              initialAllocs[leaveTypeId] = allocatedDays;
              
              balances[leaveTypeId] = {
                allocated: allocatedDays,
                used: usedDays,
                remaining: allocatedDays - usedDays
              };
            }
          });
          
          // Set default 0 for leave types without allocations
          leaveTypes.forEach(type => {
            if (!initialAllocs[type.id]) {
              initialAllocs[type.id] = 0;
            }
          });
          
          console.log("Final allocations to display:", initialAllocs);
          console.log("Final balances:", balances);
          
          setAllocations(initialAllocs);
          setLeaveBalances(balances);
        } catch (error) {
          console.error("Failed to fetch leave balances:", error);
          // Initialize with zeros if fetch fails
          const defaultAllocs = {};
          leaveTypes.forEach(type => {
            defaultAllocs[type.id] = 0;
          });
          setAllocations(defaultAllocs);
        } finally {
          setFetchingBalances(false);
        }
      }
    };
    
    fetchBalances();
  }, [dispatch, id, leaveTypes]);

  const handleAllocationChange = (leaveTypeId, value) => {
    const numValue = parseInt(value) || 0;
    if (numValue < 0) {
      showToast('Allocated days cannot be negative', 'error');
      return;
    }
    setAllocations(prev => ({ ...prev, [leaveTypeId]: numValue }));
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      // Prepare allocations object with leave_type_id as key
      const allocationsData = {};
      Object.entries(allocations).forEach(([leaveTypeId, allocated]) => {
        allocationsData[leaveTypeId] = allocated;
      });
      
      console.log("Saving allocations:", allocationsData);
      
      // Send single request with all allocations
      const result = await dispatch(updateLeaveAllocation({
        employee_id: parseInt(id),
        allocations: allocationsData
      })).unwrap();
      
      if (result) {
        showToast('Leave allocations updated successfully', 'success');
        navigate(`${routePrefix}/leaves/allocations`);
      }
    } catch (error) {
      console.error("Update error:", error);
      showToast(error?.message || 'Failed to update allocations', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getCurrentBalance = (leaveTypeId) => {
    const balance = leaveBalances[leaveTypeId];
    if (balance) {
      return balance.remaining;
    }
    return allocations[leaveTypeId] || 0;
  };

  const getUsedDays = (leaveTypeId) => {
    const balance = leaveBalances[leaveTypeId];
    return balance?.used || 0;
  };

  // Show loading state while fetching data
  if (loading || fetchingBalances || !employee || leaveTypes.length === 0) {
    return (
      <div className="w-full px-4 md:px-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  const photoUrl = getEmployeePhoto();
  const employeeName = employee.name || "";
  const employeeInitials = employeeName.split(' ').map(word => word.charAt(0)).join('').toUpperCase() || '?';

  return (
    <div className="w-full px-4 md:px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-6 flex-wrap">
        <Link to={leavesUrl} className="text-green-500 hover:text-green-600 font-medium">
          Leaves
        </Link>
        <i className="fas fa-chevron-right text-gray-400 text-[10px] md:text-xs"></i>
        <Link to={`${routePrefix}/leaves/allocations`} className="text-green-500 hover:text-green-600 font-medium">
          Leave Allocations
        </Link>
        <i className="fas fa-chevron-right text-gray-400 text-[10px] md:text-xs"></i>
        <span className="text-gray-500 dark:text-gray-400">Manage Allocation</span>
      </div>

      {/* Page Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-green-600 dark:from-gray-200 dark:to-green-400 bg-clip-text text-transparent">
          <i className="fas fa-chart-line mr-2"></i> Manage Leave Allocation
        </h2>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Allocate leaves for the current year
        </p>
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Employee Details */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            <i className="fas fa-user-circle text-green-500 text-sm"></i>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Employee Information
            </h3>
          </div>
          
          {/* Profile Section with Photo */}
          <div className="flex items-center gap-3 mb-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={employeeName}
                className="w-12 h-12 rounded-full object-cover border-2 border-green-500 shadow-sm"
                onError={() => setPhotoError(true)}
              />
            ) : null}
            
            {(!photoUrl || photoError) && (
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm">
                {employeeInitials}
              </div>
            )}
            
            <div>
              <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200">
                {employeeName}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {employee.designation || 'N/A'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {employee.department || 'N/A'}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-xs text-gray-500">Employee ID</span>
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                {employee.employee_id || '-'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500">Company</span>
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                {employee.company || '-'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500">Email</span>
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px]">
                {employee.email || '-'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500">Joining Date</span>
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                {employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : '-'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500">Year</span>
              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Leave Allocation Form */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 mb-4 border-b border-gray-200 dark:border-gray-700">
            <i className="fas fa-calendar-alt text-green-500 text-sm"></i>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Allocate Leaves for {new Date().getFullYear()}
            </h3>
          </div>

          <div className="space-y-3">
            {leaveTypes.map((type) => {
              const getIcon = () => {
                if (type.name === 'Sick Leave') return 'fas fa-thermometer-half';
                if (type.name === 'Casual Leave') return 'fas fa-umbrella-beach';
                if (type.name === 'Annual Leave') return 'fas fa-suitcase';
                return 'fas fa-calendar-alt';
              };
              
              const currentAllocation = allocations[type.id] || 0;
              const usedDays = getUsedDays(type.id);
              const balance = getCurrentBalance(type.id);
              
              return (
                <div key={type.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 w-1/3">
                    <i className={`${getIcon()} text-green-500 text-xs w-4`}></i>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {type.name}
                    </span>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      value={currentAllocation}
                      onChange={(e) => handleAllocationChange(type.id, e.target.value)}
                      min="0"
                      className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20"
                      placeholder="Days"
                    />
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-xs text-gray-500">
                      Balance: <span className="font-medium text-green-600">{balance}</span>
                    </span>
                  </div>
                  {usedDays > 0 && (
                    <div className="w-16 text-right">
                      <span className="text-xs text-gray-400">
                        Used: {usedDays}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              to={`${routePrefix}/leaves/allocations`}
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={updating}
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-all disabled:opacity-70 flex items-center gap-1"
            >
              {updating ? (
                <><i className="fas fa-spinner fa-spin text-xs"></i> Saving...</>
              ) : (
                <><i className="fas fa-save text-xs"></i> Save</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditLeaveAllocation;