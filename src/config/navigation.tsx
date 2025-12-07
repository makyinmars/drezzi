import { Trans } from "@lingui/react/macro";
import {
  Archive,
  BookImage,
  LayoutDashboard,
  LifeBuoy,
  Settings2,
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
      title: <Trans>Try-On</Trans>,
      url: "/try-on",
      icon: Wand2,
    },
    {
      title: <Trans>My Garments</Trans>,
      url: "/garment",
      icon: Archive,
      items: [
        {
          title: <Trans>All Garments</Trans>,
          url: "/garment",
        },
        {
          title: <Trans>Add Garment</Trans>,
          url: "/garment/new",
        },
      ],
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
      items: [
        {
          title: <Trans>All Lookbooks</Trans>,
          url: "/lookbooks",
        },
      ],
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
