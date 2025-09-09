import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import { setCurrentAdminPage } from "@/features/Org/View/adminViewSlice";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge"; // Add this import
import { cn } from "@/lib/utils";

export function NavMainAdmin({
  items,
}: {
  items: {
    title: string;
    icon: React.ElementType;
    onClick?: () => void;
    badge?: number;
  }[]; // Add badge support
}) {
  const currentView = useSelector(
    (state: RootState) => state.adminView.currentAdminPage
  );
  const dispatch = useDispatch();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin Menu</SidebarGroupLabel>
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
                    item.onClick();
                  } else {
                    dispatch(setCurrentAdminPage(viewKey as any));
                  }
                }}
                className={cn(
                  "flex items-center gap-2 w-full text-sm transition-colors",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="capitalize flex-1">{item.title}</span>
                {item.badge &&
                  item.badge > 0 && ( // Add badge display
                    <Badge
                      variant="destructive"
                      className="ml-auto text-xs px-1 py-0 min-w-[16px] h-4"
                    >
                      {item.badge > 99 ? "99+" : item.badge}
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
