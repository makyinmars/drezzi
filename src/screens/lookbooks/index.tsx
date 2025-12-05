import { Trans, useLingui } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import PageHeader from "@/components/common/page-header";
import LookbookCard from "@/components/lookbook/lookbook-card";
import LookbookForm from "@/components/lookbook/lookbook-form";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/react";

const LookbookListScreen = () => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const lookbooksQuery = useSuspenseQuery(trpc.lookbook.list.queryOptions());

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <LookbookForm>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              <Trans>Create Lookbook</Trans>
            </Button>
          </LookbookForm>
        }
        description={t`Curate and share your favorite try-on looks`}
        title={t`Lookbooks`}
      />

      {lookbooksQuery.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="mb-2 font-medium text-lg">
            <Trans>No lookbooks yet</Trans>
          </h3>
          <p className="mb-4 text-muted-foreground text-sm">
            <Trans>
              Create your first lookbook to start curating your try-on results.
            </Trans>
          </p>
          <LookbookForm>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              <Trans>Create Your First Lookbook</Trans>
            </Button>
          </LookbookForm>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lookbooksQuery.data.map((lookbook) => (
            <LookbookCard key={lookbook.id} lookbook={lookbook} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LookbookListScreen;
