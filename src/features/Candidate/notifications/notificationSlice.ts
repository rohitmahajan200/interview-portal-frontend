import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Notification {
  _id: string;
  title?: string; // optional, some notifications may not have a title
  message: string;
  type?: string; // <-- added to match backend + UI expectations
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsState {
  items: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
}

const initialState: NotificationsState = {
  items: [],
  loading: false,
  error: null,
  unreadCount: 0,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.read).length;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.items.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
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
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  setLoading,
  setError,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
