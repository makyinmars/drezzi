import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GripVertical, MoreHorizontal, Pencil, Trash, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import CardMediaDisplay from "@/components/custom/card-media-display";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/react";
import type { LookbookByIdProcedure } from "@/trpc/routers/lookbook";

type LookbookItemProps = {
  item: LookbookByIdProcedure["items"][number];
  lookbookId: string;
};

const LookbookItem = ({ item, lookbookId }: LookbookItemProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(item.note ?? "");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const updateNoteMutation = useMutation(
    trpc.lookbook.updateItemNote.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.lookbook.byId.queryKey({ id: lookbookId }),
        });
        setIsEditing(false);
      },
    })
  );

  const removeMutation = useMutation(
    trpc.lookbook.removeItem.mutationOptions({
      onMutate: async () => {
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
            return {
              ...old,
              items: old.items.filter((i) => i.id !== item.id),
            };
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
      onSettled: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.lookbook.availableTryOns.queryKey({
              id: lookbookId,
            }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.lookbook.list.queryKey(),
          }),
        ]);
      },
    })
  );

  const handleSaveNote = () => {
    toast.promise(
      updateNoteMutation.mutateAsync({
        id: item.id,
        note: note || null,
      }),
      {
        loading: t`Saving note...`,
        success: () => t`Note saved`,
        error: (err) => t`Error saving note: ${err.message}`,
      }
    );
  };

  const handleRemove = () => {
    toast.promise(removeMutation.mutateAsync({ id: item.id }), {
      loading: t`Removing item...`,
      success: () => t`Item removed`,
      error: (err) => t`Error removing item: ${err.message}`,
    });
  };

  const dragHandle = (
    <button
      className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
      type="button"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" />
    </button>
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
        <DropdownMenuItem onClick={() => setIsEditing(true)}>
          <Pencil />
          <Trans>Edit Note</Trans>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={removeMutation.isPending}
          onClick={handleRemove}
          variant="destructive"
        >
          <Trash />
          <Trans>Remove</Trans>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style}>
        <CardMediaDisplay imageUrl={item.tryOn.resultUrl} topLeft={dragHandle}>
          <h3 className="truncate font-medium text-foreground">
            {item.tryOn.garment.name}
          </h3>
          {item.tryOn.garment.brand && (
            <p className="mt-0.5 text-muted-foreground text-sm">
              {item.tryOn.garment.brand}
            </p>
          )}
        </CardMediaDisplay>
        <div className="mt-2 flex gap-2">
          <Input
            className="h-9 text-sm"
            onChange={(e) => setNote(e.target.value)}
            placeholder={t`Add a note...`}
            value={note}
          />
          <Button
            disabled={updateNoteMutation.isPending}
            onClick={handleSaveNote}
            size="sm"
            type="button"
          >
            <Trans>Save</Trans>
          </Button>
          <Button
            onClick={() => {
              setIsEditing(false);
              setNote(item.note ?? "");
            }}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      <CardMediaDisplay
        imageUrl={item.tryOn.resultUrl}
        topLeft={dragHandle}
        topRight={actionsMenu}
      >
        <h3 className="truncate font-medium text-foreground">
          {item.tryOn.garment.name}
        </h3>
        {item.tryOn.garment.brand && (
          <p className="mt-0.5 text-muted-foreground text-sm">
            {item.tryOn.garment.brand}
          </p>
        )}
        {item.note && (
          <p className="mt-2 line-clamp-2 text-muted-foreground text-sm">
            {item.note}
          </p>
        )}
      </CardMediaDisplay>
    </div>
  );
};

export default LookbookItem;
