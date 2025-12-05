import type { LucideIcon } from "lucide-react";
import type { FileRouteTypes } from "@/routeTree.gen";

// Valid routes from the generated route tree
export type ValidRoute = FileRouteTypes["to"];

// No placeholder routes needed - all routes exist
export type PlaceholderRoute = never;

// Combined type for all navigation URLs
export type NavRoute = ValidRoute | PlaceholderRoute;

export type NavSubItem = {
  title: React.ReactNode;
  url: NavRoute;
};

export type NavItem = {
  title: React.ReactNode;
  url: NavRoute;
  icon: LucideIcon;
  isActive?: boolean;
  disabled?: boolean;
  items?: NavSubItem[];
};

export type NavConfig = {
  main: NavItem[];
  secondary: NavItem[];
};
