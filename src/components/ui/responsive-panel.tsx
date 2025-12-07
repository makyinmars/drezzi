import type * as React from "react";
import { createContext, useContext, useState } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/custom/sheet";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type ResponsivePanelContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
};

const ResponsivePanelContext =
  createContext<ResponsivePanelContextValue | null>(null);

function useResponsivePanel() {
  const context = useContext(ResponsivePanelContext);
  if (!context) {
    throw new Error(
      "ResponsivePanel components must be used within a ResponsivePanel"
    );
  }
  return context;
}

type ResponsivePanelProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function ResponsivePanel({
  children,
  open: controlledOpen,
  onOpenChange,
}: ResponsivePanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isMobile = useIsMobile();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value);
    }
    onOpenChange?.(value);
  };

  const Root = isMobile ? Drawer : Sheet;

  return (
    <ResponsivePanelContext.Provider
      value={{ open, onOpenChange: handleOpenChange, isMobile }}
    >
      <Root onOpenChange={handleOpenChange} open={open}>
        {children}
      </Root>
    </ResponsivePanelContext.Provider>
  );
}

function ResponsivePanelTrigger({
  className,
  children,
  asChild,
  ...props
}: React.ComponentProps<typeof DrawerTrigger>) {
  const { isMobile } = useResponsivePanel();
  const Trigger = isMobile ? DrawerTrigger : SheetTrigger;

  return (
    <Trigger asChild={asChild} className={className} {...props}>
      {children}
    </Trigger>
  );
}

function ResponsivePanelContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerContent>) {
  const { isMobile } = useResponsivePanel();

  if (isMobile) {
    return (
      <DrawerContent className={className} {...props}>
        {children}
      </DrawerContent>
    );
  }

  return (
    <SheetContent className={cn("sm:max-w-md", className)} {...props}>
      {children}
    </SheetContent>
  );
}

function ResponsivePanelHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile } = useResponsivePanel();
  const Header = isMobile ? DrawerHeader : SheetHeader;

  return <Header className={className} {...props} />;
}

function ResponsivePanelFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { isMobile } = useResponsivePanel();
  const Footer = isMobile ? DrawerFooter : SheetFooter;

  return <Footer className={className} {...props} />;
}

function ResponsivePanelTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerTitle>) {
  const { isMobile } = useResponsivePanel();
  const Title = isMobile ? DrawerTitle : SheetTitle;

  return <Title className={className} {...props} />;
}

function ResponsivePanelDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerDescription>) {
  const { isMobile } = useResponsivePanel();
  const Description = isMobile ? DrawerDescription : SheetDescription;

  return <Description className={className} {...props} />;
}

function ResponsivePanelClose({
  className,
  children,
  asChild,
  ...props
}: React.ComponentProps<typeof DrawerClose>) {
  const { isMobile } = useResponsivePanel();
  const Close = isMobile ? DrawerClose : SheetClose;

  return (
    <Close asChild={asChild} className={className} {...props}>
      {children}
    </Close>
  );
}

export {
  ResponsivePanel,
  ResponsivePanelTrigger,
  ResponsivePanelContent,
  ResponsivePanelHeader,
  ResponsivePanelFooter,
  ResponsivePanelTitle,
  ResponsivePanelDescription,
  ResponsivePanelClose,
};
