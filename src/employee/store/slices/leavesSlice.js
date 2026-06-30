import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../../../utils/apiClient';

// Fetch Employee Leaves
export const fetchEmployeeLeaves = createAsyncThunk(
  "leaves/fetchEmployeeLeaves",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/employee/leaves");
      console.log("Fetched leaves response:", response.data);
      
      if (response.data && response.data.status === "success") {
        // The leaves array is inside data.leaves
        const leavesData = response.data.data?.leaves || [];
        console.log("Leaves data extracted:", leavesData);
        return leavesData;
      } else {
        return rejectWithValue(response.data?.message || "Failed to fetch leaves");
      }
    } catch (error) {
      console.error("Fetch leaves error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch leaves"
      );
    }
  }
);

// Fetch Leave Types
export const fetchLeaveTypes = createAsyncThunk(
  "leaves/fetchLeaveTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/employee/leave-types");
      console.log("Leave types response:", response.data);
      
      if (response.data && response.data.status === "success") {
        return response.data.data || response.data;
      }
      return response.data || [];
    } catch (error) {
      console.error("Fetch leave types error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch leave types"
      );
    }
  }
);

// Fetch Leave Balance for a specific employee
export const fetchLeaveBalance = createAsyncThunk(
  "leaves/fetchLeaveBalance",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      console.log("Current state for leave balance:", state);
      
      let employeeId = null;
      
      // 1. Try from auth.user.employee.id (most reliable)
      if (state.auth?.user?.employee?.id) {
        employeeId = state.auth.user.employee.id;
        console.log("Found employee ID from auth.user.employee.id:", employeeId);
      }
      
      // 2. Try from auth.user.employee_id (if exists)
      if (!employeeId && state.auth?.user?.employee_id) {
        employeeId = state.auth.user.employee_id;
        console.log("Found employee_id from auth.user.employee_id:", employeeId);
      }
      
      // 3. Try from employee slice
      if (!employeeId && state.employee?.currentEmployee?.employee_id) {
        employeeId = state.employee.currentEmployee.employee_id;
        console.log("Found employee_id from employee.currentEmployee.employee_id:", employeeId);
      }
      
      if (!employeeId) {
        console.warn("No employee ID found for fetching leave balance");
        return {};
      }
      
      console.log("Fetching leave balance for employee ID:", employeeId);
      
      const response = await apiClient.get(`/employee/leave-allocations/${employeeId}`);
      console.log("Leave balance response:", response.data);
      
      if (response.data && response.data.status === "success") {
        const data = response.data.data;
        return transformLeaveBalanceData(data);
      } else {
        return rejectWithValue(response.data?.message || "Failed to fetch leave balance");
      }
    } catch (error) {
      console.error("Fetch leave balance error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch leave balance"
      );
    }
  }
);

// Helper function to transform leave balance data
const transformLeaveBalanceData = (data) => {
  const leaveBalances = {};
  
  console.log("Transforming leave balance data:", data);
  
  // Check if we have allocations
  if (data.allocations) {
    const allocations = typeof data.allocations === 'object' && !Array.isArray(data.allocations)
      ? Object.values(data.allocations)
      : data.allocations;
    
    console.log("Allocations to process:", allocations);
    
    // Get leave types from the response
    const leaveTypes = data.leave_types || [];
    
    allocations.forEach(alloc => {
      // Find the leave type name
      const leaveType = leaveTypes.find(lt => lt.id === alloc.leave_type_id);
      const leaveTypeName = leaveType?.name || `Leave Type ${alloc.leave_type_id}`;
      
      // Parse allocated days
      const allocatedDays = parseFloat(alloc.allocated_days) || 0;
      
      // For now, used days is 0 since API doesn't return it
      // We can fetch used days from leave history if needed
      const usedDays = 0;
      
      leaveBalances[leaveTypeName] = {
        id: alloc.leave_type_id,
        allocated: allocatedDays,
        taken: usedDays,
        pending: 0,
        remaining: allocatedDays - usedDays,
        name: leaveTypeName,
        allocated_days: allocatedDays,
        used: usedDays
      };
    });
    
    // Also add leave types that have no allocations (set to 0)
    leaveTypes.forEach(leaveType => {
      if (!leaveBalances[leaveType.name]) {
        leaveBalances[leaveType.name] = {
          id: leaveType.id,
          allocated: 0,
          taken: 0,
          pending: 0,
          remaining: 0,
          name: leaveType.name,
          allocated_days: 0,
          used: 0
        };
      }
    });
  }
  
  // Add total balance
  let totalAllocated = 0;
  let totalTaken = 0;
  Object.values(leaveBalances).forEach(balance => {
    totalAllocated += balance.allocated || 0;
    totalTaken += balance.taken || 0;
  });
  
  leaveBalances.total = {
    allocated: totalAllocated,
    taken: totalTaken,
    pending: 0,
    remaining: totalAllocated - totalTaken
  };
  
  console.log("Processed leave balances:", leaveBalances);
  return leaveBalances;
};

// Store New Leave Request
// Store New Leave Request
export const addLeaveRequest = createAsyncThunk(
  "leaves/storeLeaveRequest",
  async (formData, { rejectWithValue, dispatch, getState }) => {
    try {
      const state = getState();
      
      // Get employee ID from auth state
      let employeeId = state.auth?.user?.employee?.id || 
                       state.auth?.user?.employee_id || 
                       state.employee?.currentEmployee?.employee_id;
      
      if (!employeeId) {
        return rejectWithValue("Employee ID not found");
      }
      
      // Extract data from FormData
      const leaveTypeId = formData.get('leave_type_id');
      const startDate = formData.get('start_date');
      const endDate = formData.get('end_date');
      const reason = formData.get('reason');
      const claimSalary = formData.get('claim_salary') === '1';
      const durationDays = formData.get('duration_days');
      
      // Check if we have a document
      const document = formData.get('document');
      
      // Prepare the payload as JSON (not FormData)
      const payload = {
        employee_id: parseInt(employeeId),
        leave_type_id: parseInt(leaveTypeId),
        start_date: startDate,
        end_date: endDate,
        reason: reason,
        claim_salary: claimSalary,
      };
      
      // Only add document if it exists
      if (document && document.size > 0) {
        // If there's a document, we need to use FormData
        const formDataWithDoc = new FormData();
        formDataWithDoc.append('employee_id', employeeId);
        formDataWithDoc.append('leave_type_id', leaveTypeId);
        formDataWithDoc.append('start_date', startDate);
        formDataWithDoc.append('end_date', endDate);
        formDataWithDoc.append('reason', reason);
        formDataWithDoc.append('claim_salary', claimSalary ? '1' : '0');
        formDataWithDoc.append('document', document);
        
        const response = await apiClient.post("/employee/leaves", formDataWithDoc, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log("Store leave response (with document):", response.data);
        
        if (response.data && response.data.status === "success") {
          await dispatch(fetchLeaveBalance());
          return response.data.data;
        } else {
          return rejectWithValue(response.data?.message || "Failed to submit leave request");
        }
      }
      
      // If no document, send as JSON
      console.log("Submitting leave request with payload:", payload);
      
      const response = await apiClient.post("/employee/leaves", payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log("Store leave response:", response.data);
      
      if (response.data && response.data.status === "success") {
        // Refresh balance after successful submission
        await dispatch(fetchLeaveBalance());
        return response.data.data;
      } else {
        return rejectWithValue(response.data?.message || "Failed to submit leave request");
      }
    } catch (error) {
      console.error("Store leave error:", error);
      // Handle validation errors
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat().join(', ');
        return rejectWithValue(errorMessages);
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to submit leave request"
      );
    }
  }
);

// Calculate leave balances
export const calculateLeaveBalances = createAsyncThunk(
  "leaves/calculateLeaveBalances",
  async (_, { getState }) => {
    const state = getState();
    return state.leaves.leaveBalances;
  }
);

const initialState = {
  leaves: [],
  leaveTypes: [],
  leaveBalances: {
    total: {
      allocated: 0,
      taken: 0,
      pending: 0,
      remaining: 0
    }
  },
  filter: {
    status: 'all',
    search: '',
  },
  pagination: {
    currentPage: 1,
    perPage: 10,
  },
  loading: false,
  error: null,
  submitting: false,
};

const leavesSlice = createSlice({
  name: 'leaves',
  initialState,
  reducers: {
    setLeaveFilter: (state, action) => {
      state.filter.status = action.payload.status;
      state.filter.search = action.payload.search || '';
      state.pagination.currentPage = 1;
    },
    setLeavePagination: (state, action) => {
      state.pagination.currentPage = action.payload.currentPage;
      state.pagination.perPage = action.payload.perPage;
    },
    clearLeaveError: (state) => {
      state.error = null;
    },
    updateLeaveBalance: (state, action) => {
      state.leaveBalances = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Employee Leaves
      .addCase(fetchEmployeeLeaves.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves = action.payload;
        state.error = null;
      })
      .addCase(fetchEmployeeLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Leave Types
      .addCase(fetchLeaveTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaveTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.leaveTypes = action.payload;
        state.error = null;
      })
      .addCase(fetchLeaveTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Leave Balance
      .addCase(fetchLeaveBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaveBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.leaveBalances = action.payload;
        state.error = null;
      })
      .addCase(fetchLeaveBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Store Leave Request
      .addCase(addLeaveRequest.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(addLeaveRequest.fulfilled, (state, action) => {
        state.submitting = false;
        state.leaves.unshift(action.payload);
        state.error = null;
      })
      .addCase(addLeaveRequest.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      
      // Calculate Leave Balances
      .addCase(calculateLeaveBalances.pending, (state) => {
        state.loading = true;
      })
      .addCase(calculateLeaveBalances.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(calculateLeaveBalances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setLeaveFilter, setLeavePagination, clearLeaveError, updateLeaveBalance } = leavesSlice.actions;
export default leavesSlice.reducer;