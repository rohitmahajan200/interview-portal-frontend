import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { LoginForm } from "@/components/login-form"
import Header from "./components/header";
import { RegisterForm } from "./components/Register-form";
function App() {

  const router=createBrowserRouter([
    {
      path:"/",
      element:<LoginForm />
    },
    {
      path:"/register/candidate",
      element:<RegisterForm />
    }
  ])
  return (
    <>
        <Header />
        <RouterProvider router={router}></RouterProvider>
    </>
  )
}

export default App
