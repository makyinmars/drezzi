import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, EyeOff, Trash } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        <img
          alt={garment.name}
          className="h-full w-full object-cover"
          src={garment.imageUrl}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          {garment.isPublic && (
            <Badge variant="secondary">
              <Eye className="mr-1 h-3 w-3" />
              <Trans>Public</Trans>
            </Badge>
          )}
          {!isOwner && (
            <Badge variant="outline">
              <Trans>Shared</Trans>
            </Badge>
          )}
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{garment.name}</span>
          <Badge variant="outline">{garment.category}</Badge>
        </CardTitle>
        <CardDescription>
          {garment.brand ? (
            <span>{garment.brand}</span>
          ) : (
            <Trans>No brand specified</Trans>
          )}
          {garment.price !== null && (
            <span className="ml-2">
              {garment.currency} {garment.price.toFixed(2)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      {(garment.colors.length > 0 || garment.sizes.length > 0) && (
        <CardContent className="pb-2">
          <div className="flex flex-wrap gap-1">
            {garment.colors.slice(0, 3).map((color) => (
              <Badge key={color} variant="secondary">
                {color}
              </Badge>
            ))}
            {garment.sizes.slice(0, 3).map((size) => (
              <Badge key={size} variant="outline">
                {size}
              </Badge>
            ))}
          </div>
        </CardContent>
      )}
      {isOwner && (
        <CardFooter className="flex gap-2 pt-2">
          <GarmentForm garment={garment}>
            <Button size="sm" variant="outline">
              <Edit className="mr-1 h-3 w-3" />
              <Trans>Edit</Trans>
            </Button>
          </GarmentForm>
          <Button
            disabled={togglePublicMutation.isPending}
            onClick={handleTogglePublic}
            size="sm"
            variant="outline"
          >
            {garment.isPublic ? (
              <>
                <EyeOff className="mr-1 h-3 w-3" />
                <Trans>Make Private</Trans>
              </>
            ) : (
              <>
                <Eye className="mr-1 h-3 w-3" />
                <Trans>Make Public</Trans>
              </>
            )}
          </Button>
          <GarmentDelete garment={garment}>
            <Button size="sm" variant="destructive">
              <Trash className="mr-1 h-3 w-3" />
              <Trans>Delete</Trans>
            </Button>
          </GarmentDelete>
        </CardFooter>
      )}
    </Card>
  );
};

export default GarmentCard;
