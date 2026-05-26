import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

export const fetchEmployees = createAsyncThunk(
  "employees/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/employees");
      return response.data;
    } catch (error) {
      console.error("FETCH EMPLOYEES ERROR:", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch employees",
      );
    }
  },
);

// In your addEmployee async thunk
export const addEmployee = createAsyncThunk(
  "employees/add",
  async (employeeData, { rejectWithValue }) => {
    try {
      console.log("========== API REQUEST DEBUG ==========");
      console.log("Sending to backend:", employeeData);
      
      // Log FormData contents if it's FormData
      if (employeeData instanceof FormData) {
        console.log("FormData contents:");
        for (let pair of employeeData.entries()) {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }
      
      const response = await apiClient.post("/admin/employees", employeeData);
      
      console.log("API Response status:", response.status);
      console.log("API Response data:", response.data);
      console.log("========== API REQUEST DEBUG END ==========");
      
      return response.data.data;
    } catch (error) {
      console.error("API Error:", error.response?.status, error.response?.data);
      if (error.response?.data?.errors) {
        return rejectWithValue({
          message: error.response.data.message,
          errors: error.response.data.errors,
        });
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to add employee",
      );
    }
  },
);

// In your fetchEmployeeById async thunk
export const fetchEmployeeById = createAsyncThunk(
  "employees/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      console.log(`========== FETCH EMPLOYEE ${id} DEBUG ==========`);
      const response = await apiClient.get(`/admin/employees/${id}`);
      
      console.log("Fetch response status:", response.status);
      console.log("Fetch response data:", response.data);
      
      if (response.data && response.data.status === "success") {
        const employee = response.data.data;
        
        // Log specific step 3 fields from response
        console.log("Step 3 fields in response:");
        console.log("  - visa_number:", employee.visa_number);
        console.log("  - visa_type:", employee.visa_type);
        console.log("  - visa_issued_date:", employee.visa_issued_date);
        console.log("  - visa_expiry_date:", employee.visa_expiry_date);
        console.log("  - labor_number:", employee.labor_number);
        console.log("  - labor_issued_date:", employee.labor_issued_date);
        console.log("  - labor_expiry_date:", employee.labor_expiry_date);
        console.log("  - eid_number:", employee.eid_number);
        console.log("  - eid_issued_date:", employee.eid_issued_date);
        console.log("  - eid_expiry_date:", employee.eid_expiry_date);
        
        console.log("========== FETCH EMPLOYEE DEBUG END ==========");
        return employee;
      } else {
        return rejectWithValue(
          response.data?.message || "Failed to fetch employee",
        );
      }
    } catch (error) {
      console.error("FETCH EMPLOYEE ERROR:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch employee",
      );
    }
  },
);

export const deleteEmployee = createAsyncThunk(
  "employees/delete",
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/admin/employees/${id}`);
      return id;
    } catch (error) {
      console.error("DELETE EMPLOYEE ERROR:", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete employee",
      );
    }
  },
);

export const updateEmployeeStatus = createAsyncThunk(
  "employees/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      await apiClient.post(`/admin/employees/${id}/update-status`, {
        status: status.toLowerCase(),
      });
      return { id, status };
    } catch (error) {
      console.error("UPDATE STATUS ERROR:", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || "Failed to update status",
      );
    }
  },
);

// Update employee
// Update employee
export const updateEmployee = createAsyncThunk(
  "employees/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      let response;


      // Log the data being sent for debugging
      if (data instanceof FormData) {
        const formDataObj = {};
        for (let pair of data.entries()) {
          if (pair[1] instanceof File) {
            console.log(
              `  - ${pair[0]}: [FILE] ${pair[1].name} (${(pair[1].size / 1024).toFixed(2)} KB)`,
            );
            formDataObj[pair[0]] = `[FILE: ${pair[1].name}]`;
          } else {
            console.log(`  - ${pair[0]}: ${pair[1]}`);
            formDataObj[pair[0]] = pair[1];
          }
        }
      } else {
        console.log("UPDATE EMPLOYEE - Sending data:", data);
      }

      // Check if data is FormData or plain object
      if (data instanceof FormData) {
        response = await apiClient.post(`/admin/employees/${id}`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        response = await apiClient.put(`/admin/employees/${id}`, data);
      }


      if (response.data && response.data.status === "success") {
        return response.data.data; 
      } else {
        console.warn(
          "⚠️ UPDATE EMPLOYEE - Response indicated failure:",
          response.data?.message,
        );
        return rejectWithValue(
          response.data?.message || "Failed to update employee",
        );
      }
    } catch (error) {

      if (error.response?.data?.errors) {
        console.error("Validation errors:", error.response.data.errors);
        return rejectWithValue({
          message: error.response.data.message,
          errors: error.response.data.errors,
        });
      }

      return rejectWithValue(
        error.response?.data?.message || "Failed to update employee",
      );
    }
  },
);

const initialState = {
  employees: [],
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  perPage: 10,
  filters: {
    status: "all",
    search: "",
    company: "all",
    department: "all",
  },
};

const employeeSlice = createSlice({
  name: "employees",
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setPerPage: (state, action) => {
      state.perPage = action.payload;
      state.currentPage = 1;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.currentPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        const apiData = action.payload.data?.data || [];

        state.employees = apiData.map((emp) => {
          // Handle avatar that might be an object or string
          let avatarValue = null;
          if (emp.avatar) {
            if (typeof emp.avatar === "string") {
              avatarValue = emp.avatar;
            } else if (typeof emp.avatar === "object" && emp.avatar.path) {
              avatarValue = emp.avatar.path;
            }
          }

          return {
            id: emp.id,
            name: [emp.first_name, emp.last_name].filter(Boolean).join(" "),
            status: emp.user?.status === "active" ? "Active" : emp.user?.status === "onboarding" ? "Onboarding" : "Inactive",
            designation: emp.user?.designation?.name || "-",
            department: emp.user?.department?.name || "-",
            company: emp.user?.company?.name || "-",
            avatar: avatarValue,
            raw: emp,
          };
        });

        state.totalCount = action.payload.data?.total || 0;
        state.currentPage = action.payload.data?.current_page || 1;
        state.perPage = action.payload.data?.per_page || 10;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addEmployee.fulfilled, (state, action) => {
        state.employees.unshift(action.payload);
        state.totalCount += 1;
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.employees = state.employees.filter(
          (emp) => emp.id !== action.payload,
        );
        state.totalCount -= 1;
      })
      .addCase(updateEmployeeStatus.fulfilled, (state, action) => {
        const index = state.employees.findIndex(
          (emp) => emp.id === action.payload.id,
        );
        if (index !== -1) {
          state.employees[index].status = action.payload.status;
        }
      })
      .addCase(fetchEmployeeById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => {
        state.loading = false;
        const employeeData = action.payload;

        // Handle avatar that might be an object or string
        let avatarValue = null;
        if (employeeData.avatar) {
          if (typeof employeeData.avatar === "string") {
            avatarValue = employeeData.avatar;
          } else if (
            typeof employeeData.avatar === "object" &&
            employeeData.avatar.path
          ) {
            avatarValue = employeeData.avatar.path;
          }
        }

        state.currentEmployee = {
          ...employeeData,
          avatar: avatarValue,
        };
        console.log("Mapped employee with avatar:", state.currentEmployee);
      })
      .addCase(fetchEmployeeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Employee
      .addCase(updateEmployee.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Update Employee
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.loading = false;
        console.log(
          "📦 REDUX - updateEmployee fulfilled, updating state with:",
          action.payload,
        );
        // Now action.payload is the actual employee data, not the wrapper
        if (action.payload && action.payload.id) {
          // Update the employee in the employees list if it exists
          const index = state.employees.findIndex(
            (emp) => emp.id === action.payload.id,
          );
          if (index !== -1) {
            state.employees[index] = action.payload;
          }
          state.currentEmployee = action.payload;
        }
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.loading = false;
        console.error(
          "📦 REDUX - updateEmployee rejected with error:",
          action.payload,
        );
        state.error = action.payload;
      });
  },
});

export const { setCurrentPage, setPerPage, setFilters, resetFilters } =
  employeeSlice.actions;
export default employeeSlice.reducer;
