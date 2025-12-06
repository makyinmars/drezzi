import { Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { APP_LOGO_URL, APP_NAME } from "@/constants/app";
import { useTRPC } from "@/trpc/react";
import { Button } from "../ui/button";
import LanguageToggle from "./language-toogle";
import { ModeToggle } from "./mode-toggle";

const ContentLayout = ({ children }: { children: React.ReactNode }) => {
  const trpc = useTRPC();
  const sessionQuery = useQuery(trpc.auth.getSession.queryOptions());

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <motion.nav
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 right-0 left-0 z-40 border-border/40 border-b bg-background/95 backdrop-blur-sm"
        initial={{ y: -100, opacity: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link className="flex items-center gap-3" to="/">
            <img alt={APP_NAME} className="h-12 w-12" src={APP_LOGO_URL} />
            <span className="hidden font-bold text-2xl tracking-tight md:block">
              {APP_NAME}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {sessionQuery.data && (
              <Link to="/dashboard">
                <Button variant="outline">
                  <Trans>Dashboard</Trans>
                </Button>
              </Link>
            )}
            {!sessionQuery.data && (
              <Link to="/auth">
                <Button variant="outline">
                  <Trans>Sign In</Trans>
                </Button>
              </Link>
            )}
            <ModeToggle />
            <LanguageToggle />
          </div>
        </div>
      </motion.nav>

      {children}
      {/* Footer */}
      <footer className="z-10 border-border border-t bg-background py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <img alt={APP_NAME} className="h-16 w-16" src={APP_LOGO_URL} />
              <span className="font-medium text-base">{APP_NAME}</span>
            </div>
            <div className="flex items-center gap-6 text-muted-foreground text-sm">
              <Link className="hover:text-foreground" to="/privacy-policy">
                <Trans>Privacy Policy</Trans>
              </Link>
              <Link className="hover:text-foreground" to="/terms-of-service">
                <Trans>Terms of Service</Trans>
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} {APP_NAME}.{" "}
              <Trans>All rights reserved.</Trans>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContentLayout;
