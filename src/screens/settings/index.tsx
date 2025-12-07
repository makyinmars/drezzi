import { Trans, useLingui } from "@lingui/react/macro";
import PageHeader from "@/components/common/page-header";
import SubPageHeader from "@/components/common/sub-page-header";
import AccountDelete from "@/components/settings/account-delete";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/hooks/use-auth";

const AccountSection = () => {
  const session = useSession();
  const user = session.data?.user;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans>Account Information</Trans>
        </CardTitle>
        <CardDescription>
          <Trans>Your account details</Trans>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-1">
          <p className="font-medium text-sm">
            <Trans>Name</Trans>
          </p>
          <p className="text-muted-foreground text-sm">
            {user?.name ?? <Trans>Not set</Trans>}
          </p>
        </div>
        <div className="grid gap-1">
          <p className="font-medium text-sm">
            <Trans>Email</Trans>
          </p>
          <p className="text-muted-foreground text-sm">{user?.email}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const DangerZoneSection = () => (
  <Card className="border-destructive/50">
    <CardHeader>
      <CardTitle className="text-destructive">
        <Trans>Danger Zone</Trans>
      </CardTitle>
      <CardDescription>
        <Trans>
          Irreversible actions that will permanently affect your account
        </Trans>
      </CardDescription>
    </CardHeader>
    <CardContent>
      <AccountDelete />
    </CardContent>
  </Card>
);

const SettingsScreen = () => {
  const { t } = useLingui();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description={t`Manage your account settings and preferences`}
        title={t`Settings`}
      />

      <SubPageHeader title={t`Account`} />
      <AccountSection />

      <SubPageHeader title={t`Danger Zone`} />
      <DangerZoneSection />
    </div>
  );
};

export default SettingsScreen;
