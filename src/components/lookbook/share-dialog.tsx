import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Lookbook } from "generated/prisma/client";
import { Check, Copy, Eye, EyeOff, Link2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { clientEnv } from "@/env/client";
import { useTRPC } from "@/trpc/react";

type ShareDialogProps = {
  lookbook: Pick<Lookbook, "id" | "name" | "isPublic"> & {
    shareSlug: string | null;
  };
  children?: React.ReactNode;
};

const ShareDialog = ({ lookbook, children }: ShareDialogProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const shareUrl = lookbook.shareSlug
    ? `${clientEnv.VITE_PUBLIC_URL}/shared/lookbook/${lookbook.shareSlug}`
    : null;

  const generateLinkMutation = useMutation(
    trpc.lookbook.generateShareLink.mutationOptions({
      onSuccess: (result) => {
        queryClient.setQueryData(trpc.lookbook.list.queryKey(), (old) => {
          if (!old) return old;
          return old.map((lb) =>
            lb.id === lookbook.id
              ? { ...lb, shareSlug: result.slug, isPublic: result.isPublic }
              : lb
          );
        });
        queryClient.invalidateQueries({
          queryKey: trpc.lookbook.byId.queryKey({ id: lookbook.id }),
        });
      },
    })
  );

  const togglePublicMutation = useMutation(
    trpc.lookbook.togglePublic.mutationOptions({
      onMutate: async () => {
        await queryClient.cancelQueries({
          queryKey: trpc.lookbook.list.queryKey(),
        });

        const previousData = queryClient.getQueryData(
          trpc.lookbook.list.queryKey()
        );

        queryClient.setQueryData(trpc.lookbook.list.queryKey(), (old) => {
          if (!old) return previousData;
          return old.map((lb) =>
            lb.id === lookbook.id ? { ...lb, isPublic: !lb.isPublic } : lb
          );
        });

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.lookbook.list.queryKey(),
          context?.previousData
        );
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.lookbook.byId.queryKey({ id: lookbook.id }),
        });
      },
    })
  );

  const handleGenerateLink = () => {
    toast.promise(generateLinkMutation.mutateAsync({ id: lookbook.id }), {
      loading: t`Generating share link...`,
      success: () => t`Share link generated`,
      error: (err) => t`Error generating link: ${err.message}`,
    });
  };

  const handleTogglePublic = () => {
    toast.promise(togglePublicMutation.mutateAsync({ id: lookbook.id }), {
      loading: lookbook.isPublic ? t`Making private...` : t`Making public...`,
      success: () =>
        lookbook.isPublic
          ? t`"${lookbook.name}" is now private`
          : t`"${lookbook.name}" is now public`,
      error: (err) => t`Error updating visibility: ${err.message}`,
    });
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success(t`Link copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <Trans>Share Lookbook</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>Share "{lookbook.name}" with others</Trans>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label>
                <Trans>Public Access</Trans>
              </Label>
              <p className="text-muted-foreground text-sm">
                <Trans>Anyone with the link can view</Trans>
              </p>
            </div>
            <Switch
              checked={lookbook.isPublic}
              disabled={togglePublicMutation.isPending}
              onCheckedChange={handleTogglePublic}
            />
          </div>

          {shareUrl ? (
            <div className="space-y-2">
              <Label>
                <Trans>Share Link</Trans>
              </Label>
              <div className="flex gap-2">
                <Input readOnly value={shareUrl} />
                <Button
                  className="shrink-0"
                  onClick={handleCopy}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {!lookbook.isPublic && (
                <p className="text-muted-foreground text-sm">
                  <EyeOff className="mr-1 inline h-3 w-3" />
                  <Trans>
                    This lookbook is private. Enable public access to share.
                  </Trans>
                </p>
              )}
              {lookbook.isPublic && (
                <p className="text-green-600 text-sm">
                  <Eye className="mr-1 inline h-3 w-3" />
                  <Trans>This lookbook is publicly accessible.</Trans>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                <Trans>
                  Generate a share link to let others view this lookbook.
                </Trans>
              </p>
              <Button
                className="w-full"
                disabled={generateLinkMutation.isPending}
                onClick={handleGenerateLink}
                type="button"
              >
                <Link2 className="mr-2 h-4 w-4" />
                <Trans>Generate Share Link</Trans>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
