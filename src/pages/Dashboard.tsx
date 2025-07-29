import { AppSidebar } from "@/components/app-sidebar";
import JobList from "@/components/JobList";
import { ProgressBar } from "@/components/ProgressBar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import EventNotificationCard from "@/components/ui/EventNotificationCard";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAppSelector } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Home from "./Home";

export default function Page() {
  const state = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  useEffect(() => {
    if (state.user == null) {
      navigate("/");
    }
  },[]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <header className=" px-1 rounded-xl">
                  <div className="flex items-center space-x-2">
                    {/* Company logo */}
                    {/* <img
                        src="https://www.change-networks.com/logo.png"
                        alt="Company Logo"
                        className="w-10 h-10 object-contain"
                      /> */}

                    {/* Welcome text */}
                    <span className="text-lg font-semibold text-gray-800">
                      Welcome To Change Networks!
                    </span>
                  </div>
                </header>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <Home />
      </SidebarInset>
    </SidebarProvider>
  );
}
