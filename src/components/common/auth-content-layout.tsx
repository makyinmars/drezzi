import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const AuthContentLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="[--header-height:calc(--spacing(14))]">
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1">
        <AppSidebar />
        <SidebarInset>
          <div className="relative flex flex-1 flex-col gap-4 p-4 md:p-6">
            <div
              className="pointer-events-none fixed inset-0"
              style={{
                background: `
                  radial-gradient(ellipse at 0% 0%,
                    color-mix(in oklch, var(--primary) 6%, transparent) 0%,
                    transparent 50%
                  ),
                  radial-gradient(ellipse at 100% 100%,
                    color-mix(in oklch, var(--accent) 4%, transparent) 0%,
                    transparent 40%
                  )
                `,
              }}
            />
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  </div>
);

export default AuthContentLayout;
