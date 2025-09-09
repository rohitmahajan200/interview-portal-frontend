import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface OrgNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrgNotificationState {
  items: OrgNotification[];
  unreadCount: number;
  loading: boolean;
}

const initialState: OrgNotificationState = {
  items: [],
  unreadCount: 0,
  loading: false,
};

const orgNotificationSlice = createSlice({
  name: "orgNotifications",
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<OrgNotification[]>) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.read).length;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find((n) => n._id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((notification) => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    addNotification: (state, action: PayloadAction<OrgNotification>) => {
      state.items.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setNotifications,
  markAsRead,
  markAllAsRead,
  addNotification,
  setLoading,
} = orgNotificationSlice.actions;

export default orgNotificationSlice.reducer;
