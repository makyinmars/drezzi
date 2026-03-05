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
import type { TryOn } from "@/db/types";
import { useTRPC } from "@/trpc/react";

type TryOnDeleteProps = {
  tryOn: TryOn & { garment: { name: string } };
  children?: React.ReactNode;
};

const TryOnDelete = ({ tryOn, children }: TryOnDeleteProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const location = useLocation();

  const isOnTryOnDetailPage = location.pathname.includes("/try-on/");

  const deleteMutation = useMutation(
    trpc.tryOn.delete.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.tryOn.list.queryKey(),
        });

        const previousData = queryClient.getQueryData(
          trpc.tryOn.list.queryKey({})
        );

        queryClient.setQueryData(trpc.tryOn.list.queryKey({}), (old) => {
          if (!old) return previousData;
          return old.filter((item) => item.id !== variables.id);
        });

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.tryOn.list.queryKey({}),
          context?.previousData
        );
      },
      onSuccess: () => {
        if (isOnTryOnDetailPage) {
          router.navigate({ to: "/try-on" });
        }
      },
      onSettled: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.dashboard.stats.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.dashboard.recentActivity.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.tryOn.favorites.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.tryOn.recent.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.lookbook.availableTryOns.queryKey(),
          }),
        ]);
      },
    })
  );

  const handleDelete = () => {
    toast.promise(deleteMutation.mutateAsync({ id: tryOn.id }), {
      loading: t`Deleting try-on...`,
      success: () => t`Try-on has been deleted`,
      error: (err) => t`Error deleting try-on: ${err.message}`,
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
              This action cannot be undone. This will permanently delete this
              try-on result for "{tryOn.garment.name}".
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

export default TryOnDelete;
