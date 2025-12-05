import { Trans } from "@lingui/react/macro";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";

type TryOnProgressProps = {
  status: string;
  className?: string;
};

type StatusConfig = {
  icon: LucideIcon;
  label: React.ReactNode;
  color: string;
  animate?: boolean;
};

const TryOnProgress = ({ status, className }: TryOnProgressProps) => {
  const config: Record<string, StatusConfig> = {
    pending: {
      icon: Clock,
      label: <Trans>Waiting in queue...</Trans>,
      color: "text-muted-foreground",
    },
    processing: {
      icon: Loader2,
      label: <Trans>Generating try-on...</Trans>,
      color: "text-primary",
      animate: true,
    },
    completed: {
      icon: CheckCircle,
      label: <Trans>Complete</Trans>,
      color: "text-green-500",
    },
    failed: {
      icon: AlertCircle,
      label: <Trans>Failed</Trans>,
      color: "text-destructive",
    },
  };

  const statusConfig = config[status] ?? config.pending;
  const { icon: Icon, label, color, animate } = statusConfig;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Icon className={`h-8 w-8 ${color} ${animate ? "animate-spin" : ""}`} />
      <span className={`text-sm ${color}`}>{label}</span>
    </div>
  );
};

export default TryOnProgress;
