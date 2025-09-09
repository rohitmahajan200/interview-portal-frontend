import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/Candidate/auth/authSlice.js";
import viewReducer from "../features/Candidate/view/viewSlice.js";
import themeReducer from "../features/Candidate/theme/themeSlice.js";
import notificationsReducer from "../features/Candidate/notifications/notificationSlice.js";
import orgAuthReducer from "../features/Org/Auth/orgAuthSlice.js";
import adminViewReducer from "../features/Org/View/adminViewSlice.js";
import hrViewReducer from "../features/Org/View/HrViewSlice.js";
import invigilatorReducer from "../features/Org/View/invigilatorViewSlice.js";
import interviewSchedulingReducer from "@/features/Org/HR/interviewSchedulingSlice.js";
import managerViewReducer from "@/features/Org/View/managerViewSlice";
import orgNotificationsReducer from "../features/Org/Notifications/orgNotificationSlice";
import adminNotificationsReducer from "../features/Org/Notifications/AdminNotificationSlice"; // Add this import

export const store = configureStore({
  reducer: {
    auth: authReducer,
    view: viewReducer,
    theme: themeReducer,
    notifications: notificationsReducer,
    orgAuth: orgAuthReducer,
    orgNotifications: orgNotificationsReducer,
    adminNotifications: adminNotificationsReducer, // Add this line
    adminView: adminViewReducer,
    hrView: hrViewReducer,
    invigilator: invigilatorReducer,
    interviewScheduling: interviewSchedulingReducer,
    managerView: managerViewReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
