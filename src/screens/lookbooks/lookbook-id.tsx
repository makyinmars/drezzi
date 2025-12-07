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
  rectSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { Trans, useLingui } from "@lingui/react/macro";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Edit,
  Eye,
  EyeOff,
  Layers,
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTRPC } from "@/trpc/react";

const Route = getRouteApi("/(authed)/lookbooks/$lookbookId");

const LookbookDetailScreen = () => {
  const isMobile = useIsMobile();
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

  const dateFormatter = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex gap-2">
            <Button asChild size={isMobile ? "icon" : "sm"} variant="ghost">
              <Link to="/lookbooks">
                <ArrowLeft />
                {!isMobile && <Trans>Back</Trans>}
              </Link>
            </Button>
            <LookbookForm lookbook={lookbook}>
              <Button size={isMobile ? "icon" : "sm"} variant="outline">
                <Edit />
                {!isMobile && <Trans>Edit</Trans>}
              </Button>
            </LookbookForm>
            <ShareDialog lookbook={lookbook}>
              <Button size={isMobile ? "icon" : "sm"} variant="outline">
                <Share2 />
                {!isMobile && <Trans>Share</Trans>}
              </Button>
            </ShareDialog>
            <LookbookDelete lookbook={lookbook}>
              <Button size={isMobile ? "icon" : "sm"} variant="destructive">
                <Trash />
                {!isMobile && <Trans>Delete</Trans>}
              </Button>
            </LookbookDelete>
          </div>
        }
        description={lookbook.description ?? t`Manage your lookbook`}
        title={lookbook.name}
      />

      {/* Badge Row */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">
          {lookbook.isPublic ? (
            <>
              <Eye className="mr-1 h-3 w-3" />
              <Trans>Public</Trans>
            </>
          ) : (
            <>
              <EyeOff className="mr-1 h-3 w-3" />
              <Trans>Private</Trans>
            </>
          )}
        </Badge>
        <Badge variant="outline">
          <Layers className="mr-1 h-3 w-3" />
          <Trans>{lookbook.items.length} items</Trans>
        </Badge>
        <Badge variant="outline">
          <Calendar className="mr-1 h-3 w-3" />
          {dateFormatter.format(new Date(lookbook.createdAt))}
        </Badge>
      </div>

      {/* Collection Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">
            <Trans>Collection</Trans>
          </h2>
          <Suspense
            fallback={
              <Button disabled size="sm">
                <Plus className="mr-2 h-4 w-4" />
                <Trans>Loading...</Trans>
              </Button>
            }
          >
            <AddTryOnDialog lookbookId={lookbookId}>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                <Trans>Add Item</Trans>
              </Button>
            </AddTryOnDialog>
          </Suspense>
        </div>

        {lookbook.items.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Plus className="h-5 w-5" />
              </EmptyMedia>
              <EmptyTitle>
                <Trans>No items yet</Trans>
              </EmptyTitle>
              <EmptyDescription>
                <Trans>
                  Add try-on results to this lookbook to start curating.
                </Trans>
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
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
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              sensors={sensors}
            >
              <SortableContext
                items={lookbook.items.map((item) => item.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
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

            {/* Add Try-On CTA */}
            <Suspense
              fallback={
                <div className="flex cursor-not-allowed items-center justify-center rounded-lg border border-dashed p-6 text-muted-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  <Trans>Loading...</Trans>
                </div>
              }
            >
              <AddTryOnDialog lookbookId={lookbookId}>
                <button
                  className="flex w-full items-center justify-center rounded-lg border border-dashed p-6 text-muted-foreground transition-colors hover:border-primary hover:bg-muted/50 hover:text-foreground"
                  type="button"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <Trans>Add Try-On</Trans>
                </button>
              </AddTryOnDialog>
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
};

export default LookbookDetailScreen;
