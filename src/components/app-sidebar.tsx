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
import { useSidebar } from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useAppSelector } from "@/hooks/useAuth"
import Logo from "./logo"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar()
  const state = useAppSelector((state) => state.auth)

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
    ],
  }

  return (
    <Sidebar
      collapsible="icon"
      className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700"
      {...props}
    >
      <SidebarHeader className="border-b border-gray-200 dark:border-gray-700">
        {open && <Logo />}
      </SidebarHeader>

      <SidebarContent className="bg-white dark:bg-gray-900">
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 dark:border-gray-700">
        {state.user &&
          state.user.first_name &&
          state.user.email &&
          state.user.profile_photo_url && (
            <NavUser
              user={{
                name: state.user.first_name,
                email: state.user.email,
                avatar: state.user.profile_photo_url.url,
              }}
            />
          )}
      </SidebarFooter>
    </Sidebar>
  )
}
