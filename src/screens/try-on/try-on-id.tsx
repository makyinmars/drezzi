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
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/react";

const Route = getRouteApi("/(authed)/try-on/$tryOnId");

const TryOnDetailScreen = () => {
  const { t } = useLingui();
  const { tryOnId } = Route.useParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const tryOnQuery = useSuspenseQuery(
    trpc.tryOn.byId.queryOptions({ id: tryOnId })
  );
  const tryOn = tryOnQuery.data;

  const toggleFavoriteMutation = useMutation(
    trpc.tryOn.toggleFavorite.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.tryOn.list.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.tryOn.byId.queryKey({ id: tryOnId }),
        });
      },
    })
  );

  const retryMutation = useMutation(
    trpc.tryOn.retry.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.tryOn.byId.queryKey({ id: tryOnId }),
        });
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
            <Button asChild size="sm" variant="ghost">
              <Link to="/try-on">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <Trans>Back</Trans>
              </Link>
            </Button>
            {tryOn.status === "completed" && (
              <Button
                disabled={toggleFavoriteMutation.isPending}
                onClick={handleToggleFavorite}
                size="sm"
                variant="outline"
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
              </Button>
            )}
            {tryOn.status === "failed" && (
              <Button
                disabled={retryMutation.isPending}
                onClick={handleRetry}
                size="sm"
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                <Trans>Retry</Trans>
              </Button>
            )}
            <TryOnDelete tryOn={tryOn}>
              <Button size="sm" variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                <Trans>Delete</Trans>
              </Button>
            </TryOnDelete>
          </div>
        }
        description={t`View your virtual try-on result`}
        title={tryOn.garment.name}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Result */}
        <Card className="overflow-hidden lg:col-span-2">
          {tryOn.status === "completed" && tryOn.resultUrl ? (
            <img
              alt={t`Try-on result for ${tryOn.garment.name}`}
              className="aspect-[3/4] w-full object-contain"
              src={tryOn.resultUrl}
            />
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center bg-muted">
              <TryOnProgress status={tryOn.status} />
            </div>
          )}
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
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

          {/* Error Message */}
          {tryOn.errorMessage && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">
                  <Trans>Error</Trans>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive text-sm">{tryOn.errorMessage}</p>
              </CardContent>
            </Card>
          )}

          {/* Body Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Trans>Body Profile</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <img
                  alt={tryOn.bodyProfile.name}
                  className="h-16 w-16 rounded-lg object-cover"
                  src={tryOn.bodyProfile.photoUrl}
                />
                <div>
                  <p className="font-medium">{tryOn.bodyProfile.name}</p>
                  {tryOn.bodyProfile.isDefault && (
                    <Badge variant="secondary">
                      <Trans>Default</Trans>
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Garment Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Trans>Garment</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <img
                  alt={tryOn.garment.name}
                  className="h-16 w-16 rounded-lg object-cover"
                  src={tryOn.garment.imageUrl}
                />
                <div>
                  <p className="font-medium">{tryOn.garment.name}</p>
                  <Badge variant="outline">{tryOn.garment.category}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Style Tips */}
          <StyleTipCard
            isCompleted={tryOn.status === "completed"}
            tips={tryOn.styleTips ?? []}
            tryOnId={tryOn.id}
          />

          {/* Try Another */}
          <Card>
            <CardContent className="pt-6">
              <Suspense fallback={<Skeleton className="h-10 w-full" />}>
                <TryOnForm preselectedProfileId={tryOn.bodyProfileId}>
                  <Button className="w-full" variant="outline">
                    <Sparkles className="mr-2 h-4 w-4" />
                    <Trans>Try Another Garment</Trans>
                  </Button>
                </TryOnForm>
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TryOnDetailScreen;
