import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { StyleTip } from "generated/prisma/client";
import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Edit,
  Palette,
  Plus,
  RefreshCw,
  Ruler,
  Shirt,
  Sparkles,
  Trash,
  Watch,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyMedia } from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/react";
import type { StyleTipCategory } from "@/validators/style-tip";

import StyleTipDelete from "./style-tip-delete";
import StyleTipForm from "./style-tip-form";

const CATEGORY_CONFIG: Record<
  StyleTipCategory,
  { label: string; icon: LucideIcon }
> = {
  fit: { label: "Fit", icon: Ruler },
  color: { label: "Color", icon: Palette },
  style: { label: "Style", icon: Sparkles },
  occasion: { label: "Occasion", icon: Calendar },
  accessories: { label: "Accessories", icon: Watch },
  "fabric-care": { label: "Fabric Care", icon: Shirt },
};

type StyleTipCardProps = {
  tryOnId: string;
  tips: StyleTip[];
  isCompleted: boolean;
};

const StyleTipCard = ({ tryOnId, tips, isCompleted }: StyleTipCardProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const regenerateMutation = useMutation(
    trpc.styleTip.regenerate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.tryOn.byId.queryKey({ id: tryOnId }),
        });
      },
    })
  );

  const handleRegenerate = () => {
    toast.promise(regenerateMutation.mutateAsync({ tryOnId }), {
      loading: t`Regenerating style tips...`,
      success: t`Style tips regenerated`,
      error: (err) => t`Failed to regenerate: ${err.message}`,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">
          <Trans>Style Tips</Trans>
        </CardTitle>
        <div className="flex gap-2">
          {isCompleted && (
            <>
              <StyleTipForm tryOnId={tryOnId}>
                <Button size="sm" variant="outline">
                  <Plus className="mr-1 h-4 w-4" />
                  <Trans>Add</Trans>
                </Button>
              </StyleTipForm>
              <Button
                disabled={regenerateMutation.isPending}
                onClick={handleRegenerate}
                size="sm"
                variant="outline"
              >
                <RefreshCw
                  className={`mr-1 h-4 w-4 ${regenerateMutation.isPending ? "animate-spin" : ""}`}
                />
                <Trans>Regenerate</Trans>
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="columns-1 gap-2 md:columns-2">
        {regenerateMutation.isPending
          ? Array.from({ length: 6 }).map((_, i) => (
              <Item
                className="mb-2 break-inside-avoid"
                key={i}
                size="sm"
                variant="muted"
              >
                <ItemMedia className="flex items-center justify-center">
                  <Skeleton className="h-5 w-5 rounded-md" />
                </ItemMedia>
                <ItemContent>
                  <Skeleton className="h-20 w-full" />
                </ItemContent>
              </Item>
            ))
          : null}
        {!regenerateMutation.isPending && tips.length === 0 ? (
          <Empty className="col-span-full">
            <EmptyMedia variant="icon">
              <Sparkles className="h-6 w-6" />
            </EmptyMedia>
            <EmptyDescription>
              <Trans>No style tips available yet.</Trans>
            </EmptyDescription>
          </Empty>
        ) : null}
        {!regenerateMutation.isPending && tips.length > 0
          ? tips.map((tip) => {
              const config = CATEGORY_CONFIG[tip.category as StyleTipCategory];
              const Icon = config?.icon ?? Sparkles;

              return (
                <Item
                  className="mb-2 break-inside-avoid"
                  key={tip.id}
                  size="sm"
                  variant="muted"
                >
                  <ItemMedia>
                    <Icon className="h-3 w-3 text-muted-foreground" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemDescription className="line-clamp-none">
                      {tip.content}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="opacity-0 transition-opacity group-hover/item:opacity-100">
                    <StyleTipForm tip={tip} tryOnId={tryOnId}>
                      <Button className="h-6 w-6" size="icon" variant="ghost">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </StyleTipForm>
                    <StyleTipDelete tip={tip} tryOnId={tryOnId}>
                      <Button className="h-6 w-6" size="icon" variant="ghost">
                        <Trash className="h-3 w-3" />
                      </Button>
                    </StyleTipDelete>
                  </ItemActions>
                </Item>
              );
            })
          : null}
      </CardContent>
    </Card>
  );
};

export default StyleTipCard;
