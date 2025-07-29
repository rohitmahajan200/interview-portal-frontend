import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useDispatch } from "react-redux";
import { setUser } from "@/features/auth/authSlice";
import api from "@/lib/api";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Home from "./Home";
import Assessments from "./Assessments";
import Interviews from "./Interviews";
import Feedback from "./Feedback";
import Profile from "./Profile";
import { Settings } from "lucide-react";

export default function Page() {
  const dispatch = useDispatch();
  const currentView = useSelector((state: RootState) => state.view.currentView) as string;
  const navigate = useNavigate();
  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const res = await api.get("/candidates/me");
        if (res.data.user) {
          dispatch(setUser(res.data.user));
        }
      } catch (error) {
        console.error("Failed to fetch candidate profile:", error);
        navigate("/login");
      }
    };

    fetchCandidate();
  }, []);

  const renderView = (currentView: string) => {
    switch (currentView) {
      case "home":
        return <Home />;
      case "assessments":
        return <Assessments />;
      case "interviews":
        return <Interviews />;
      case "feedback":
        return <Feedback />;
      case "profile":
        return <Profile />;
      case "settings":
        return <Settings />;
      default:
        return <Home />;
    }
  };

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
                    <span className="text-lg font-semibold text-gray-800">
                      Welcome To Change Networks!
                    </span>
                  </div>
                </header>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {renderView(currentView)}
      </SidebarInset>
    </SidebarProvider>
  );
}
