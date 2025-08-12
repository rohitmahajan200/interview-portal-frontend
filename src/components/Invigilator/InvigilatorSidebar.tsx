import * as React from "react";
import {
  Home,
  HelpCircle,
  FileText,
  Users,
  BarChart3,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
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
  
  // Get current page for highlighting
  const currentPage = useAppSelector((state) => state.invigilator.currentHRPage);

  const navItem = (title: string, icon: React.ElementType, page: InvigilatorPage) => ({
    title,
    icon,
    page, // Add page property for NavMainINVIGILATOR to use
    isActive: currentPage === page, // Add active state
    onClick: () => dispatch(setCurrentInvigilatorPage(page)),
  });

  // Updated to match all navigation items
  const invigilatorNav = [
    navItem("Home", Home, "invigilator-home"),
    navItem("Questions", HelpCircle, "invigilator-questions"),
    navItem("Assessment", FileText, "invigilator-questionnaire"),
    navItem("Candidate Review", Users, "candidate-review"),
    navItem("Analytics", BarChart3, "invigilator-analytics"),
  ] as unknown as { 
    title: string; 
    icon: React.ElementType; 
    page: InvigilatorPage;
    isActive: boolean;
    onClick: () => void;
  }[];

  return (
    <Sidebar
      collapsible="icon"
      className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 h-full"
      {...props}
    >
      {open && (
        <SidebarHeader className="border-b border-gray-200 dark:border-gray-700 h-16 flex-shrink-0">
          <Logo />
        </SidebarHeader>
      )}

      {/* Scrollable nav area */}
      <SidebarContent className="bg-white dark:bg-gray-900 flex-1 overflow-y-auto">
        <NavMainINVIGILATOR items={invigilatorNav} />
      </SidebarContent>

      {/* Sticky footer */}
      <SidebarFooter className="border-t border-gray-200 dark:border-gray-700 shrink-0">
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
    </Sidebar>
  );
}
