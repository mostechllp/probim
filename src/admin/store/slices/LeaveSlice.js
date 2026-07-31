// src/admin/store/slices/LeaveSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

// Helper function to transform leave data from admin API
const transformAdminLeaveData = (leave) => {
  // Handle different possible data structures
  return {
    id: leave.id,
    employee_name:
      leave.employee?.name ||
      leave.employee?.full_name ||
      `${leave.employee?.first_name || ""} ${leave.employee?.last_name || ""}`.trim() ||
      leave.employee_name ||
      "-",
    employee_id: leave.employee_id || leave.employee?.id,
    employee: leave.employee || null, // ✅ Keep full employee object
    type: leave.leave_type?.name || leave.leave_type || leave.type || "-",
    leave_type_id: leave.leave_type_id || leave.leave_type?.id,
    leave_type: leave.leave_type || null, // ✅ Keep full leave_type object
    from_date: leave.start_date || leave.from_date || leave.fromDate,
    to_date: leave.end_date || leave.to_date || leave.toDate,
    start_date: leave.start_date || leave.from_date || leave.fromDate,
    end_date: leave.end_date || leave.to_date || leave.toDate,
    days: leave.duration_days || leave.number_of_days || leave.days || 0,
    duration_days:
      leave.duration_days || leave.number_of_days || leave.days || 0,
    claim_salary:
      leave.claim_salary === 1 || leave.claim_salary === "Yes" ? "Yes" : "No",
    claim_salary_raw: leave.claim_salary,
    document: leave.document_path || leave.document || leave.doc,
    document_path: leave.document_path || leave.document || leave.doc,
    reason: leave.reason || "-",
    status: (leave.status || "pending").toLowerCase(),
    processed_by: leave.processed_by || leave.processedBy || "-",
    approver: leave.approver || null, // ✅ Keep approver object
    created_at: leave.created_at,
    updated_at: leave.updated_at,
    rejection_reason: leave.rejection_reason || null,
    // ✅ IMPORTANT: Preserve the applied_by data
    applied_by: leave.applied_by || null,
    // Keep raw data for debugging
    raw: leave,
  };
};

// Async thunks for admin leave management
export const fetchLeaves = createAsyncThunk(
  "leaves/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/leaves");

      let leavesData = [];

      // Handle different response structures
      if (response.data?.status === "success") {
        leavesData = response.data.data?.data || [];
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        leavesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        leavesData = response.data;
      } else if (response.data?.leaves && Array.isArray(response.data.leaves)) {
        leavesData = response.data.leaves;
      } else {
        leavesData = [];
      }

      console.log("Raw leaves data:", leavesData); // Debug log

      // Transform each leave to a consistent format
      const transformedLeaves = leavesData.map(transformAdminLeaveData);

      console.log("Transformed leaves:", transformedLeaves); // Debug log

      return transformedLeaves;
    } catch (error) {
      console.error("Fetch leaves error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch leave requests",
      );
    }
  },
);

export const fetchLeaveById = createAsyncThunk(
  "leaves/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/admin/leaves/${id}`);

      let leaveData = response.data?.data || response.data;
      return transformAdminLeaveData(leaveData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch leave request",
      );
    }
  },
);

export const updateLeaveStatus = createAsyncThunk(
  "leaves/updateStatus",
  async (
    { id, status, processedBy, rejection_reason },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiClient.post(`/admin/leaves/${id}/status`, {
        status,
        processed_by: processedBy,
        rejection_reason: rejection_reason || null,
      });

      let updatedLeave = response.data?.data || response.data;
      return transformAdminLeaveData(updatedLeave);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update leave status",
      );
    }
  },
);

export const fetchLeaveBalances = createAsyncThunk(
  "leaves/fetchBalances",
  async ({ employee_id }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        `/admin/leave-allocations/${employee_id}`,
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch leave balances",
      );
    }
  },
);

export const fetchLeaveAllocations = createAsyncThunk(
  "leaves/fetchAllocations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/leave-allocations");
      console.log("Leave allocations response:", response.data);

      if (response.data?.data?.employees) {
        return response.data.data.employees;
      }
      return response.data.data || response.data;
    } catch (error) {
      console.error("Fetch leave allocations error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch leave allocations",
      );
    }
  },
);

export const updateLeaveAllocation = createAsyncThunk(
  "leaves/updateAllocation",
  async ({ employee_id, allocations }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        `/admin/leave-allocations/${employee_id}`,
        {
          allocations,
        },
      );
      return response.data.data;
    } catch (error) {
      console.error("Update allocation error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to update allocation",
      );
    }
  },
);

// Leave Types
export const fetchLeaveTypes = createAsyncThunk(
  "leaves/fetchTypes",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/admin/leave-types");
      return res.data.data || res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch leave types",
      );
    }
  },
);

export const fetchLeaveTypeById = createAsyncThunk(
  "leaves/fetchTypeById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/admin/leave-types/${id}`);
      return res.data.data || res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch leave type",
      );
    }
  },
);

export const addLeaveType = createAsyncThunk(
  "leaves/addType",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/admin/leave-types", data);
      return res.data.data || res.data;
    } catch (err) {
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to add leave type",
        data: err.response?.data,
        status: err.response?.status,
      });
    }
  },
);

export const updateLeaveType = createAsyncThunk(
  "leaves/updateType",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiClient.put(`/admin/leave-types/${id}`, data);
      return res.data.data || res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update leave type",
      );
    }
  },
);

export const deleteLeaveType = createAsyncThunk(
  "leaves/deleteType",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/admin/leave-types/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete leave type",
      );
    }
  },
);

export const updateLeaveTypeStatus = createAsyncThunk(
  "leaves/updateTypeStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/admin/leave-types/${id}/status`, {
        status,
      });
      return res.data.data || res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update status",
      );
    }
  },
);

export const toggleLeaveTypeStatus = createAsyncThunk(
  "leaves/toggleStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/admin/leave-types/${id}/status`, {
        status,
      });
      return response.data.data || response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data);
    }
  },
);

export const updateLeaveRequest = createAsyncThunk(
  "leaves/updateRequest",
  async ({ id, formData }, { rejectWithValue, dispatch }) => {
    try {
      // Check if formData is FormData or plain object
      let payload;
      let headers = {};

      if (formData instanceof FormData) {
        payload = formData;
        headers = { "Content-Type": "multipart/form-data" };
      } else {
        payload = formData;
        headers = { "Content-Type": "application/json" };
      }

      console.log(`Admin updating leave request ${id} with payload:`, payload);

      const response = await apiClient.post(`/admin/leaves/${id}`, payload, {
        headers,
      });
      console.log("Admin update leave response:", response.data);

      if (response.data && response.data.status === "success") {
        // Refresh leaves after successful update
        await dispatch(fetchLeaves());
        return transformAdminLeaveData(response.data.data || response.data);
      } else {
        return rejectWithValue(
          response.data?.message || "Failed to update leave request",
        );
      }
    } catch (error) {
      console.error("Admin update leave error:", error);
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors)
          .flat()
          .join(", ");
        return rejectWithValue(errorMessages);
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to update leave request",
      );
    }
  },
);

// Delete Leave Request (Admin)
export const deleteLeaveRequest = createAsyncThunk(
  "leaves/deleteRequest",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      console.log(`Admin deleting leave request ${id}`);

      const response = await apiClient.delete(`/admin/leaves/${id}`);
      console.log("Admin delete leave response:", response.data);

      if (response.data && response.data.status === "success") {
        // Refresh leaves after successful deletion
        await dispatch(fetchLeaves());
        return id;
      } else {
        return rejectWithValue(
          response.data?.message || "Failed to delete leave request",
        );
      }
    } catch (error) {
      console.error("Admin delete leave error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete leave request",
      );
    }
  },
);

const leaveSlice = createSlice({
  name: "leaves",
  initialState: {
    leaves: [],
    currentLeave: null,
    leaveTypes: [],
    leaveAllocations: [],
    loading: false,
    error: null,
    totalCount: 0,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentLeave: (state) => {
      state.currentLeave = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch leaves
      .addCase(fetchLeaves.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves = action.payload;
        state.totalCount = action.payload?.length || 0;
      })
      .addCase(fetchLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        console.error("Fetch leaves rejected:", state.error);
      })

      // Fetch leave by ID
      .addCase(fetchLeaveById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaveById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLeave = action.payload;
      })
      .addCase(fetchLeaveById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Update leave status
      .addCase(updateLeaveStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLeaveStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedLeave = action.payload;
        const index = state.leaves.findIndex((l) => l.id === updatedLeave.id);
        if (index !== -1) {
          state.leaves[index] = updatedLeave;
        }
        if (state.currentLeave?.id === updatedLeave.id) {
          state.currentLeave = updatedLeave;
        }
      })
      .addCase(updateLeaveStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Fetch leave allocations (admin list)
      .addCase(fetchLeaveAllocations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaveAllocations.fulfilled, (state, action) => {
        state.loading = false;
        state.leaveAllocations = action.payload || [];
      })
      .addCase(fetchLeaveAllocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Fetch leave types
      .addCase(fetchLeaveTypes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLeaveTypes.fulfilled, (state, action) => {
        state.loading = false;
        const types = Array.isArray(action.payload) ? action.payload : [];
        state.leaveTypes = types.map((type) => ({
          id: type.id,
          name: type.name,
          status: type.status === 1,
          raw: type,
        }));
      })
      .addCase(fetchLeaveTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add leave type
      .addCase(addLeaveType.fulfilled, (state, action) => {
        const type = action.payload;
        state.leaveTypes.push({
          id: type.id,
          name: type.name,
          status: type.status === 1,
          raw: type,
        });
      })

      // Update leave type
      .addCase(updateLeaveType.fulfilled, (state, action) => {
        const updatedType = action.payload;
        const index = state.leaveTypes.findIndex(
          (t) => t.id === updatedType.id,
        );
        if (index !== -1) {
          state.leaveTypes[index] = {
            id: updatedType.id,
            name: updatedType.name,
            status: updatedType.status === 1,
            raw: updatedType,
          };
        }
      })

      // Delete leave type
      .addCase(deleteLeaveType.fulfilled, (state, action) => {
        state.leaveTypes = state.leaveTypes.filter(
          (t) => t.id !== action.payload,
        );
      })

      // Update leave type status
      .addCase(updateLeaveTypeStatus.fulfilled, (state, action) => {
        const updatedType = action.payload;
        const index = state.leaveTypes.findIndex(
          (t) => t.id === updatedType.id,
        );
        if (index !== -1) {
          state.leaveTypes[index].status = updatedType.status === 1;
          state.leaveTypes[index].raw = updatedType;
        }
      })

      .addCase(toggleLeaveTypeStatus.fulfilled, (state, action) => {
        const updatedType = action.payload;
        const index = state.leaveTypes.findIndex(
          (t) => t.id === updatedType.id,
        );
        if (index !== -1) {
          state.leaveTypes[index].status = updatedType.status === 1;
        }
      })
      .addCase(updateLeaveRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLeaveRequest.fulfilled, (state, action) => {
        state.loading = false;
        const updatedLeave = action.payload;
        const index = state.leaves.findIndex((l) => l.id === updatedLeave.id);
        if (index !== -1) {
          state.leaves[index] = updatedLeave;
        }
        if (state.currentLeave?.id === updatedLeave.id) {
          state.currentLeave = updatedLeave;
        }
      })
      .addCase(updateLeaveRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Delete Leave Request
      .addCase(deleteLeaveRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteLeaveRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves = state.leaves.filter(
          (leave) => leave.id !== action.payload,
        );
        if (state.currentLeave?.id === action.payload) {
          state.currentLeave = null;
        }
      })
      .addCase(deleteLeaveRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearError, clearCurrentLeave } = leaveSlice.actions;
export default leaveSlice.reducer;
