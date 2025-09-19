// src/components/Invigilator/NavMainInvigilator.tsx
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/app/store";
import {
  setCurrentInvigilatorPage,
  type InvigilatorPage,
} from "@/features/Org/View/invigilatorViewSlice";
import {
  SidebarGroup,
  SidebarGroupContent,
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
  page: InvigilatorPage;
  badge?: number;
  isActive: boolean;
  onClick: () => void;
};

export default function NavMainINVIGILATOR({ items }: { items: NavItem[] }) {
  const currentView = useSelector(
    (state: RootState) => state.invigilator.currentHRPage
  );
  const dispatch = useDispatch();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Invigilator Menu</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = currentView === item.page;

            return (
              <SidebarMenuItem key={item.page}>
                <SidebarMenuButton
                  tooltip={item.title}
                  onClick={() => dispatch(setCurrentInvigilatorPage(item.page))}
                  className={cn(
                    "flex items-center gap-2 w-full text-sm transition-colors justify-between",
                    isActive
                      ? "text-primary font-medium bg-gray-100 dark:bg-gray-800"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="capitalize flex-1">{item.title}</span>
                 

                  {typeof item.badge === "number" && item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-2 px-1.5 py-0 h-5"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
