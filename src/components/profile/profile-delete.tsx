import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRouter } from "@tanstack/react-router";
import type { BodyProfile } from "generated/prisma/client";
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
import { useTRPC } from "@/trpc/react";

type ProfileDeleteProps = {
  profile: BodyProfile;
  children?: React.ReactNode;
};

const ProfileDelete = ({ profile, children }: ProfileDeleteProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const location = useLocation();

  const isOnProfileDetailPage = location.pathname.includes("/profile/");

  const deleteMutation = useMutation(
    trpc.profile.delete.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.profile.list.queryKey(),
          exact: true,
        });

        const previousData = queryClient.getQueryData(
          trpc.profile.list.queryKey()
        );

        queryClient.setQueryData(trpc.profile.list.queryKey(), (old) => {
          if (!old) return previousData;
          return old.filter((p) => p.id !== variables.id);
        });

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.profile.list.queryKey(),
          context?.previousData
        );
      },
      onSuccess: () => {
        if (isOnProfileDetailPage) {
          router.navigate({ to: "/profile" });
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
    toast.promise(deleteMutation.mutateAsync({ id: profile.id }), {
      loading: t`Deleting profile...`,
      success: () => t`"${profile.name}" has been deleted`,
      error: (err) => t`Error deleting profile: ${err.message}`,
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
              body profile "{profile.name}" and its associated photo.
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

export default ProfileDelete;
