// src/App.tsx
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import GlobalErrorPage from "./components/GlobalErrorPage";

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
  return <Outlet />; // optional shared layout/shell goes here
}

const router = createBrowserRouter([
  {
    path: "/",                    // 🔑 single root
    element: <RootLayout />,
    errorElement: <GlobalErrorPage />,   // 🔑 global route error UI
    children: [
      { index: true, element: <Dashboard /> },         // "/" -> Dashboard
      { path: "login", element: <LoginForm /> },
      { path: "register-candidate", element: <RegisterForm /> },
      { path: "login-otp", element: <OTPLoginForm /> },
      { path: "forget-password", element: <OTPForgetPasswordForm /> },
      { path: "email-verification", element: <EmailVerification /> },
      { path: "org/login", element: <OrgLoginForm /> },
      { path: "org/otp-login", element: <OrgOTPLoginForm /> },
      { path: "org/setup-password", element: <OrgSetupPasswordForm /> },
      { path: "org", element: <OrgDashboard /> },
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
