// src/components/Invigilator/InvigilatorSidebar.tsx
import * as React from "react";
import {
  Home,
  HelpCircle,
  FileText,
  Users,
  BarChart3,
  Calendar,
  Bell, // Added Bell icon
  Settings,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
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
} from "@/features/Org/View/invigilatorViewSlice";
import Logo from "../logo";
import NavMainINVIGILATOR from "./NavMainInvigilator";
import { NavOrgUser } from "../NavOrgUser";
export function InvigilatorSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const { open } = useSidebar();
  const orgState = useAppSelector((s) => s.orgAuth);
  const orgNotifications = useAppSelector((s) => s.orgNotifications); // Added notifications state
  const dispatch = useDispatch();
  const user = useAppSelector((state) => state.orgAuth.user);
  const isAdmin = user?.role === "ADMIN";

  // Get current page for highlighting
  const currentPage = useAppSelector(
    (state) => state.invigilator.currentHRPage
  );

  const navItem = (
    title: string,
    icon: React.ElementType,
    page: InvigilatorPage,
    badge?: number
  ) => ({
    title,
    icon,
    page,
    badge,
    isActive: currentPage === page,
    onClick: () => dispatch(setCurrentInvigilatorPage(page)),
  });

  // Updated to include notifications with badge support
  const invigilatorNav = [
    navItem("home", Home, "invigilator-home"),
    navItem("questions", HelpCircle, "invigilator-questions"),
    navItem("assessment", FileText, "invigilator-questionnaire"),
    navItem("candidates", Users, "candidate-review"),
    navItem("interviews", Calendar, "interview-scheduling"),
    navItem("analytics", BarChart3, "invigilator-analytics"),
    // Only add notifications and config for non-admin users
    ...(!isAdmin
      ? [
          navItem(
            "notifications",
            Bell,
            "notifications",
            orgNotifications.unreadCount > 0
              ? orgNotifications.unreadCount
              : undefined
          ),
          navItem("config", Settings, "config"),
        ]
      : []),
  ] as {
    title: string;
    icon: React.ElementType;
    page: InvigilatorPage;
    badge?: number;
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
          <NavOrgUser
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
