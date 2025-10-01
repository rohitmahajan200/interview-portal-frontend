// src/components/shared/Header.tsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/app/store";
import { setCurrentRole, type AdminViewRole } from "@/features/Org/View/adminViewSlice";
import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarTrigger } from "./ui/sidebar";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

export const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.orgAuth.user);
  const currentRole = useSelector((state: RootState) => state.adminView.currentRole);

  const handleRoleChange = (role: string) => {
    if (user?.role === "ADMIN") {
      dispatch(setCurrentRole(role as AdminViewRole));
    }
  };

  const getPortalTitle = () => {
    if (user?.role === "ADMIN") {
      switch (currentRole) {
        case "ADMIN":
          return "Admin Portal";
        case "HR":
          return "HR Portal";
        case "INVIGILATOR":
          return "Invigilator Portal";
        case "MANAGER":
          return "Manager Portal";
        default:
          return "Admin Portal";
      }
    }

    switch (user?.role) {
      case "HR":
        return "HR Portal";
      case "INVIGILATOR":
        return "Invigilator Portal";
      case "MANAGER":
        return "Manager Portal";
      default:
        return "Portal";
    }
  };
  const handleLogout = async () => {
    await api.post("/org/logout");
    navigate("/org/login");
  };
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2">
      <div className="flex items-center gap-2 justify-start md:justify-between w-full">
        <div className="flex items-center gap-2 w-full justify-between md:justify-between">
          <div className="items-center gap-2 hidden md:flex">
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {/* Hide portal title on mobile (<md), show on md+ */}
                <header className="px-1 rounded-xl hidden md:block">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {getPortalTitle()} - CHANGE Networks
                    </span>
                  </div>
                </header>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="block md:hidden"><SidebarTrigger /></div>
          {/* Only show tabs if user is ADMIN */}
          {user?.role === "ADMIN" && (
            <div className="flex-shrink-0">
              <Tabs value={currentRole} onValueChange={handleRoleChange}>
                <TabsList className="flex-shrink-0 w-fit gap-2 p-1 bg-background h-16">
                  <TabsTrigger 
                    value="ADMIN" 
                    className="px-4 py-2 text-sm sm:px-6 sm:text-base whitespace-nowrap"
                    title="Admin"
                  >
                    {/* Show initials on smaller screens, full text on larger screens */}
                    <span className="block sm:hidden">A</span>
                    <span className="hidden sm:block">Admin</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="HR" 
                    className="px-4 py-2 text-sm sm:px-6 sm:text-base whitespace-nowrap"
                    title="HR"
                  >
                    <span className="block sm:hidden">H</span>
                    <span className="hidden sm:block">HR</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="INVIGILATOR" 
                    className="px-4 py-2 text-sm sm:px-6 sm:text-base whitespace-nowrap"
                    title="Invigilator"
                  >
                    <span className="block sm:hidden">I</span>
                    <span className="hidden sm:block">Invigilator</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="MANAGER" 
                    className="px-4 py-2 text-sm sm:px-6 sm:text-base whitespace-nowrap"
                    title="Manager"
                  >
                    <span className="block sm:hidden">M</span>
                    <span className="hidden sm:block">Manager</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs> 
            </div>
          )}
          <Button
                variant="destructive" 
                size="sm" 
                className="block sm:hidden" 
                onClick={handleLogout}
              >
                Logout
              </Button>
        </div>
      </div>
    </header>
  );
};
