import { Trans, useLingui } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import PageHeader from "@/components/common/page-header";
import GarmentCard from "@/components/garment/garment-card";
import GarmentForm from "@/components/garment/garment-form";
import { Button } from "@/components/ui/button";
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
        description={t`Manage your wardrobe for virtual try-ons`}
        title={t`My Wardrobe`}
      />

      {garmentsQuery.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="mb-2 font-medium text-lg">
            <Trans>No garments yet</Trans>
          </h3>
          <p className="mb-4 text-muted-foreground text-sm">
            <Trans>
              Add your first garment to start building your virtual wardrobe.
            </Trans>
          </p>
          <GarmentForm>
            <Button size={isMobile ? "icon" : "default"}>
              <Plus className="size-4" />
              {!isMobile && <Trans>Add Your First Garment</Trans>}
            </Button>
          </GarmentForm>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {garmentsQuery.data.map((garment) => (
            <GarmentCard garment={garment} key={garment.id} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GarmentListScreen;
