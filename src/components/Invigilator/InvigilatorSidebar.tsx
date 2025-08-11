// src/components/HR/HRSidebar.tsx
import * as React from "react";
import {
  Home,
  HelpCircle,
  FileText,
  Users,
  Calendar,
  BarChart3,
  Settings,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAppSelector } from "@/hooks/useAuth";
import { useDispatch } from "react-redux";
import {
  type InvigilatorPage,
  setCurrentInvigilatorPage,
} from "@/features/Org/View/invigilatorViewSlice"
import Logo from "../logo";
import { NavMainINVIGILATOR } from "./NavMainInvigilator";

export function InvigilatorSidebar(
  props: React.ComponentProps<typeof Sidebar>,
) {
  const { open } = useSidebar();
  const orgState = useAppSelector((s) => s.orgAuth);
  const dispatch = useDispatch();

  // Updated to use HRPage type and setCurrentHRPage action
  const navItem = (title: string, icon: React.ElementType, page: InvigilatorPage) => ({
    title,
    icon,
    onClick: () => dispatch(setCurrentInvigilatorPage(page)),
  });

  const InvigilatorNav = [
    navItem("Home",               Home,        "invigilator-home"),
    navItem("Questions",          HelpCircle,  "invigilator-questions"),
    navItem("Assessment",      FileText,    "invigilator-questionnaire"),
    navItem("Candidate Review",      Users,       "candidate-review"),
    navItem("Analytics",          BarChart3,   "invigilator-analytics"),
  ] as unknown as { title: string; icon: React.ElementType }[];

  return (
    <Sidebar
      collapsible="icon"
      className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
      {...props}
    >
      {open && <SidebarHeader className="border-b border-gray-200 dark:border-gray-700">
         <Logo />
      </SidebarHeader>}

      <SidebarContent className="bg-white dark:bg-gray-900">
        <NavMainINVIGILATOR items={InvigilatorNav} />
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 dark:border-gray-700">
        {orgState.user && (
          <NavUser
            user={{
              name: orgState.user.name,
              email: orgState.user.email,
              avatar: "/default-avatar.png",
            }}
          />
        )}
      </SidebarFooter>

      <SidebarRail className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700" />
    </Sidebar>
  );
}
