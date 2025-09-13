// src/components/HR/HRSidebar.tsx
import * as React from "react";
import {
  Home,
  HelpCircle,
  FileText,
  Users,
  Calendar,
  BarChart3,
  Bell,
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
import Logo from "../logo";
import NavMainHR from "./NavMainHR";
import type { HRPage } from "@/features/Org/View/HrViewSlice";
import { NavOrgUser } from "../NavOrgUser";

export function HRSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar();
  const orgState = useAppSelector((s) => s.orgAuth);
  const orgNotifications = useAppSelector((s) => s.orgNotifications);
  const user = useAppSelector((state) => state.orgAuth.user);
  const isAdmin = user?.role === "ADMIN";

  const navItem = (
    title: string,
    icon: React.ElementType,
    page: HRPage,
    badge?: number
  ) => ({
    title,
    icon,
    page,
    badge,
  });

  const hrNav = [
    navItem("home", Home, "hr-home"),
    navItem("questions", HelpCircle, "hr-questions"),
    navItem("questionnaire", FileText, "hr-questionnaire"),
    navItem("questionnaire review", Users, "candidate-review"),
    navItem("interviews", Calendar, "interview-scheduling"),
    navItem("analytics", BarChart3, "hr-analytics"),
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
  ];

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
      <SidebarContent className="bg-white dark:bg-gray-900 flex-1 overflow-y-auto">
        <NavMainHR items={hrNav as any} />
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
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
