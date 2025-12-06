import { Trans } from "@lingui/react/macro";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";

import type { TryOnStage } from "@/lib/pubsub";
import { cn } from "@/lib/utils";

type TryOnProgressProps = {
  status: string;
  stage?: TryOnStage;
  className?: string;
};

type StageConfig = {
  icon: LucideIcon;
  label: React.ReactNode;
  color: string;
  animate?: boolean;
};

const STAGES: TryOnStage[] = [
  "queued",
  "fetching_images",
  "generating",
  "uploading",
];

const stageConfig: Record<
  TryOnStage | "pending" | "processing" | "completed",
  StageConfig
> = {
  pending: {
    icon: Clock,
    label: <Trans>Waiting in queue...</Trans>,
    color: "text-muted-foreground",
  },
  queued: {
    icon: Clock,
    label: <Trans>Queued</Trans>,
    color: "text-muted-foreground",
  },
  fetching_images: {
    icon: Download,
    label: <Trans>Fetching images...</Trans>,
    color: "text-primary",
    animate: true,
  },
  generating: {
    icon: Sparkles,
    label: <Trans>Generating try-on...</Trans>,
    color: "text-primary",
    animate: true,
  },
  uploading: {
    icon: Upload,
    label: <Trans>Uploading result...</Trans>,
    color: "text-primary",
    animate: true,
  },
  processing: {
    icon: Loader2,
    label: <Trans>Processing...</Trans>,
    color: "text-primary",
    animate: true,
  },
  complete: {
    icon: CheckCircle,
    label: <Trans>Complete</Trans>,
    color: "text-green-500",
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

const TryOnProgress = ({ status, stage, className }: TryOnProgressProps) => {
  // Use granular stage if available, otherwise fall back to status
  const activeStage =
    stage ?? (status === "processing" ? "processing" : status);
  const stageIndex = STAGES.indexOf(activeStage as TryOnStage);
  const config =
    stageConfig[activeStage as keyof typeof stageConfig] ?? stageConfig.pending;
  const { icon: Icon, label, color, animate } = config;

  const showProgressBar = status === "processing" && stageIndex >= 0;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {showProgressBar && (
        <div className="flex gap-1.5">
          {STAGES.map((s, i) => (
            <div
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors",
                i <= stageIndex ? "bg-primary" : "bg-muted"
              )}
              key={s}
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Icon className={cn("h-6 w-6", color, animate && "animate-spin")} />
        <span className={cn("text-sm", color)}>{label}</span>
      </div>
    </div>
  );
};

export default TryOnProgress;
