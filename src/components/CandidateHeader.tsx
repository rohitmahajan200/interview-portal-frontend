// src/components/shared/CandidateHeader.tsx
import React from "react";
import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";

export const CandidateHeader = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/candidates/logout");
      navigate("/candidate/login");
    } catch (error) {
      // Navigate anyway if logout fails
      navigate("/candidate/login");
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2">
      <div className="flex items-center gap-2 justify-between w-full">
        {/* Left side - Sidebar trigger and welcome text */}
        <div className="flex items-center gap-2">
          <div className="block md:hidden">
            <SidebarTrigger />
          </div>
          <div className="items-center gap-2 hidden md:flex">
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <header className="px-1 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {/* Show short text on small screens, full text on larger screens */}
                      <span className="block sm:hidden">Welcome!</span>
                      <span className="hidden sm:block">Welcome To CHANGE Networks!</span>
                    </span>
                  </div>
                </header>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          {/* Mobile welcome text (visible only on small screens) */}
          <div className="flex items-center gap-2 md:hidden">
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Welcome!
            </span>
          </div>
        </div>

        {/* Right side - Logout button (only on small screens) */}
        <Button
          variant="destructive"
          size="sm"
          className="block sm:hidden"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </header>
  );
};
