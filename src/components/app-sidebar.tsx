import { Trans } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { navigationConfig } from "@/config/navigation";
import { APP_LOGO_URL, APP_NAME } from "@/constants/app";
import { Route } from "@/routes/(authed)/route";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { auth } = Route.useRouteContext();

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link preload="intent" to="/">
                <img alt={APP_NAME} className="h-12 w-12" src={APP_LOGO_URL} />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{APP_NAME}</span>
                  <span className="truncate text-xs">
                    <Trans>Virtual Try-On</Trans>
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationConfig.main} />
        <NavSecondary className="mt-auto" items={navigationConfig.secondary} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: auth?.user.name ?? "",
            email: auth?.user.email ?? "",
            avatar: auth?.user.image ?? "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
