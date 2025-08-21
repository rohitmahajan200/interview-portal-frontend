// src/components/Manager/NavMainManager.tsx
import React from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  icon: React.ElementType;
  isActive?: boolean;
  onClick: () => void;
}

interface NavMainManagerProps {
  items: NavItem[];
}

export const NavMainManager: React.FC<NavMainManagerProps> = ({ items }) => {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                onClick={item.onClick}
                className={item.isActive ? "font-bold bg-gray-100 dark:bg-gray-800" : ""}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
