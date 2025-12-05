import { Link, useLocation, useMatchRoute } from "@tanstack/react-router";
import { SidebarIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { navigationConfig } from "@/config/navigation";
import { APP_NAME } from "@/constants/app";
import type {
  NavItem,
  NavRoute,
  NavSubItem,
  ValidRoute,
} from "@/types/navigation";
import LanguageToggle from "./common/language-toogle";
import { ModeToggle } from "./common/mode-toggle";

const TRAILING_SLASH_REGEX = /\/+$/;

type BreadcrumbEntry = {
  label: ReactNode;
  href?: NavRoute;
};

type ActiveNav = {
  parent?: NavItem;
  child?: NavSubItem;
};

const navigationItems: NavItem[] = [
  ...navigationConfig.main,
  ...navigationConfig.secondary,
];

const normalizePath = (path: string) => {
  if (!path) {
    return "/";
  }

  if (path === "/") {
    return "/";
  }

  return path.replace(TRAILING_SLASH_REGEX, "");
};

const formatSegment = (segment: string) => {
  const decoded = decodeURIComponent(segment);
  const cleaned = decoded.replace(/-/g, " ");

  if (!cleaned) {
    return;
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const getTrailingLabel = (pathname: string, matched?: NavRoute) => {
  const normalizedPath = normalizePath(pathname);
  const normalizedMatch = matched ? normalizePath(matched) : "";

  if (normalizedMatch && normalizedPath.startsWith(normalizedMatch)) {
    const remainder = normalizedPath.slice(normalizedMatch.length);
    const segments = remainder.split("/").filter(Boolean);
    const lastSegment = segments.at(-1);

    if (lastSegment) {
      return formatSegment(lastSegment);
    }

    return;
  }

  const segments = normalizedPath.split("/").filter(Boolean);
  const lastSegment = segments.at(-1);

  return lastSegment ? formatSegment(lastSegment) : undefined;
};

const findActiveNav = (
  matchRoute: ReturnType<typeof useMatchRoute>
): ActiveNav => {
  for (const item of navigationItems) {
    const matchingChild = item.items?.find((subItem) =>
      matchRoute({
        to: subItem.url as ValidRoute,
      })
    );

    if (matchingChild) {
      return {
        parent: item,
        child: matchingChild,
      };
    }

    const matchesParent = matchRoute({
      to: item.url as ValidRoute,
      fuzzy: true,
    });

    if (matchesParent) {
      return {
        parent: item,
      };
    }
  }

  return {};
};

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  const location = useLocation();
  const matchRoute = useMatchRoute();
  const activeNav = findActiveNav(matchRoute);
  const matchedPath = activeNav.child?.url ?? activeNav.parent?.url;
  const trailingLabel = getTrailingLabel(location.pathname, matchedPath);
  const defaultRoot = (navigationConfig.main[0]?.url ?? "/") as NavRoute;
  const parentHref =
    activeNav.parent &&
    normalizePath(location.pathname) !== normalizePath(activeNav.parent.url)
      ? activeNav.parent.url
      : undefined;

  const breadcrumbs: BreadcrumbEntry[] = [
    {
      label: APP_NAME,
      href: defaultRoot,
    },
  ];

  if (activeNav.parent) {
    breadcrumbs.push({
      label: activeNav.parent.title,
      href: parentHref,
    });
  }

  if (activeNav.child) {
    breadcrumbs.push({
      label: activeNav.child.title,
    });
  } else if (trailingLabel) {
    breadcrumbs.push({
      label: trailingLabel,
    });
  }

  const renderBreadcrumbContent = (
    breadcrumb: BreadcrumbEntry,
    isLast: boolean
  ) => {
    if (isLast) {
      return <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>;
    }

    if (breadcrumb.href) {
      return (
        <BreadcrumbLink asChild>
          <Link preload="intent" to={breadcrumb.href as ValidRoute}>
            {breadcrumb.label}
          </Link>
        </BreadcrumbLink>
      );
    }

    return <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>;
  };

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b bg-background">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          onClick={toggleSidebar}
          size="icon"
          variant="ghost"
        >
          <SidebarIcon />
        </Button>
        <Separator className="mr-2 h-4" orientation="vertical" />
        <Breadcrumb className="hidden flex-1 sm:block">
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const key =
                typeof breadcrumb.label === "string"
                  ? breadcrumb.label
                  : `${breadcrumb.href ?? "breadcrumb"}-${index}`;

              return (
                <Fragment key={key}>
                  <BreadcrumbItem>
                    {renderBreadcrumbContent(breadcrumb, isLast)}
                  </BreadcrumbItem>
                  {isLast ? null : <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <LanguageToggle />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
