// src/App.tsx
import { useEffect } from "react";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import pushNotificationService from "./services/pushNotificationService";

// Import components
import GlobalErrorPage from "./components/GlobalErrorPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { LoginForm } from "@/pages/login-form";
import { EmailVerification } from "./pages/emailVerification";
import RegisterForm from "./pages/Register-form";
import Dashboard from "./pages/Dashboard";
import OTPLoginForm from "./pages/OTPLoginForm";
import OTPForgetPasswordForm from "./pages/OTPForgetPasswordForm";
import NotFound from "./pages/NotFound";
import SecureAssessmentLanding from "./pages/SecureAssessmentLanding";
import OrgLoginForm from "./pages/OrgLoginForm";
import OrgOTPLoginForm from "./pages/OrgOTPLoginForm";
import OrgSetupPasswordForm from "./pages/OrgSetupPasswordForm";
import OrgDashboard from "./pages/OrgDashboard";
import SecureHRInterview from "./pages/SecureHrQn";
import SebQuitPage from "./pages/SebQuitPage";

function RootLayout() {
  useEffect(() => {
    const init = async () => {
      try {
        if (pushNotificationService.isSupported) {
          await pushNotificationService.initializeServiceWorker();
        }
      } catch (err) {
        console.error("❌ Failed to initialize push notifications:", err);
      }
    };
    void init();
  }, []);

  return <Outlet />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <GlobalErrorPage />,
    children: [
      { 
        index: true, 
        element: (
          <ProtectedRoute type="candidate">
            <Dashboard />
          </ProtectedRoute>
        )
      },
      { path: "login", element: <LoginForm /> },
      { path: "register-candidate", element: <RegisterForm /> },
      { path: "login-otp", element: <OTPLoginForm /> },
      { path: "forget-password", element: <OTPForgetPasswordForm /> },
      { path: "email-verification", element: <EmailVerification /> },
      { path: "org/login", element: <OrgLoginForm /> },
      { path: "org/otp-login", element: <OrgOTPLoginForm /> },
      { path: "org/setup-password", element: <OrgSetupPasswordForm /> },
      { 
        path: "org", 
        element: (
          <ProtectedRoute type="org">
            <OrgDashboard />
          </ProtectedRoute>
        )
      },
      { path: "start-assessment", element: <SecureAssessmentLanding /> },
      { path: "start-hrqna", element: <SecureHRInterview /> },
      { path: "quit", element: <SebQuitPage /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
