// src/components/Manager/ManagerSidebar.tsx
import React from "react";
import {
  Home,
  Calendar,
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
  type ManagerPage,
  setCurrentManagerPage,
} from "@/features/Org/View/managerViewSlice";
import Logo from "../logo";
import { NavMainManager } from "./NavMainManager";

type ManagerSidebarProps = React.ComponentProps<typeof Sidebar>;

export const ManagerSidebar: React.FC<ManagerSidebarProps> = (props) => {
  const { open } = useSidebar();
  const orgState = useAppSelector((s) => s.orgAuth);
  const dispatch = useDispatch();
  
  // Get current page for highlighting
  const currentPage = useAppSelector((state) => state.managerView.currentManagerPage);
  const user = useAppSelector((state) => state.orgAuth.user);
  const isAdmin = user?.role === 'ADMIN';

  const navItem = (title: string, icon: React.ElementType, page: ManagerPage) => ({
    title,
    icon,
    page,
    isActive: currentPage === page,
    onClick: () => dispatch(setCurrentManagerPage(page)),
  });

  // Manager navigation items
  const managerNav = [
    navItem("Dashboard", Home, "manager-home"),
    navItem("Calendar", Calendar, "manager-calendar"),
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

      {/* Scrollable nav area */}
      <SidebarContent className="bg-white dark:bg-gray-900 flex-1 overflow-y-auto">
        <NavMainManager items={managerNav} />
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
        {isAdmin && (
          <div className="px-4 py-2 text-xs text-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
            Admin Mode: Full Access
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};
