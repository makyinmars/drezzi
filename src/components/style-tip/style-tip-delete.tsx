import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { StyleTip } from "@/db/types";
import { useTRPC } from "@/trpc/react";

type StyleTipDeleteProps = {
  tip: StyleTip;
  tryOnId: string;
  children?: React.ReactNode;
};

const StyleTipDelete = ({ tip, tryOnId, children }: StyleTipDeleteProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    trpc.styleTip.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.tryOn.byId.queryKey({ id: tryOnId }),
        });
      },
    })
  );

  const handleDelete = () => {
    toast.promise(deleteMutation.mutateAsync({ id: tip.id }), {
      loading: t`Deleting style tip...`,
      success: t`Style tip deleted`,
      error: (err) => t`Error deleting: ${err.message}`,
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Trans>Delete Style Tip?</Trans>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Trans>
              This action cannot be undone. This will permanently delete this
              style tip.
            </Trans>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Trans>Cancel</Trans>
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            <Trans>Delete</Trans>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default StyleTipDelete;
