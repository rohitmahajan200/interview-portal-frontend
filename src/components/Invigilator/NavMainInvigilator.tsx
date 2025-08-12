// src/components/Invigilator/NavMainInvigilator.tsx
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function NavMainINVIGILATOR({ items }: { items: Array<{
  title: string;
  icon: React.ElementType;
  isActive?: boolean;
  onClick: () => void;
}> }) {
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
}
