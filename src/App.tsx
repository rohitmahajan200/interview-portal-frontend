import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { LoginForm } from "@/pages/login-form";
import { EmailVerification } from "./pages/emailVerification";
import Header from "./components/header";
import RegisterForm from "./pages/Register-form";
import Dashboard from "./pages/Dashboard";
import OTPLoginForm from "./pages/OTPLoginForm";
import OTPForgetPasswordForm from "./pages/OTPForgetPasswordForm";


function App() {
  // Define all application routes
  const router = createBrowserRouter([
    {
      path: "/",                  // Login route
      element: <LoginForm />,
    },
    {
      path: "/dashboard",         // Dashboard route
      element: <Dashboard />,
    },
    {
      path: "/register/candidate", // Registration form route
      element: <RegisterForm />,
    },
    {
      path: "/login/otp",
      element: <OTPLoginForm />,
    },
    {
      path: "/forget-password",
      element: <OTPForgetPasswordForm />,
    },
    {
      path:"/email-verification",
      element:<EmailVerification /> //Email verification informative form
    }
  ]);

  return (
    <>
      <Header />                              {/* Common header for all pages */}

      <RouterProvider router={router} />      {/* Provide router to the app */}
    </>
  );
}

export default App;
