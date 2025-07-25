import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { LoginForm } from "@/components/login-form";
import Header from "./components/header";
import { RegisterForm } from "./components/Register-form";
import Dashboard from "./components/Dashboard";
import OTPLoginForm from "./components/OTPLoginForm";

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
  ]);

  return (
    <>
      <Header />                    {/* Common header for all pages */}
      <RouterProvider router={router} /> {/* Provide router to the app */}
    </>
  );
}

export default App;
