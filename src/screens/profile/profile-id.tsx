import { Trans, useLingui } from "@lingui/react/macro";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { ArrowLeft, Check, Edit, Star, Trash } from "lucide-react";
import { toast } from "sonner";

import PageHeader from "@/components/common/page-header";
import ProfileDelete from "@/components/profile/profile-delete";
import ProfileForm from "@/components/profile/profile-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTRPC } from "@/trpc/react";

const Route = getRouteApi("/(authed)/profile/$profileId");

const ProfileDetailScreen = () => {
  const { t } = useLingui();
  const { profileId } = Route.useParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const profileQuery = useSuspenseQuery(
    trpc.profile.byId.queryOptions({ id: profileId })
  );
  const profile = profileQuery.data;

  const setDefaultMutation = useMutation(
    trpc.profile.setDefault.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.profile.list.queryKey(),
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.profile.byId.queryKey({ id: profileId }),
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
  ];

  const locale = "en";
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        description={t`View and manage your body profile`}
        title={profile.name}
      >
        <div className="flex gap-2">
          <Button asChild size="sm" variant="ghost">
            <a href="/profile">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <Trans>Back</Trans>
            </a>
          </Button>
          <ProfileForm profile={profile}>
            <Button size="sm" variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              <Trans>Edit</Trans>
            </Button>
          </ProfileForm>
          <Button
            disabled={profile.isDefault || setDefaultMutation.isPending}
            onClick={handleSetDefault}
            size="sm"
            variant="outline"
          >
            <Star className="mr-2 h-4 w-4" />
            <Trans>Set Default</Trans>
          </Button>
          <ProfileDelete profile={profile}>
            <Button size="sm" variant="destructive">
              <Trash className="mr-2 h-4 w-4" />
              <Trans>Delete</Trans>
            </Button>
          </ProfileDelete>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="relative">
            <img
              alt={profile.name}
              className="aspect-[3/4] w-full object-cover"
              src={profile.photoUrl}
            />
            {profile.isDefault && (
              <Badge className="absolute top-4 right-4" variant="secondary">
                <Check className="mr-1 h-3 w-3" />
                <Trans>Default Profile</Trans>
              </Badge>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <Trans>Profile Details</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <Trans>Fit Preference</Trans>
                </span>
                <Badge variant="outline">{profile.fitPreference}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <Trans>Created</Trans>
                </span>
                <span>{dateFormatter.format(new Date(profile.createdAt))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  <Trans>Updated</Trans>
                </span>
                <span>{dateFormatter.format(new Date(profile.updatedAt))}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Trans>Measurements</Trans>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {measurements.map((m) => (
                  <div className="flex justify-between" key={m.label}>
                    <span className="text-muted-foreground">{m.label}</span>
                    <span>
                      {m.value !== null ? (
                        <>
                          {m.value} {m.unit}
                        </>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailScreen;
