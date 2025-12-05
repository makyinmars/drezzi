import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Clock,
  ExternalLink,
  Heart,
  HeartOff,
  RefreshCw,
  Trash,
} from "lucide-react";
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
import type { TryOnListProcedure } from "@/trpc/routers/tryOn";

import TryOnDelete from "./try-on-delete";
import TryOnProgress from "./try-on-progress";

type TryOnCardProps = {
  tryOn: TryOnListProcedure[number];
};

const TryOnCard = ({ tryOn }: TryOnCardProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const toggleFavoriteMutation = useMutation(
    trpc.tryOn.toggleFavorite.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.tryOn.list.queryKey(),
        });

        const previousData = queryClient.getQueryData(
          trpc.tryOn.list.queryKey({})
        );

        queryClient.setQueryData(trpc.tryOn.list.queryKey({}), (old) => {
          if (!old) return previousData;
          return old.map((item) =>
            item.id === variables.id
              ? { ...item, isFavorite: !item.isFavorite }
              : item
          );
        });

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.tryOn.list.queryKey({}),
          context?.previousData
        );
      },
    })
  );

  const retryMutation = useMutation(
    trpc.tryOn.retry.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.tryOn.list.queryKey() });
      },
    })
  );

  const handleToggleFavorite = () => {
    toast.promise(toggleFavoriteMutation.mutateAsync({ id: tryOn.id }), {
      loading: tryOn.isFavorite
        ? t`Removing from favorites...`
        : t`Adding to favorites...`,
      success: () =>
        tryOn.isFavorite ? t`Removed from favorites` : t`Added to favorites`,
      error: (err) => t`Error updating favorite: ${err.message}`,
    });
  };

  const handleRetry = () => {
    toast.promise(retryMutation.mutateAsync({ id: tryOn.id }), {
      loading: t`Retrying try-on...`,
      success: t`Try-on restarted`,
      error: (err) => t`Failed to retry: ${err.message}`,
    });
  };

  const getStatusVariant = () => {
    if (tryOn.status === "completed") return "default";
    if (tryOn.status === "failed") return "destructive";
    return "secondary";
  };
  const statusVariant = getStatusVariant();

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        {tryOn.status === "completed" && tryOn.resultUrl ? (
          <Link params={{ tryOnId: tryOn.id }} to="/try-on/$tryOnId">
            <img
              alt={t`Try-on result for ${tryOn.garment.name}`}
              className="h-full w-full cursor-pointer object-cover transition-opacity hover:opacity-90"
              src={tryOn.resultUrl}
            />
          </Link>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <TryOnProgress status={tryOn.status} />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant={statusVariant}>{tryOn.status}</Badge>
          {tryOn.isFavorite && (
            <Badge variant="secondary">
              <Heart className="h-3 w-3 fill-current" />
            </Badge>
          )}
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{tryOn.garment.name}</span>
          <Badge variant="outline">{tryOn.garment.category}</Badge>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span>{tryOn.bodyProfile.name}</span>
          {tryOn.processingMs && (
            <span className="flex items-center text-muted-foreground text-xs">
              <Clock className="mr-1 h-3 w-3" />
              {(tryOn.processingMs / 1000).toFixed(1)}s
            </span>
          )}
        </CardDescription>
      </CardHeader>
      {tryOn.errorMessage && (
        <CardContent className="pb-2">
          <p className="text-destructive text-sm">{tryOn.errorMessage}</p>
        </CardContent>
      )}
      <CardFooter className="flex gap-2 pt-2">
        {tryOn.status === "completed" && (
          <>
            <Button asChild size="sm" variant="outline">
              <Link params={{ tryOnId: tryOn.id }} to="/try-on/$tryOnId">
                <ExternalLink className="mr-1 h-3 w-3" />
                <Trans>View</Trans>
              </Link>
            </Button>
            <Button
              disabled={toggleFavoriteMutation.isPending}
              onClick={handleToggleFavorite}
              size="sm"
              variant="outline"
            >
              {tryOn.isFavorite ? (
                <>
                  <HeartOff className="mr-1 h-3 w-3" />
                  <Trans>Unfavorite</Trans>
                </>
              ) : (
                <>
                  <Heart className="mr-1 h-3 w-3" />
                  <Trans>Favorite</Trans>
                </>
              )}
            </Button>
          </>
        )}
        {tryOn.status === "failed" && (
          <Button
            disabled={retryMutation.isPending}
            onClick={handleRetry}
            size="sm"
            variant="outline"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            <Trans>Retry</Trans>
          </Button>
        )}
        <TryOnDelete tryOn={tryOn}>
          <Button size="sm" variant="destructive">
            <Trash className="mr-1 h-3 w-3" />
            <Trans>Delete</Trans>
          </Button>
        </TryOnDelete>
      </CardFooter>
    </Card>
  );
};

export default TryOnCard;
