import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Clock,
  ExternalLink,
  Heart,
  HeartOff,
  RefreshCw,
  Shirt,
  Sparkles,
  Trash,
} from "lucide-react";
import { toast } from "sonner";

import LoadingState from "@/components/common/loading-state";
import MediaDisplay from "@/components/common/media-display";
import ButtonWithTooltip from "@/components/custom/button-with-tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/custom/sheet";
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
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTRPC } from "@/trpc/react";
import type { TryOnListProcedure } from "@/trpc/routers/tryOn";

import TryOnDelete from "./try-on-delete";
import TryOnProgress from "./try-on-progress";

type TryOnCardProps = {
  tryOn: TryOnListProcedure[number];
};

const TryOnCard = ({ tryOn }: TryOnCardProps) => {
  const isMobile = useIsMobile();
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
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.tryOn.favorites.queryKey(),
        });
      },
    })
  );

  const retryMutation = useMutation(
    trpc.tryOn.retry.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.tryOn.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.tryOn.byId.queryKey({ id: tryOn.id }),
          }),
        ]);
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

  const renderMediaContent = () => {
    if (tryOn.status === "completed" && tryOn.resultUrl) {
      return (
        <Link params={{ tryOnId: tryOn.id }} to="/try-on/$tryOnId">
          <img
            alt={t`Try-on result for ${tryOn.garment.name}`}
            className="h-full w-full cursor-pointer object-contain transition-opacity hover:opacity-90"
            src={tryOn.resultUrl}
          />
        </Link>
      );
    }
    if (tryOn.status === "failed") {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <TryOnProgress status={tryOn.status} />
        </div>
      );
    }
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60">
        <LoadingState
          centered={false}
          size="sm"
          text={tryOn.status === "processing" ? t`Generating...` : t`Queued`}
        />
      </div>
    );
  };

  return (
    <Card className="overflow-hidden pt-0">
      <MediaDisplay aspectRatio="4/5" className="lg:aspect-3/2" variant="card">
        {renderMediaContent()}
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant={statusVariant}>{tryOn.status}</Badge>
          {tryOn.isFavorite && (
            <Badge variant="secondary">
              <Heart className="h-3 w-3 fill-current" />
            </Badge>
          )}
        </div>
      </MediaDisplay>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="truncate">{tryOn.garment.name}</span>
          <Badge variant="outline">{tryOn.garment.category}</Badge>
        </CardTitle>
        {tryOn.processingMs && (
          <CardDescription className="flex items-center gap-2">
            <span className="flex items-center text-muted-foreground text-xs">
              <Clock className="mr-1 h-3 w-3" />
              {(tryOn.processingMs / 1000).toFixed(1)}s
            </span>
          </CardDescription>
        )}
      </CardHeader>
      {tryOn.errorMessage && (
        <CardContent className="pb-2">
          <p className="text-destructive text-sm">{tryOn.errorMessage}</p>
        </CardContent>
      )}
      <CardFooter className="flex gap-2 pt-2">
        {tryOn.status === "completed" && (
          <>
            <Button asChild size={isMobile ? "icon" : "sm"} variant="outline">
              <Link params={{ tryOnId: tryOn.id }} to="/try-on/$tryOnId">
                <ExternalLink />
                {!isMobile && <Trans>View</Trans>}
              </Link>
            </Button>
            <ButtonWithTooltip
              disabled={toggleFavoriteMutation.isPending}
              onClick={handleToggleFavorite}
              showTooltip={isMobile}
              size={isMobile ? "icon" : "sm"}
              tooltip={tryOn.isFavorite ? t`Unfavorite` : t`Favorite`}
              variant="outline"
            >
              {tryOn.isFavorite ? <HeartOff /> : <Heart />}
              {!isMobile &&
                (tryOn.isFavorite ? (
                  <Trans>Unfavorite</Trans>
                ) : (
                  <Trans>Favorite</Trans>
                ))}
            </ButtonWithTooltip>
          </>
        )}
        {tryOn.status === "failed" && (
          <ButtonWithTooltip
            disabled={retryMutation.isPending}
            onClick={handleRetry}
            showTooltip={isMobile}
            size={isMobile ? "icon" : "sm"}
            tooltip={t`Retry`}
            variant="outline"
          >
            <RefreshCw />
            {!isMobile && <Trans>Retry</Trans>}
          </ButtonWithTooltip>
        )}
        <Sheet>
          <SheetTrigger asChild>
            <Button size={isMobile ? "icon" : "sm"} variant="outline">
              <Shirt />
              {!isMobile && <Trans>Garment</Trans>}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{tryOn.garment.name}</SheetTitle>
              <SheetDescription>{tryOn.garment.category}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <img
                alt={tryOn.garment.name}
                className="w-full rounded-lg object-contain"
                src={tryOn.garment.imageUrl}
              />
              <Item size="sm" variant="muted">
                <ItemMedia variant="image">
                  <img
                    alt={tryOn.bodyProfile.name}
                    src={tryOn.bodyProfile.photoUrl}
                  />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{tryOn.bodyProfile.name}</ItemTitle>
                  <ItemDescription>
                    {tryOn.bodyProfile.fitPreference}
                  </ItemDescription>
                </ItemContent>
              </Item>
            </div>
          </SheetContent>
        </Sheet>
        {tryOn.styleTips && tryOn.styleTips.length > 0 && (
          <Sheet>
            <SheetTrigger asChild>
              <Button size={isMobile ? "icon" : "sm"} variant="outline">
                <Sparkles />
                {!isMobile && <Trans>Tips</Trans>}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  <Trans>Style Tips</Trans>
                </SheetTitle>
                <SheetDescription>
                  <Trans>Personalized recommendations for this look</Trans>
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                {tryOn.styleTips.map((tip) => (
                  <Item key={tip.id} size="sm" variant="muted">
                    <ItemContent>
                      <ItemTitle className="capitalize">
                        {tip.category}
                      </ItemTitle>
                      <ItemDescription className="line-clamp-none">
                        {tip.content}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}
        <TryOnDelete tryOn={tryOn}>
          <Button size={isMobile ? "icon" : "sm"} variant="destructive">
            <Trash />
            {!isMobile && <Trans>Delete</Trans>}
          </Button>
        </TryOnDelete>
      </CardFooter>
    </Card>
  );
};

export default TryOnCard;
