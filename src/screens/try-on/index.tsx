import { Trans, useLingui } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Suspense } from "react";

import PageHeader from "@/components/common/page-header";
import TryOnCard from "@/components/try-on/try-on-card";
import TryOnForm from "@/components/try-on/try-on-form";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTRPC } from "@/trpc/react";

const TryOnListScreen = () => {
  const isMobile = useIsMobile();
  const { t } = useLingui();
  const trpc = useTRPC();
  const tryOnsQuery = useSuspenseQuery(trpc.tryOn.list.queryOptions({}));

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Suspense
            fallback={
              <Button disabled>
                <Sparkles className="mr-2 h-4 w-4" />
                <Trans>New Try-On</Trans>
              </Button>
            }
          >
            <TryOnForm>
              <Button size={isMobile ? "icon" : "default"}>
                <Sparkles className="size-4" />
                {!isMobile && <Trans>New Try-On</Trans>}
              </Button>
            </TryOnForm>
          </Suspense>
        }
        description={t`See how clothes look on you with AI-powered virtual try-on`}
        title={t`Virtual Try-On`}
      />

      {tryOnsQuery.data.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Sparkles className="h-5 w-5" />
            </EmptyMedia>
            <EmptyTitle>
              <Trans>No try-ons yet</Trans>
            </EmptyTitle>
            <EmptyDescription>
              <Trans>
                Start your first virtual try-on to see how clothes look on you.
              </Trans>
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Suspense fallback={<Skeleton className="h-10 w-40" />}>
              <TryOnForm>
                <Button size={isMobile ? "icon" : "default"}>
                  <Sparkles className="size-4" />
                  {!isMobile && <Trans>Start Your First Try-On</Trans>}
                </Button>
              </TryOnForm>
            </Suspense>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {tryOnsQuery.data.map((tryOn) => (
            <TryOnCard key={tryOn.id} tryOn={tryOn} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TryOnListScreen;
