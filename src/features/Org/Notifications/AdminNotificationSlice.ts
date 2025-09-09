import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AdminNotification {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  recipient: {
    _id: string;
    name: string;
    email: string;
    role: "HR" | "MANAGER" | "INVIGILATOR";
  };
  visible_at?: string;
}

interface AdminNotificationState {
  notificationsByRole: {
    HR: AdminNotification[];
    MANAGER: AdminNotification[];
    INVIGILATOR: AdminNotification[];
  };
  roleBreakdown: {
    [key: string]: {
      total: number;
      unread: number;
    };
  };
  loading: boolean;
  selectedRole: "HR" | "MANAGER" | "INVIGILATOR" | "ALL";
}

const initialState: AdminNotificationState = {
  notificationsByRole: {
    HR: [],
    MANAGER: [],
    INVIGILATOR: [],
  },
  roleBreakdown: {},
  loading: false,
  selectedRole: "ALL",
};

const adminNotificationSlice = createSlice({
  name: "adminNotifications",
  initialState,
  reducers: {
    setAdminNotifications: (
      state,
      action: PayloadAction<{
        notificationsByRole: AdminNotificationState["notificationsByRole"];
        roleBreakdown: AdminNotificationState["roleBreakdown"];
      }>
    ) => {
      state.notificationsByRole = action.payload.notificationsByRole;
      state.roleBreakdown = action.payload.roleBreakdown;
    },
    setSelectedRole: (
      state,
      action: PayloadAction<AdminNotificationState["selectedRole"]>
    ) => {
      state.selectedRole = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    // Optional: Add individual notification updates if needed
    updateNotificationInRole: (
      state,
      action: PayloadAction<{
        notificationId: string;
        role: "HR" | "MANAGER" | "INVIGILATOR";
        updates: Partial<AdminNotification>;
      }>
    ) => {
      const { notificationId, role, updates } = action.payload;
      const notification = state.notificationsByRole[role].find(
        (n) => n._id === notificationId
      );
      if (notification) {
        Object.assign(notification, updates);
      }
    },
  },
});

export const {
  setAdminNotifications,
  setSelectedRole,
  setLoading,
  updateNotificationInRole,
} = adminNotificationSlice.actions;

export default adminNotificationSlice.reducer;
