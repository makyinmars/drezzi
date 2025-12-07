import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Edit, Star, Trash } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTRPC } from "@/trpc/react";
import type { ProfileListProcedure } from "@/trpc/routers/profile";

import MediaDisplay from "../common/media-display";
import ProfileDelete from "./profile-delete";
import ProfileForm from "./profile-form";

type ProfileCardProps = {
  profile: ProfileListProcedure[number];
};

const ProfileCard = ({ profile }: ProfileCardProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const setDefaultMutation = useMutation(
    trpc.profile.setDefault.mutationOptions({
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
          return old.map((p) => ({
            ...p,
            isDefault: p.id === variables.id,
          }));
        });

        return { previousData };
      },
      onError: (_err, _variables, context) => {
        queryClient.setQueryData(
          trpc.profile.list.queryKey(),
          context?.previousData
        );
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.profile.byId.queryKey({ id: profile.id }),
        });
      },
    })
  );

  const handleSetDefault = () => {
    if (profile.isDefault) return;
    toast.promise(setDefaultMutation.mutateAsync({ id: profile.id }), {
      loading: t`Setting as default...`,
      success: () => t`"${profile.name}" is now your default profile`,
      error: (err) => t`Error setting default: ${err.message}`,
    });
  };

  const measurements = [
    { label: t`Height`, value: profile.height, unit: "cm" },
    { label: t`Chest`, value: profile.chest, unit: "cm" },
    { label: t`Waist`, value: profile.waist, unit: "cm" },
    { label: t`Hip`, value: profile.hip, unit: "cm" },
    { label: t`Inseam`, value: profile.inseam, unit: "cm" },
  ].filter((m) => m.value !== null);

  return (
    <Card className="overflow-hidden pt-0">
      <MediaDisplay
        alt={profile.name}
        aspectRatio="4/5"
        className="lg:aspect-3/4"
        src={profile.photoUrl}
        variant="card"
      >
        {profile.isDefault && (
          <Badge className="absolute top-2 right-2" variant="secondary">
            <Check className="mr-1 h-3 w-3" />
            <Trans>Default</Trans>
          </Badge>
        )}
      </MediaDisplay>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{profile.name}</span>
          <Badge variant="outline">{profile.fitPreference}</Badge>
        </CardTitle>
        <CardDescription>
          {measurements.length > 0 ? (
            <Trans>{measurements.length} measurements recorded</Trans>
          ) : (
            <Trans>No measurements recorded</Trans>
          )}
        </CardDescription>
      </CardHeader>
      {measurements.length > 0 && (
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {measurements.slice(0, 4).map((m) => (
              <div className="flex justify-between" key={m.label}>
                <span className="text-muted-foreground">{m.label}:</span>
                <span>
                  {m.value} {m.unit}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      )}
      <CardFooter className="flex gap-2 pt-2">
        <ProfileForm profile={profile}>
          <Button size="sm" variant="outline">
            <Edit className="mr-1 h-3 w-3" />
            <Trans>Edit</Trans>
          </Button>
        </ProfileForm>
        <Button
          disabled={profile.isDefault || setDefaultMutation.isPending}
          onClick={handleSetDefault}
          size="sm"
          variant="outline"
        >
          <Star className="mr-1 h-3 w-3" />
          <Trans>Set Default</Trans>
        </Button>
        <ProfileDelete profile={profile}>
          <Button size="sm" variant="destructive">
            <Trash className="mr-1 h-3 w-3" />
            <Trans>Delete</Trans>
          </Button>
        </ProfileDelete>
      </CardFooter>
    </Card>
  );
};

export default ProfileCard;
