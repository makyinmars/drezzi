import { Trans, useLingui } from "@lingui/react/macro";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Trash,
} from "lucide-react";
import { toast } from "sonner";

import PageHeader from "@/components/common/page-header";
import GarmentDelete from "@/components/garment/garment-delete";
import GarmentForm from "@/components/garment/garment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTRPC } from "@/trpc/react";

const Route = getRouteApi("/(authed)/garment/$garmentId");

const GarmentDetailScreen = () => {
  const { t } = useLingui();
  const { garmentId } = Route.useParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const garmentQuery = useSuspenseQuery(
    trpc.garment.byId.queryOptions({ id: garmentId })
  );
  const garment = garmentQuery.data;

  const togglePublicMutation = useMutation(
    trpc.garment.togglePublic.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.garment.list.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.garment.byId.queryKey({ id: garmentId }),
        });
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

  const locale = "en";
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const isOwner = garment.isOwner !== false;

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="ghost">
              <a href="/garment">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <Trans>Back</Trans>
              </a>
            </Button>
            {isOwner && (
              <>
                <GarmentForm garment={garment}>
                  <Button size="sm" variant="outline">
                    <Edit className="mr-2 h-4 w-4" />
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
                      <EyeOff className="mr-2 h-4 w-4" />
                      <Trans>Make Private</Trans>
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      <Trans>Make Public</Trans>
                    </>
                  )}
                </Button>
                <GarmentDelete garment={garment}>
                  <Button size="sm" variant="destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    <Trans>Delete</Trans>
                  </Button>
                </GarmentDelete>
              </>
            )}
          </div>
        }
        description={t`View and manage your garment`}
        title={garment.name}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="relative">
            <img
              alt={garment.name}
              className="aspect-[3/4] w-full object-cover"
              src={garment.imageUrl}
            />
            <div className="absolute top-4 right-4 flex gap-2">
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
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <Trans>Details</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <Trans>Category</Trans>
                </span>
                <Badge variant="outline">
                  {garment.category.charAt(0).toUpperCase() +
                    garment.category.slice(1)}
                </Badge>
              </div>
              {garment.brand && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    <Trans>Brand</Trans>
                  </span>
                  <span>{garment.brand}</span>
                </div>
              )}
              {garment.price !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    <Trans>Price</Trans>
                  </span>
                  <span>
                    {garment.currency} {garment.price.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <Trans>Created</Trans>
                </span>
                <span>{dateFormatter.format(new Date(garment.createdAt))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <Trans>Updated</Trans>
                </span>
                <span>{dateFormatter.format(new Date(garment.updatedAt))}</span>
              </div>
            </CardContent>
          </Card>

          {garment.description && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Description</Trans>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {garment.description}
                </p>
              </CardContent>
            </Card>
          )}

          {(garment.colors.length > 0 || garment.sizes.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Trans>Attributes</Trans>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {garment.colors.length > 0 && (
                  <div>
                    <span className="mb-2 block text-muted-foreground text-sm">
                      <Trans>Colors</Trans>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {garment.colors.map((color) => (
                        <Badge key={color} variant="secondary">
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {garment.sizes.length > 0 && (
                  <div>
                    <span className="mb-2 block text-muted-foreground text-sm">
                      <Trans>Sizes</Trans>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {garment.sizes.map((size) => (
                        <Badge key={size} variant="outline">
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {garment.retailUrl && (
            <Card>
              <CardContent className="pt-6">
                <Button asChild className="w-full" variant="outline">
                  <a
                    href={garment.retailUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    <Trans>View on Retailer</Trans>
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GarmentDetailScreen;
