import { Trans, useLingui } from "@lingui/react/macro";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clock,
  Heart,
  HeartOff,
  RefreshCw,
  Sparkles,
  Trash,
} from "lucide-react";
import { Suspense } from "react";
import { toast } from "sonner";

import PageHeader from "@/components/common/page-header";
import StyleTipCard from "@/components/style-tip/style-tip-card";
import TryOnDelete from "@/components/try-on/try-on-delete";
import TryOnForm from "@/components/try-on/try-on-form";
import TryOnProgress from "@/components/try-on/try-on-progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTRPC } from "@/trpc/react";
import type { RouterOutput } from "@/trpc/utils";

const Route = getRouteApi("/(authed)/try-on/$tryOnId");

const TryOnDetailScreen = () => {
  const isMobile = useIsMobile();
  const { t } = useLingui();
  const { tryOnId } = Route.useParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const tryOnQuery = useSuspenseQuery(
    trpc.tryOn.byId.queryOptions({ id: tryOnId })
  );
  const tryOn = tryOnQuery.data as RouterOutput["tryOn"]["byId"];

  const toggleFavoriteMutation = useMutation(
    trpc.tryOn.toggleFavorite.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.tryOn.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.tryOn.byId.queryKey({ id: tryOnId }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.tryOn.favorites.queryKey(),
          }),
        ]);
      },
    })
  );

  const retryMutation = useMutation(
    trpc.tryOn.retry.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.tryOn.byId.queryKey({ id: tryOnId }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.tryOn.list.queryKey(),
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

  const locale = "en";
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const getStatusVariant = () => {
    if (tryOn.status === "completed") return "default";
    if (tryOn.status === "failed") return "destructive";
    return "secondary";
  };
  const statusVariant = getStatusVariant();

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild size={isMobile ? "icon" : "sm"} variant="ghost">
              <Link to="/try-on">
                <ArrowLeft />
                {!isMobile && <Trans>Back</Trans>}
              </Link>
            </Button>
            {tryOn.status === "completed" && (
              <Button
                disabled={toggleFavoriteMutation.isPending}
                onClick={handleToggleFavorite}
                size={isMobile ? "icon" : "sm"}
                variant="outline"
              >
                {tryOn.isFavorite ? (
                  <>
                    <HeartOff />
                    {!isMobile && <Trans>Unfavorite</Trans>}
                  </>
                ) : (
                  <>
                    <Heart />
                    {!isMobile && <Trans>Favorite</Trans>}
                  </>
                )}
              </Button>
            )}
            {tryOn.status === "failed" && (
              <Button
                disabled={retryMutation.isPending}
                onClick={handleRetry}
                size={isMobile ? "icon" : "sm"}
                variant="outline"
              >
                <RefreshCw />
                {!isMobile && <Trans>Retry</Trans>}
                <Trans>Retry</Trans>
              </Button>
            )}
            <TryOnDelete tryOn={tryOn}>
              <Button size={isMobile ? "icon" : "sm"} variant="destructive">
                <Trash />
                {!isMobile && <Trans>Delete</Trans>}
              </Button>
            </TryOnDelete>
          </div>
        }
        description={t`View your virtual try-on result`}
        title={tryOn.garment.name}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Image + Status */}
        <div className="space-y-4">
          {/* Main Result */}
          <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {tryOn.status === "completed" && tryOn.resultUrl ? (
              <img
                alt={t`Try-on result for ${tryOn.garment.name}`}
                className="h-full w-full object-contain"
                src={tryOn.resultUrl}
              />
            ) : (
              <TryOnProgress status={tryOn.status} />
            )}
          </div>

          {/* Error Message */}
          {tryOn.errorMessage && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
              <p className="text-destructive text-sm">{tryOn.errorMessage}</p>
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="space-y-4">
          {/* Body Profile + Garment Row */}
          <ItemGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Item variant="outline">
              <ItemMedia className="h-40 w-40 overflow-hidden rounded-lg">
                <img
                  alt={tryOn.bodyProfile.name}
                  className="h-full w-full object-cover"
                  src={tryOn.bodyProfile.photoUrl}
                />
              </ItemMedia>
              <ItemContent>
                <ItemDescription>
                  <Trans>Body Profile</Trans>
                </ItemDescription>
                <ItemTitle>{tryOn.bodyProfile.name}</ItemTitle>
                {tryOn.bodyProfile.isDefault && (
                  <Badge variant="secondary">
                    <Trans>Default</Trans>
                  </Badge>
                )}
              </ItemContent>
            </Item>

            <Item variant="outline">
              <ItemMedia className="h-40 w-40 overflow-hidden rounded-lg">
                <img
                  alt={tryOn.garment.name}
                  className="h-full w-full object-cover"
                  src={tryOn.garment.imageUrl}
                />
              </ItemMedia>
              <ItemContent>
                <ItemDescription>
                  <Trans>Garment</Trans>
                </ItemDescription>
                <ItemTitle>{tryOn.garment.name}</ItemTitle>
                <Badge variant="outline">{tryOn.garment.category}</Badge>
              </ItemContent>
            </Item>
          </ItemGroup>

          {/* Style Tips */}
          <StyleTipCard
            isCompleted={tryOn.status === "completed"}
            tips={tryOn.styleTips ?? []}
            tryOnId={tryOn.id}
          />

          {/* Try Another */}
          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <TryOnForm preselectedProfileId={tryOn.bodyProfileId}>
              <Button className="w-full" variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                <Trans>Try Another Garment</Trans>
              </Button>
            </TryOnForm>
          </Suspense>
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <Trans>Status</Trans>
                <Badge variant={statusVariant}>{tryOn.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tryOn.processingMs && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    <Trans>Processing Time</Trans>
                  </span>
                  <span className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {(tryOn.processingMs / 1000).toFixed(1)}s
                  </span>
                </div>
              )}
              {tryOn.confidenceScore && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    <Trans>Confidence</Trans>
                  </span>
                  <span>{(tryOn.confidenceScore * 100).toFixed(0)}%</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <Trans>Created</Trans>
                </span>
                <span>{dateFormatter.format(new Date(tryOn.createdAt))}</span>
              </div>
              {tryOn.completedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    <Trans>Completed</Trans>
                  </span>
                  <span>
                    {dateFormatter.format(new Date(tryOn.completedAt))}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TryOnDetailScreen;
