import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRouter } from "@tanstack/react-router";
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
import type { Lookbook } from "@/db/types";
import { useTRPC } from "@/trpc/react";

type LookbookDeleteProps = {
  lookbook: Pick<Lookbook, "id" | "name">;
  children?: React.ReactNode;
};

const LookbookDelete = ({ lookbook, children }: LookbookDeleteProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const location = useLocation();

  const isOnDetailPage = location.pathname.includes("/lookbooks/");

  const deleteMutation = useMutation(
    trpc.lookbook.delete.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.lookbook.list.queryKey(),
        });

        const previousData = queryClient.getQueryData(
          trpc.lookbook.list.queryKey()
        );

        queryClient.setQueryData(trpc.lookbook.list.queryKey(), (old) => {
          if (!old) return previousData;
          return old.filter((lb) => lb.id !== variables.id);
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
        if (isOnDetailPage) {
          router.navigate({ to: "/lookbooks" });
        }
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.dashboard.stats.queryKey(),
        });
      },
    })
  );

  const handleDelete = () => {
    toast.promise(deleteMutation.mutateAsync({ id: lookbook.id }), {
      loading: t`Deleting lookbook...`,
      success: () => t`"${lookbook.name}" has been deleted`,
      error: (err) => t`Error deleting lookbook: ${err.message}`,
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Trans>Are you absolutely sure?</Trans>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Trans>
              This action cannot be undone. This will permanently delete the
              lookbook "{lookbook.name}" and all its items.
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

export default LookbookDelete;
