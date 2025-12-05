import { useLingui } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Book, CheckCircle2, Shirt, Sparkles, User } from "lucide-react";

import PageHeader from "@/components/common/page-header";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatCard } from "@/components/dashboard/stat-card";
import { useTRPC } from "@/trpc/react";

const ACCENT_GOLD = "#d4a574";
const ACCENT_EMERALD = "#10b981";
const ACCENT_VIOLET = "#8b5cf6";
const ACCENT_SKY = "#0ea5e9";
const ACCENT_AMBER = "#f59e0b";

const DashboardScreen = () => {
  const { t } = useLingui();
  const trpc = useTRPC();

  const statsQuery = useSuspenseQuery(trpc.dashboard.stats.queryOptions());
  const activityQuery = useSuspenseQuery(
    trpc.dashboard.recentActivity.queryOptions()
  );

  const stats = statsQuery.data;

  return (
    <div className="space-y-8">
      <PageHeader
        description={t`Your virtual wardrobe at a glance`}
        title={t`Dashboard`}
      />

      {/* Stats Grid - Asymmetric editorial layout */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Hero stat - Total Try-Ons */}
        <StatCard
          accentColor={ACCENT_GOLD}
          description={t`All your virtual try-on sessions`}
          icon={Sparkles}
          index={0}
          title={t`Total Try-Ons`}
          value={stats.totalTryOns}
          variant="large"
        />

        {/* Lookbooks */}
        <StatCard
          accentColor={ACCENT_VIOLET}
          description={`${stats.publicLookbooks} ${t`shared publicly`}`}
          icon={Book}
          index={1}
          title={t`Lookbooks`}
          value={stats.totalLookbooks}
        />

        {/* Garments */}
        <StatCard
          accentColor={ACCENT_SKY}
          icon={Shirt}
          index={2}
          title={t`Garments`}
          value={stats.totalGarments}
        />

        {/* Success Rate - Wide card */}
        <StatCard
          accentColor={ACCENT_EMERALD}
          description={`${stats.completedTryOns} ${t`completed successfully`}`}
          icon={CheckCircle2}
          index={3}
          suffix="%"
          title={t`Success Rate`}
          value={stats.successRate}
          variant="wide"
        />

        {/* Body Profiles */}
        <StatCard
          accentColor={ACCENT_AMBER}
          icon={User}
          index={4}
          title={t`Body Profiles`}
          value={stats.totalProfiles}
        />
      </div>

      {/* In-progress indicator */}
      {(stats.pendingTryOns > 0 || stats.processingTryOns > 0) && (
        <div
          className="fade-in slide-in-from-bottom-2 animate-in rounded-xl border border-amber-500/20 bg-amber-500/5 fill-mode-both p-4"
          style={{ animationDelay: "500ms", animationDuration: "500ms" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">
                {stats.pendingTryOns + stats.processingTryOns}{" "}
                {t`try-ons in progress`}
              </p>
              <p className="text-amber-600/70 text-sm dark:text-amber-400/70">
                {stats.pendingTryOns > 0 &&
                  `${stats.pendingTryOns} ${t`pending`}`}
                {stats.pendingTryOns > 0 && stats.processingTryOns > 0 && ", "}
                {stats.processingTryOns > 0 &&
                  `${stats.processingTryOns} ${t`processing`}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Section */}
      <section
        className="fade-in animate-in fill-mode-both"
        style={{ animationDelay: "600ms", animationDuration: "500ms" }}
      >
        <h2 className="mb-4 font-bold text-2xl text-foreground tracking-tight">
          {t`Recent Activity`}
        </h2>
        <RecentActivity items={activityQuery.data} />
      </section>

      {/* Quick stats summary footer */}
      {stats.failedTryOns > 0 && (
        <div
          className="fade-in slide-in-from-bottom-2 animate-in rounded-xl border border-rose-500/20 bg-rose-500/5 fill-mode-both p-4"
          style={{ animationDelay: "700ms", animationDuration: "500ms" }}
        >
          <p className="text-rose-600 text-sm dark:text-rose-400">
            {stats.failedTryOns} {t`failed try-ons`} &middot;{" "}
            <a
              className="underline underline-offset-2"
              href="/try-ons?status=failed"
            >
              {t`View and retry`}
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardScreen;
