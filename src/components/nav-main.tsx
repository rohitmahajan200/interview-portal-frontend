import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { setCurrentView } from "@/features/view/viewSlice";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: { title: string; icon: React.ElementType }[];
}) {
  const currentView = useSelector((state: RootState) => state.view.currentView);
  const dispatch = useDispatch();
  

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const viewKey = item.title.toLowerCase().replace(/\s+/g, "-");

          const isActive = currentView === viewKey;
          return (
            <SidebarMenuItem key={viewKey}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => dispatch(setCurrentView(viewKey))}
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
