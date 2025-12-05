import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Pencil, Trash, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <Card ref={setNodeRef} style={style}>
      <CardContent className="p-3">
        <div className="flex gap-3">
          <button
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            type="button"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
            {item.tryOn.resultUrl ? (
              <img
                alt={item.tryOn.garment.name}
                className="h-full w-full object-cover"
                src={item.tryOn.resultUrl}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                <Trans>No image</Trans>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate font-medium">{item.tryOn.garment.name}</p>
            {isEditing ? (
              <div className="mt-1 flex gap-2">
                <Input
                  className="h-8 text-sm"
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
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                {item.note ?? <Trans>No note</Trans>}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-1">
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button
              disabled={removeMutation.isPending}
              onClick={handleRemove}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LookbookItem;
