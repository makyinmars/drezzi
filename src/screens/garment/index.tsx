import { Trans, useLingui } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import PageHeader from "@/components/common/page-header";
import GarmentCard from "@/components/garment/garment-card";
import GarmentForm from "@/components/garment/garment-form";
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

const GarmentListScreen = () => {
  const isMobile = useIsMobile();
  const { t } = useLingui();
  const trpc = useTRPC();
  const garmentsQuery = useSuspenseQuery(
    trpc.garment.list.queryOptions({ includePublic: false })
  );

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <GarmentForm>
            <Button size={isMobile ? "icon" : "default"}>
              <Plus className="size-4" />
              {!isMobile && <Trans>Add Garment</Trans>}
            </Button>
          </GarmentForm>
        }
        description={t`Manage your garments for virtual try-ons`}
        title={t`My Garments`}
      />

      {garmentsQuery.data.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plus className="h-5 w-5" />
            </EmptyMedia>
            <EmptyTitle>
              <Trans>No garments yet</Trans>
            </EmptyTitle>
            <EmptyDescription>
              <Trans>
                Add your first garment to start building your virtual wardrobe.
              </Trans>
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <GarmentForm>
              <Button size={isMobile ? "icon" : "default"}>
                <Plus className="size-4" />
                {!isMobile && <Trans>Add Your First Garment</Trans>}
              </Button>
            </GarmentForm>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {garmentsQuery.data.map((garment) => (
            <GarmentCard garment={garment} key={garment.id} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GarmentListScreen;
