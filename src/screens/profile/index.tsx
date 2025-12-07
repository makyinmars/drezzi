import { Trans, useLingui } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import PageHeader from "@/components/common/page-header";
import ProfileCard from "@/components/profile/profile-card";
import ProfileForm from "@/components/profile/profile-form";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTRPC } from "@/trpc/react";

const ProfileListScreen = () => {
  const isMobile = useIsMobile();
  const { t } = useLingui();
  const trpc = useTRPC();
  const profilesQuery = useSuspenseQuery(trpc.profile.list.queryOptions());

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <ProfileForm>
            <Button size={isMobile ? "icon" : "default"}>
              <Plus className="size-4" />
              {!isMobile && <Trans>Create Profile</Trans>}
            </Button>
          </ProfileForm>
        }
        description={t`Manage your body profiles for virtual try-ons`}
        title={t`Body Profiles`}
      />

      {profilesQuery.data.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plus className="h-5 w-5" />
            </EmptyMedia>
            <EmptyTitle>
              <Trans>No profiles yet</Trans>
            </EmptyTitle>
            <EmptyDescription>
              <Trans>
                Create your first body profile to start trying on clothes
                virtually.
              </Trans>
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <ProfileForm>
              <Button size={isMobile ? "icon" : "default"}>
                <Plus className="size-4" />
                {!isMobile && <Trans>Create Your First Profile</Trans>}
              </Button>
            </ProfileForm>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {profilesQuery.data.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileListScreen;
