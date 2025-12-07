import { Trans, useLingui } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import PageHeader from "@/components/common/page-header";
import LookbookCard from "@/components/lookbook/lookbook-card";
import LookbookForm from "@/components/lookbook/lookbook-form";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTRPC } from "@/trpc/react";

const LookbookListScreen = () => {
  const isMobile = useIsMobile();
  const { t } = useLingui();
  const trpc = useTRPC();
  const lookbooksQuery = useSuspenseQuery(trpc.lookbook.list.queryOptions());

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <LookbookForm>
            <Button size={isMobile ? "icon" : "default"}>
              <Plus className="size-4" />
              {!isMobile && <Trans>Create Lookbook</Trans>}
            </Button>
          </LookbookForm>
        }
        description={t`Curate and share your favorite try-on looks`}
        title={t`Lookbooks`}
      />

      {lookbooksQuery.data.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plus className="h-5 w-5" />
            </EmptyMedia>
            <EmptyTitle>
              <Trans>No lookbooks yet</Trans>
            </EmptyTitle>
            <EmptyDescription>
              <Trans>
                Create your first lookbook to start curating your try-on
                results.
              </Trans>
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <LookbookForm>
              <Button size={isMobile ? "icon" : "default"}>
                <Plus className="size-4" />
                {!isMobile && <Trans>Create Your First Lookbook</Trans>}
              </Button>
            </LookbookForm>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {lookbooksQuery.data.map((lookbook) => (
            <LookbookCard key={lookbook.id} lookbook={lookbook} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LookbookListScreen;
