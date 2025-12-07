import { Trans, useLingui } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTRPC } from "@/trpc/react";

type FilterValue = "all" | "mine" | "public";

const GarmentListScreen = () => {
  const isMobile = useIsMobile();
  const { t } = useLingui();
  const trpc = useTRPC();
  const [filter, setFilter] = useState<FilterValue>("all");
  const garmentsQuery = useSuspenseQuery(
    trpc.garment.list.queryOptions({ includePublic: true })
  );

  const filteredGarments = garmentsQuery.data.filter((garment) => {
    if (filter === "all") return true;
    if (filter === "mine") return garment.isOwner !== false;
    return !garment.isOwner;
  });

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

      <Tabs
        defaultValue="all"
        onValueChange={(value) => setFilter(value as FilterValue)}
      >
        <TabsList>
          <TabsTrigger value="all">
            <Trans>All</Trans>
          </TabsTrigger>
          <TabsTrigger value="mine">
            <Trans>My Garments</Trans>
          </TabsTrigger>
          <TabsTrigger value="public">
            <Trans>Public</Trans>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredGarments.length === 0 ? (
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
          {filteredGarments.map((garment) => (
            <GarmentCard garment={garment} key={garment.id} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GarmentListScreen;
