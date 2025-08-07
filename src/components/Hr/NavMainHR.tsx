// src/components/nav-main-hr.tsx
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { setCurrentHRPage } from "@/features/Org/View/hrViewSlice";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function NavMainHR({
  items,
}: {
  items: { title: string; icon: React.ElementType; onClick?: () => void }[];
}) {
  const currentView = useSelector((state: RootState) => state.hrView.currentHRPage);
  const dispatch = useDispatch();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>HR Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const viewKey = item.title.toLowerCase().replace(/\s+/g, "-");
          const isActive = currentView === viewKey;
          
          return (
            <SidebarMenuItem key={viewKey}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick(); // Use custom onClick if provided
                  } else {
                    dispatch(setCurrentHRPage(viewKey as any)); // Fallback
                  }
                }}
                className={cn(
                  "flex items-center gap-2 w-full text-sm transition-colors",
                  isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-primary"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
