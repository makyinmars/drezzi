import { Trans } from "@lingui/react/macro";
import {
  BookImage,
  LayoutDashboard,
  LifeBuoy,
  Settings2,
  Shirt,
  User,
  Wand2,
} from "lucide-react";
import type { NavConfig } from "@/types/navigation";

export const navigationConfig: NavConfig = {
  main: [
    {
      title: <Trans>Dashboard</Trans>,
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: <Trans>Catalog</Trans>,
      url: "/catalog",
      icon: Shirt,
    },
    {
      title: <Trans>Try-On</Trans>,
      url: "/try-on",
      icon: Wand2,
    },
    {
      title: <Trans>My Profiles</Trans>,
      url: "/profile",
      icon: User,
      items: [
        {
          title: <Trans>All Profiles</Trans>,
          url: "/profile",
        },
        {
          title: <Trans>New Profile</Trans>,
          url: "/profile/new",
        },
      ],
    },
    {
      title: <Trans>Lookbooks</Trans>,
      url: "/lookbooks",
      icon: BookImage,
    },
  ],
  secondary: [
    {
      title: <Trans>Settings</Trans>,
      url: "/settings",
      icon: Settings2,
    },
    {
      title: <Trans>Support</Trans>,
      url: "/support",
      icon: LifeBuoy,
    },
  ],
};
