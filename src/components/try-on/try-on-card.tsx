import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Clock,
  ExternalLink,
  Heart,
  HeartOff,
  MoreHorizontal,
  RefreshCw,
  Shirt,
  Sparkles,
  Trash,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import CardMediaDisplay from "@/components/custom/card-media-display";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/custom/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import type { TryOnStage } from "@/lib/websocket-publisher";
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
  const navigate = useNavigate();
  const [garmentSheetOpen, setGarmentSheetOpen] = useState(false);
  const [tipsSheetOpen, setTipsSheetOpen] = useState(false);

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

  const handleNavigate = () => {
    if (tryOn.status === "completed" && tryOn.resultUrl) {
      navigate({ to: "/try-on/$tryOnId", params: { tryOnId: tryOn.id } });
    }
  };

  const getStatusVariant = () => {
    if (tryOn.status === "completed") return "default";
    if (tryOn.status === "failed") return "destructive";
    return "secondary";
  };
  const statusVariant = getStatusVariant();

  const statusBadges = (
    <div className="flex gap-1">
      <Badge variant={statusVariant}>{tryOn.status}</Badge>
      {tryOn.isFavorite && (
        <Badge variant="secondary">
          <Heart className="h-3 w-3 fill-current" />
        </Badge>
      )}
    </div>
  );

  const actionsMenu = (
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
        {tryOn.status === "completed" && (
          <>
            <DropdownMenuItem asChild>
              <Link params={{ tryOnId: tryOn.id }} to="/try-on/$tryOnId">
                <ExternalLink className="mr-2 h-4 w-4" />
                <Trans>View</Trans>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={toggleFavoriteMutation.isPending}
              onClick={handleToggleFavorite}
            >
              {tryOn.isFavorite ? (
                <>
                  <HeartOff className="mr-2 h-4 w-4" />
                  <Trans>Unfavorite</Trans>
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  <Trans>Favorite</Trans>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {tryOn.status === "failed" && (
          <>
            <DropdownMenuItem
              disabled={retryMutation.isPending}
              onClick={handleRetry}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              <Trans>Retry</Trans>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => setGarmentSheetOpen(true)}>
          <Shirt className="mr-2 h-4 w-4" />
          <Trans>Garment</Trans>
        </DropdownMenuItem>
        {tryOn.styleTips && tryOn.styleTips.length > 0 && (
          <DropdownMenuItem onClick={() => setTipsSheetOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            <Trans>Style Tips</Trans>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <TryOnDelete tryOn={tryOn}>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(e) => e.preventDefault()}
          >
            <Trash className="mr-2 h-4 w-4" />
            <Trans>Delete</Trans>
          </DropdownMenuItem>
        </TryOnDelete>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const customMedia =
    tryOn.status !== "completed" || !tryOn.resultUrl ? (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60">
        <TryOnProgress
          stage={(tryOn as { stage?: TryOnStage }).stage}
          status={tryOn.status}
        />
      </div>
    ) : undefined;

  return (
    <>
      <CardMediaDisplay
        alt={t`Try-on result for ${tryOn.garment.name}`}
        aspectRatio="4/5"
        customMedia={customMedia}
        imageUrl={
          tryOn.status === "completed" && tryOn.resultUrl
            ? tryOn.resultUrl
            : undefined
        }
        onClick={
          tryOn.status === "completed" && tryOn.resultUrl
            ? handleNavigate
            : undefined
        }
        topLeft={statusBadges}
        topRight={actionsMenu}
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-semibold text-sm">
              {tryOn.garment.name}
            </span>
            <Badge className="shrink-0" variant="outline">
              {tryOn.garment.category}
            </Badge>
          </div>
          {tryOn.processingMs && (
            <span className="flex items-center text-muted-foreground text-xs">
              <Clock className="mr-1 h-3 w-3" />
              {(tryOn.processingMs / 1000).toFixed(1)}s
            </span>
          )}
          {tryOn.errorMessage && (
            <p className="text-destructive text-xs">{tryOn.errorMessage}</p>
          )}
        </div>
      </CardMediaDisplay>

      <Sheet onOpenChange={setGarmentSheetOpen} open={garmentSheetOpen}>
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
        <Sheet onOpenChange={setTipsSheetOpen} open={tipsSheetOpen}>
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
                    <ItemTitle className="capitalize">{tip.category}</ItemTitle>
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
    </>
  );
};

export default TryOnCard;
