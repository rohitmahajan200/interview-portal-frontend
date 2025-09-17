import * as React from "react";
import {
  Users,
  Shield,
  Settings,
  BarChart3,
  FileText,
  LayoutDashboard,
  Bell,
  Briefcase,
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
  type AdminPage,
  setCurrentAdminPage,
} from "@/features/Org/View/adminViewSlice";
import Logo from "../logo";
import { NavMainAdmin } from "./NavMainAdmin";
import { NavOrgUser } from "./../NavOrgUser";

export function AdminSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar();
  const orgState = useAppSelector((s) => s.orgAuth);
  const dispatch = useDispatch();
  const adminNotifications = useAppSelector((s) => s.adminNotifications);
  const unreadTotal = Object.values(adminNotifications.roleBreakdown || {})
  .reduce((sum, role) => sum + (role.unread || 0), 0);
  // helper so we don't repeat the arrow function every line
  const navItem = (
    title: string,
    icon: React.ElementType,
    page: AdminPage,
    badge?: number
  ) => ({
    title,
    icon,
    onClick: () => dispatch(setCurrentAdminPage(page)),
    badge,
  });

  /*  IMPORTANT:  use one-word titles that match the slice keys
  so that you can ALSO fall back to the default NavMain logic
  (lower-casing / slugging the title) if ever needed.          */
  const adminNav = [
    navItem("home", LayoutDashboard, "home"),
    navItem("users", Users, "users"),
    navItem("jobs", Briefcase, "jobs"),
    navItem("roles", Shield, "roles"),
    navItem("notifications", Bell, "notifications", unreadTotal > 0 ? unreadTotal : undefined),
    navItem("config", Settings, "config"),
    navItem("analytics", BarChart3, "analytics"),
    navItem("audit", FileText, "audit"),
  ] as unknown as { title: string; icon: React.ElementType; badge?: number }[];

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
        <NavMainAdmin items={adminNav} />
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        {orgState.user && (
          <NavOrgUser
            user={{
              name: orgState.user.name,
              email: orgState.user.email,
              profile_photo_url: orgState.user.profile_photo_url
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
