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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
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
      <CardContent className="space-y-3">
        {tips.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            <Trans>No style tips available yet.</Trans>
          </p>
        ) : (
          tips.map((tip) => {
            const config = CATEGORY_CONFIG[tip.category as StyleTipCategory];
            const Icon = config?.icon ?? Sparkles;

            return (
              <div className="group rounded-lg bg-muted p-3" key={tip.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">
                      {config?.label ?? tip.category}
                    </Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <StyleTipForm tip={tip} tryOnId={tryOnId}>
                      <Button size="icon" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </StyleTipForm>
                    <StyleTipDelete tip={tip} tryOnId={tryOnId}>
                      <Button size="icon" variant="ghost">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </StyleTipDelete>
                  </div>
                </div>
                <p className="mt-2 text-sm">{tip.content}</p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default StyleTipCard;
