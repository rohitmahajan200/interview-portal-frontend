// src/components/HR/NavMainHR.tsx
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { setCurrentHRPage, type HRPage } from "@/features/Org/View/HrViewSlice";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  icon: React.ElementType;
  page: HRPage;
  badge?: number;
};

export default function NavMainHR({ items }: { items: NavItem[] }) {
  const currentView = useSelector(
    (state: RootState) => state.hrView.currentHRPage
  );
  const dispatch = useDispatch();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>HR Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = currentView === item.page;

          return (
            <SidebarMenuItem key={item.page}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => dispatch(setCurrentHRPage(item.page))}
                className={cn(
                  "flex items-center gap-2 w-full text-sm transition-colors justify-between",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </span>

                {typeof item.badge === "number" && item.badge > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1.5 py-0 h-5">
                    {item.badge}
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
