import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, EyeOff, MoreHorizontal, Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import CardMediaDisplay from "@/components/custom/card-media-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTRPC } from "@/trpc/react";
import type { GarmentListProcedure } from "@/trpc/routers/garment";
import GarmentDelete from "./garment-delete";
import GarmentForm from "./garment-form";

type GarmentCardProps = {
  garment: GarmentListProcedure[number];
};

const GarmentCard = ({ garment }: GarmentCardProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const togglePublicMutation = useMutation(
    trpc.garment.togglePublic.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.garment.list.queryKey(),
        });

        const previousData = queryClient.getQueryData(
          trpc.garment.list.queryKey({ includePublic: false })
        );

        queryClient.setQueryData(
          trpc.garment.list.queryKey({ includePublic: false }),
          (old) => {
            if (!old) return previousData;
            return old.map((g) =>
              g.id === variables.id ? { ...g, isPublic: !g.isPublic } : g
            );
          }
        );

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.garment.list.queryKey({ includePublic: false }),
          context?.previousData
        );
      },
      onSettled: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.garment.byId.queryKey({ id: garment.id }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.garment.publicList.queryKey(),
          }),
        ]);
      },
    })
  );

  const handleTogglePublic = () => {
    toast.promise(togglePublicMutation.mutateAsync({ id: garment.id }), {
      loading: garment.isPublic ? t`Making private...` : t`Making public...`,
      success: () =>
        garment.isPublic
          ? t`"${garment.name}" is now private`
          : t`"${garment.name}" is now public`,
      error: (err) => t`Error updating visibility: ${err.message}`,
    });
  };

  const isOwner = garment.isOwner !== false;

  const buildSubtitleBadges = () => {
    const badges: string[] = [];
    if (garment.brand) badges.push(garment.brand);
    if (garment.price !== null) {
      badges.push(`${garment.currency} ${garment.price.toFixed(2)}`);
    }
    badges.push(garment.category);
    return badges;
  };

  const buildNote = () => {
    const parts: string[] = [];
    if (garment.colors.length > 0) {
      parts.push(garment.colors.slice(0, 3).join(", "));
    }
    if (garment.sizes.length > 0) {
      parts.push(garment.sizes.slice(0, 3).join(", "));
    }
    return parts.length > 0 ? parts.join(" · ") : null;
  };

  const statusBadges =
    garment.isPublic || !isOwner ? (
      <div className="flex gap-1">
        {garment.isPublic && (
          <Badge variant="secondary">
            <Eye className="mr-1 h-3 w-3" />
            <Trans>Public</Trans>
          </Badge>
        )}
        {!isOwner && (
          <Badge variant="secondary">
            <Trans>Shared</Trans>
          </Badge>
        )}
      </div>
    ) : undefined;

  const actionsMenu = isOwner ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          size="icon"
          variant="secondary"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setFormOpen(true)}>
          <Edit />
          <Trans>Edit</Trans>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={togglePublicMutation.isPending}
          onClick={handleTogglePublic}
        >
          {garment.isPublic ? (
            <>
              <EyeOff />
              <Trans>Make Private</Trans>
            </>
          ) : (
            <>
              <Eye />
              <Trans>Make Public</Trans>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setDeleteOpen(true)}
          variant="destructive"
        >
          <Trash />
          <Trans>Delete</Trans>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : undefined;

  const note = buildNote();

  return (
    <>
      <CardMediaDisplay
        alt={garment.name}
        imageUrl={garment.imageUrl}
        topLeft={statusBadges}
        topRight={actionsMenu}
      >
        <h3 className="truncate font-medium text-foreground">{garment.name}</h3>
        <div className="mt-0.5 flex flex-wrap gap-1">
          {buildSubtitleBadges().map((label) => (
            <Badge key={label} variant="outline">
              {label}
            </Badge>
          ))}
        </div>
        {note && <p>{note}</p>}
      </CardMediaDisplay>
      <GarmentForm
        garment={garment}
        onOpenChange={setFormOpen}
        open={formOpen}
      />
      <GarmentDelete
        garment={garment}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
      />
    </>
  );
};

export default GarmentCard;
