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
import type { Garment } from "@/db/types";
import { useTRPC } from "@/trpc/react";

type GarmentDeleteProps = {
  garment: Garment;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const GarmentDelete = ({
  garment,
  children,
  open,
  onOpenChange,
}: GarmentDeleteProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const location = useLocation();

  const isOnGarmentDetailPage = location.pathname.includes("/garment/");

  const deleteMutation = useMutation(
    trpc.garment.delete.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.garment.list.queryKey(),
        });

        const previousData = queryClient.getQueryData(
          trpc.garment.list.queryKey({ includePublic: false })
        );

        queryClient.setQueryData(
          trpc.garment.list.queryKey({ includePublic: false }),
          (old) => {
            if (!old) return previousData;
            return old.filter((g) => g.id !== variables.id);
          }
        );

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.garment.list.queryKey({ includePublic: false }),
          context?.previousData
        );
      },
      onSuccess: () => {
        if (isOnGarmentDetailPage) {
          router.navigate({ to: "/garment" });
        }
      },
      onSettled: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.garment.categories.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.dashboard.stats.queryKey(),
          }),
        ]);
      },
    })
  );

  const handleDelete = () => {
    toast.promise(deleteMutation.mutateAsync({ id: garment.id }), {
      loading: t`Deleting garment...`,
      success: () => t`"${garment.name}" has been deleted`,
      error: (err) => t`Error deleting garment: ${err.message}`,
    });
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <Trans>Are you absolutely sure?</Trans>
          </AlertDialogTitle>
          <AlertDialogDescription>
            <Trans>
              This action cannot be undone. This will permanently delete the
              garment "{garment.name}" and its associated image.
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

export default GarmentDelete;
