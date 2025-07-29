import * as React from "react"
import {
  BookOpen,
  Bot,
  Frame,
  Map,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { useSidebar } from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAppSelector } from "@/hooks/useAuth"
import Logo from "./logo"


// This is sample data.


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar(); 
  const state=useAppSelector((state)=>state.auth);
  console.log("state in dashboard ",state.user);
  const data = {
    navMain: [
      {
        title: "Home",
        icon: SquareTerminal,
      },
      {
        title: "Assessments",
        icon: Bot,
      },
      {
        title: "Interviews",
        icon: Frame,
      },
      {
        title: "Feedback",
        icon: BookOpen,
      },
      {
        title: "Profile",
        icon: Map,
      },
      {
        title: "Settings",
        icon: Settings2,
      },
    ]
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {open && <Logo />}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {state.user && state.user.first_name && state.user.email && state.user.profile_photo_url && (
          <NavUser
            user={{
              name: state.user.first_name,
              email: state.user.email,
              avatar: state.user.profile_photo_url,
            }}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
