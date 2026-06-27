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
    type: leave.leave_type?.name || leave.leave_type || leave.type || "-",
    leave_type_id: leave.leave_type_id || leave.leave_type?.id,
    from_date: leave.start_date || leave.from_date || leave.fromDate,
    to_date: leave.end_date || leave.to_date || leave.toDate,
    days: leave.duration_days || leave.number_of_days || leave.days || 0,
    claim_salary:
      leave.claim_salary === 1 || leave.claim_salary === "Yes" ? "Yes" : "No",
    document: leave.document_path || leave.document || leave.doc,
    reason: leave.reason || "-",
    status: (leave.status || "pending").toLowerCase(),
    processed_by: leave.processed_by || leave.processedBy || "-",
    created_at: leave.created_at,
    updated_at: leave.updated_at,
    rejection_reason: leave.rejection_reason || null,
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

      // Transform each leave to a consistent format
      const transformedLeaves = leavesData.map(transformAdminLeaveData);

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
      const response = await apiClient.get(`/admin/leave-allocations/${employee_id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch leave balances");
    }
  }
);

export const fetchLeaveAllocations = createAsyncThunk(
  "leaves/fetchAllocations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/leave-allocations");
      return response.data.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch leave allocations");
    }
  }
);

export const updateLeaveAllocation = createAsyncThunk(
  "leaves/updateAllocation",
  async ({ employee_id, allocations }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post("/admin/leave-allocations", {
        employee_id,
        allocations
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update allocation");
    }
  }
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
      
      // Return the full error for debugging
      return rejectWithValue({
        message: err.response?.data?.message || "Failed to add leave type",
        data: err.response?.data,
        status: err.response?.status
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
      });
  },
});

export const { clearError, clearCurrentLeave } = leaveSlice.actions;
export default leaveSlice.reducer;
