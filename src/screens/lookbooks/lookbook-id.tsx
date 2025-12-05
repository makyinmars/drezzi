import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
  Eye,
  EyeOff,
  Plus,
  Share2,
  Trash,
} from "lucide-react";
import { Suspense } from "react";

import PageHeader from "@/components/common/page-header";
import AddTryOnDialog from "@/components/lookbook/add-tryon-dialog";
import LookbookDelete from "@/components/lookbook/lookbook-delete";
import LookbookForm from "@/components/lookbook/lookbook-form";
import LookbookItem from "@/components/lookbook/lookbook-item";
import ShareDialog from "@/components/lookbook/share-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTRPC } from "@/trpc/react";

const Route = getRouteApi("/(authed)/lookbooks/$lookbookId");

const LookbookDetailScreen = () => {
  const { t } = useLingui();
  const { lookbookId } = Route.useParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const lookbookQuery = useSuspenseQuery(
    trpc.lookbook.byId.queryOptions({ id: lookbookId })
  );
  const lookbook = lookbookQuery.data;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const reorderMutation = useMutation(
    trpc.lookbook.reorderItems.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.lookbook.byId.queryKey({ id: lookbookId }),
        });

        const previousData = queryClient.getQueryData(
          trpc.lookbook.byId.queryKey({ id: lookbookId })
        );

        queryClient.setQueryData(
          trpc.lookbook.byId.queryKey({ id: lookbookId }),
          (old) => {
            if (!old) return old;
            const itemMap = new Map(
              variables.items.map((item) => [item.id, item.order])
            );
            const sortedItems = [...old.items].sort(
              (a, b) => (itemMap.get(a.id) ?? 0) - (itemMap.get(b.id) ?? 0)
            );
            return { ...old, items: sortedItems };
          }
        );

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.lookbook.byId.queryKey({ id: lookbookId }),
          context?.previousData
        );
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lookbook.items.findIndex((item) => item.id === active.id);
    const newIndex = lookbook.items.findIndex((item) => item.id === over.id);
    const newItems = arrayMove(lookbook.items, oldIndex, newIndex);

    reorderMutation.mutate({
      lookbookId,
      items: newItems.map((item, index) => ({ id: item.id, order: index })),
    });
  };

  const locale = "en";
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild size="sm" variant="ghost">
              <a href="/lookbooks">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <Trans>Back</Trans>
              </a>
            </Button>
            <LookbookForm lookbook={lookbook}>
              <Button size="sm" variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                <Trans>Edit</Trans>
              </Button>
            </LookbookForm>
            <ShareDialog lookbook={lookbook}>
              <Button size="sm" variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                <Trans>Share</Trans>
              </Button>
            </ShareDialog>
            <LookbookDelete lookbook={lookbook}>
              <Button size="sm" variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                <Trans>Delete</Trans>
              </Button>
            </LookbookDelete>
          </div>
        }
        description={lookbook.description ?? t`Manage your lookbook`}
        title={lookbook.name}
      />

      <div className="grid gap-6 lg:grid-cols-3">
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
                  <Trans>Visibility</Trans>
                </span>
                {lookbook.isPublic ? (
                  <Badge variant="secondary">
                    <Eye className="mr-1 h-3 w-3" />
                    <Trans>Public</Trans>
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <EyeOff className="mr-1 h-3 w-3" />
                    <Trans>Private</Trans>
                  </Badge>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <Trans>Items</Trans>
                </span>
                <span>{lookbook.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <Trans>Created</Trans>
                </span>
                <span>
                  {dateFormatter.format(new Date(lookbook.createdAt))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <Trans>Updated</Trans>
                </span>
                <span>
                  {dateFormatter.format(new Date(lookbook.updatedAt))}
                </span>
              </div>
            </CardContent>
          </Card>

          <Suspense
            fallback={
              <Button className="w-full" disabled>
                <Plus className="mr-2 h-4 w-4" />
                <Trans>Loading...</Trans>
              </Button>
            }
          >
            <AddTryOnDialog lookbookId={lookbookId}>
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                <Trans>Add Try-On</Trans>
              </Button>
            </AddTryOnDialog>
          </Suspense>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                <Trans>Items</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lookbook.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                  <h3 className="mb-2 font-medium text-lg">
                    <Trans>No items yet</Trans>
                  </h3>
                  <p className="mb-4 text-muted-foreground text-sm">
                    <Trans>
                      Add try-on results to this lookbook to start curating.
                    </Trans>
                  </p>
                  <Suspense
                    fallback={
                      <Button disabled>
                        <Plus className="mr-2 h-4 w-4" />
                        <Trans>Loading...</Trans>
                      </Button>
                    }
                  >
                    <AddTryOnDialog lookbookId={lookbookId}>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        <Trans>Add Your First Item</Trans>
                      </Button>
                    </AddTryOnDialog>
                  </Suspense>
                </div>
              ) : (
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  sensors={sensors}
                >
                  <SortableContext
                    items={lookbook.items.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {lookbook.items.map((item) => (
                        <LookbookItem
                          item={item}
                          key={item.id}
                          lookbookId={lookbookId}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LookbookDetailScreen;
