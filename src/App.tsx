import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

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


function App() {
  // Define all application routes
  const router = createBrowserRouter([
    {
      path: "/login",                  // Login route
      element: <LoginForm />,
    },
    {
      path: "/",         // Dashboard route
      element: <Dashboard />,
    },
    {
      path: "/register-candidate", // Registration form route
      element: <RegisterForm />,
    },
    {
      path: "/login-otp",
      element: <OTPLoginForm />,
    },
    {
      path: "/forget-password",
      element: <OTPForgetPasswordForm />,
    },
    {
      path:"/email-verification",
      element:<EmailVerification /> //Email verification informative form
    },
      {
      path: "/org/login",
      element: <OrgLoginForm />,
    },
    {
      path: "/org/otp-login", 
      element: <OrgOTPLoginForm />,
    },
    {
      path: "/org/setup-password",
      element: <OrgSetupPasswordForm />,
    },
    {
      path: "/org",
      element: <OrgDashboard />,
    },
    {
      path:"/start-assessment/:assessmentId",
      element:<SecureAssessmentLanding />,
    },
    {
      path:"/start-hrqna/:assessmentId",
      element:<SecureHRInterview />,
    },
    {
      path:"*",
      element:<NotFound /> //Email verification informative form
    }
  ]);

  return (
    <>
      <RouterProvider router={router} />      {/* Provide router to the app */}
    </>
  );
}

export default App;
