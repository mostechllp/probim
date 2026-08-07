// store/slices/notificationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../../utils/apiClient";

// Fetch all notifications
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/admin/notifications/all");
      console.log("All notifications API response:", res.data);
      
      let notificationsData = [];
      
      if (res.data?.data && Array.isArray(res.data.data)) {
        notificationsData = res.data.data;
      } else if (Array.isArray(res.data)) {
        notificationsData = res.data;
      }
      
      return notificationsData;
    } catch (err) {
      console.error("Fetch notifications error:", err);
      return rejectWithValue(err.response?.data || "Error");
    }
  },
);

// Fetch unread notifications
export const fetchUnreadNotifications = createAsyncThunk(
  "notifications/fetchUnreadNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/admin/notifications/unread");
      console.log("Unread notifications API response:", res.data);
      
      let notificationsData = [];
      
      if (res.data?.data && Array.isArray(res.data.data)) {
        notificationsData = res.data.data;
      } else if (Array.isArray(res.data)) {
        notificationsData = res.data;
      }
      
      return notificationsData;
    } catch (err) {
      console.error("Fetch unread notifications error:", err);
      return rejectWithValue(err.response?.data || "Error");
    }
  },
);

// Fetch read notifications
export const fetchReadNotifications = createAsyncThunk(
  "notifications/fetchReadNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/admin/notifications/read");
      console.log("Read notifications API response:", res.data);
      
      let notificationsData = [];
      
      if (res.data?.data && Array.isArray(res.data.data)) {
        notificationsData = res.data.data;
      } else if (Array.isArray(res.data)) {
        notificationsData = res.data;
      }
      
      return notificationsData;
    } catch (err) {
      console.error("Fetch read notifications error:", err);
      return rejectWithValue(err.response?.data || "Error");
    }
  },
);

// Fetch a single notification by ID
export const fetchNotificationById = createAsyncThunk(
  "notifications/fetchNotificationById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/admin/notifications/${id}`);
      console.log("Notification detail API response:", res.data);
      return res.data?.data || res.data;
    } catch (err) {
      console.error("Fetch notification detail error:", err);
      return rejectWithValue(err.response?.data || "Error");
    }
  },
);

// Mark a notification as read
export const markNotificationAsRead = createAsyncThunk(
  "notifications/markNotificationAsRead",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.post(`/admin/notifications/${id}/mark-as-read`);
      console.log("Mark as read response:", res.data);
      return { id, data: res.data?.data || res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  },
);

// Mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  "notifications/markAllNotificationsAsRead",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.post("/admin/notifications/mark-all-as-read");
      console.log("Mark all as read response:", res.data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error");
    }
  },
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  selectedNotification: null,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    markAsRead: (state, action) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload,
      );
      if (notification && !notification.read) {
        notification.read = true;
        notification.read_at = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => {
        if (!n.read) {
          n.read = true;
          n.read_at = new Date().toISOString();
        }
      });
      state.unreadCount = 0;
    },
    clearSelectedNotification: (state) => {
      state.selectedNotification = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const rawNotifications = action.payload || [];
        
        state.notifications = rawNotifications.map((n) => {
          const notificationData = n.data || {};
          const notificationType = notificationData.type || 'general';
          
          let title = 'Notification';
          let message = notificationData.message || '';
          
          switch (notificationType) {
            case 'probation':
              title = 'Probation Alert';
              break;
            case 'leave':
              title = 'Leave Request';
              break;
            case 'attendance':
              title = 'Attendance Alert';
              break;
            case 'contract':
              title = 'Contract Alert';
              break;
            default:
              title = notificationData.title || notificationData.type || 'Notification';
          }
          
          if (!message && notificationData.employee) {
            message = `Notification for employee ${notificationData.employee}`;
          }
          
          // Check if notification is read
          const isRead = !!n.read_at;
          
          return {
            id: n.id,
            title: title,
            message: message,
            time: n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now',
            read: isRead,
            read_at: n.read_at || null,
            created_at: n.created_at,
            updated_at: n.updated_at,
            data: notificationData,
            type: n.type || notificationType,
            raw: n,
          };
        });
        
        state.unreadCount = state.notifications.filter((n) => !n.read).length;
        console.log("Processed notifications:", state.notifications);
        console.log("Unread count:", state.unreadCount);
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        console.error("Fetch notifications rejected:", action.payload);
      })

      // Fetch unread notifications
      .addCase(fetchUnreadNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUnreadNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const rawNotifications = action.payload || [];
        const unreadIds = new Set(rawNotifications.map(n => n.id));
        state.notifications = state.notifications.filter(n => !unreadIds.has(n.id));
        
        const newNotifications = rawNotifications.map((n) => {
          const notificationData = n.data || {};
          const notificationType = notificationData.type || 'general';
          
          let title = 'Notification';
          let message = notificationData.message || '';
          
          switch (notificationType) {
            case 'probation':
              title = 'Probation Alert';
              break;
            case 'leave':
              title = 'Leave Request';
              break;
            case 'attendance':
              title = 'Attendance Alert';
              break;
            case 'contract':
              title = 'Contract Alert';
              break;
            default:
              title = notificationData.title || notificationData.type || 'Notification';
          }
          
          if (!message && notificationData.employee) {
            message = `Notification for employee ${notificationData.employee}`;
          }
          
          const isRead = !!n.read_at;
          
          return {
            id: n.id,
            title: title,
            message: message,
            time: n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now',
            read: isRead,
            read_at: n.read_at || null,
            created_at: n.created_at,
            updated_at: n.updated_at,
            data: notificationData,
            type: n.type || notificationType,
            raw: n,
          };
        });
        state.notifications = [...newNotifications, ...state.notifications];
        state.unreadCount = state.notifications.filter((n) => !n.read).length;
      })
      .addCase(fetchUnreadNotifications.rejected, (state, action) => {
        state.loading = false;
        console.error("Fetch unread notifications rejected:", action.payload);
      })

      // Fetch notification by ID
      .addCase(fetchNotificationById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotificationById.fulfilled, (state, action) => {
        state.loading = false;
        const rawNotification = action.payload;
        const notificationData = rawNotification.data || {};
        const notificationType = notificationData.type || 'general';
        
        let title = 'Notification';
        let message = notificationData.message || '';
        
        switch (notificationType) {
          case 'probation':
            title = 'Probation Alert';
            break;
          case 'leave':
            title = 'Leave Request';
            break;
          case 'attendance':
            title = 'Attendance Alert';
            break;
          case 'contract':
            title = 'Contract Alert';
            break;
          default:
            title = notificationData.title || notificationData.type || 'Notification';
        }
        
        if (!message && notificationData.employee) {
          message = `Notification for employee ${notificationData.employee}`;
        }
        
        const isRead = !!rawNotification.read_at;
        
        state.selectedNotification = {
          id: rawNotification.id,
          title: title,
          message: message,
          time: rawNotification.created_at ? new Date(rawNotification.created_at).toLocaleString() : 'Just now',
          read: isRead,
          read_at: rawNotification.read_at || null,
          created_at: rawNotification.created_at,
          updated_at: rawNotification.updated_at,
          data: notificationData,
          type: rawNotification.type || notificationType,
          raw: rawNotification,
        };
      })
      .addCase(fetchNotificationById.rejected, (state, action) => {
        state.loading = false;
        console.error("Fetch notification by ID rejected:", action.payload);
      })

      // Mark notification as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        const notification = state.notifications.find(
          (n) => n.id === id,
        );
        if (notification && !notification.read) {
          notification.read = true;
          notification.read_at = data?.read_at || new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        // Also update selected notification if it's the same
        if (state.selectedNotification?.id === id) {
          state.selectedNotification.read = true;
          state.selectedNotification.read_at = data?.read_at || new Date().toISOString();
        }
        console.log("Notification marked as read:", id);
        console.log("Updated unread count:", state.unreadCount);
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        console.error("Mark notification as read failed:", action.payload);
      })

      // Mark all notifications as read
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.loading = true;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.loading = false;
        const now = new Date().toISOString();
        state.notifications.forEach((n) => {
          if (!n.read) {
            n.read = true;
            n.read_at = now;
          }
        });
        state.unreadCount = 0;
        if (state.selectedNotification && !state.selectedNotification.read) {
          state.selectedNotification.read = true;
          state.selectedNotification.read_at = now;
        }
        console.log("All notifications marked as read");
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.loading = false;
        console.error("Mark all as read failed:", action.payload);
      });
  },
});

export const { markAsRead, markAllRead, clearSelectedNotification } = notificationSlice.actions;
export default notificationSlice.reducer;