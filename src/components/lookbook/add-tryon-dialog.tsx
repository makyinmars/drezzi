import { Trans, useLingui } from "@lingui/react/macro";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Check, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResponsivePanel,
  ResponsivePanelContent,
  ResponsivePanelDescription,
  ResponsivePanelHeader,
  ResponsivePanelTitle,
  ResponsivePanelTrigger,
} from "@/components/ui/responsive-panel";
import { useTRPC } from "@/trpc/react";

type AddTryOnDialogProps = {
  lookbookId: string;
  children?: React.ReactNode;
};

const AddTryOnDialog = ({ lookbookId, children }: AddTryOnDialogProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const availableQuery = useSuspenseQuery(
    trpc.lookbook.availableTryOns.queryOptions({ id: lookbookId })
  );

  const addMutation = useMutation(
    trpc.lookbook.addItem.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.lookbook.byId.queryKey({ id: lookbookId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.lookbook.availableTryOns.queryKey({ id: lookbookId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.lookbook.list.queryKey(),
        });
        setSelected([]);
        setOpen(false);
      },
    })
  );

  const filtered = availableQuery.data.filter((t) =>
    t.garment.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (selected.length === 0) return;
    toast.promise(
      Promise.all(
        selected.map((tryOnId) =>
          addMutation.mutateAsync({
            lookbookId,
            tryOnId,
          })
        )
      ),
      {
        loading: t`Adding ${selected.length} item(s) to lookbook...`,
        success: () => t`Added ${selected.length} item(s) to lookbook`,
        error: (err) => t`Error adding items: ${err.message}`,
      }
    );
  };

  return (
    <ResponsivePanel onOpenChange={setOpen} open={open}>
      <ResponsivePanelTrigger asChild>{children}</ResponsivePanelTrigger>
      <ResponsivePanelContent>
        <ResponsivePanelHeader>
          <ResponsivePanelTitle>
            <Trans>Add Try-On</Trans>
          </ResponsivePanelTitle>
          <ResponsivePanelDescription>
            <Trans>Select a completed try-on to add to this lookbook</Trans>
          </ResponsivePanelDescription>
        </ResponsivePanelHeader>

        <div className="space-y-4 p-4">
          <div className="relative">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t`Search garments...`}
              value={search}
            />
          </div>

          <div>
            {filtered.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                {availableQuery.data.length === 0 ? (
                  <Trans>No completed try-ons available</Trans>
                ) : (
                  <Trans>No matching try-ons</Trans>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                {filtered.map((tryOn) => (
                  <button
                    className={`relative overflow-hidden rounded-lg border-2 transition-colors ${
                      selected.includes(tryOn.id)
                        ? "border-primary"
                        : "border-transparent hover:border-muted"
                    }`}
                    key={tryOn.id}
                    onClick={() =>
                      setSelected((prev) =>
                        prev.includes(tryOn.id)
                          ? prev.filter((id) => id !== tryOn.id)
                          : [...prev, tryOn.id]
                      )
                    }
                    type="button"
                  >
                    <div className="aspect-[3/4] bg-muted">
                      {tryOn.resultUrl ? (
                        <img
                          alt={tryOn.garment.name}
                          className="h-full w-full object-cover"
                          src={tryOn.resultUrl}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                          <Trans>No image</Trans>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="truncate text-left text-white text-xs">
                        {tryOn.garment.name}
                      </p>
                    </div>
                    {selected.includes(tryOn.id) && (
                      <div className="absolute top-2 right-2 rounded-full bg-primary p-1">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            className="w-full"
            disabled={selected.length === 0 || addMutation.isPending}
            onClick={handleAdd}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            <Trans>Add to Lookbook</Trans>
          </Button>
        </div>
      </ResponsivePanelContent>
    </ResponsivePanel>
  );
};

export default AddTryOnDialog;
