import { useLingui } from "@lingui/react/macro";
import PageHeader from "@/components/common/page-header";

const DashboardScreen = () => {
  const { t } = useLingui();

  return (
    <div className="space-y-6">
      <PageHeader
        description={t`View your dashboard and analytics`}
        title={`📊 ${t`Dashboard`}`}
      />
    </div>
  );
};

export default DashboardScreen;
