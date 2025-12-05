import { useLingui } from "@lingui/react/macro";
import {
  CheckCircle2,
  Clock,
  Loader2,
  type LucideIcon,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TryOnStatus = "pending" | "processing" | "completed" | "failed";

type ActivityItem = {
  id: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  resultUrl: string | null;
  garment: {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
  };
  bodyProfile: {
    id: string;
    name: string;
    photoUrl: string;
  };
};

type RecentActivityProps = {
  items: ActivityItem[];
};

const statusConfig: Record<
  TryOnStatus,
  { icon: LucideIcon; label: string; className: string }
> = {
  pending: {
    icon: Clock,
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  processing: {
    icon: Loader2,
    label: "Processing",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function ActivityThumbnail({ item }: { item: ActivityItem }) {
  const imageUrl = item.resultUrl ?? item.garment.imageUrl;

  if (!imageUrl) {
    return (
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
        <Clock className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
      <img
        alt={item.garment.name}
        className={cn(
          "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105",
          !item.resultUrl && "opacity-60"
        )}
        src={imageUrl}
      />
    </div>
  );
}

function ActivityRow({ item, index }: { item: ActivityItem; index: number }) {
  const status =
    statusConfig[item.status as TryOnStatus] ?? statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-xl border border-transparent bg-muted/30 p-4 transition-all duration-300",
        "fade-in slide-in-from-left-2 animate-in fill-mode-both",
        "hover:border-border hover:bg-muted/50"
      )}
      style={{
        animationDelay: `${(index + 4) * 100}ms`,
        animationDuration: "500ms",
      }}
    >
      {/* Garment thumbnail */}
      <ActivityThumbnail item={item} />

      {/* Details */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">
          {item.garment.name}
        </p>
        <p className="text-muted-foreground text-xs">
          {item.garment.category} &middot; {item.bodyProfile.name}
        </p>
      </div>

      {/* Status and time */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge
          className={cn("gap-1 text-xs", status.className)}
          variant="outline"
        >
          <StatusIcon
            className={cn(
              "h-3 w-3",
              item.status === "processing" && "animate-spin"
            )}
          />
          {status.label}
        </Badge>
        <span className="text-muted-foreground text-xs">
          {formatTimeAgo(item.createdAt)}
        </span>
      </div>
    </div>
  );
}

export function RecentActivity({ items }: RecentActivityProps) {
  const { t } = useLingui();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 py-12 text-center">
        <Clock className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="font-medium text-muted-foreground">
          {t`No recent activity`}
        </p>
        <p className="mt-1 text-muted-foreground/70 text-sm">
          {t`Start a try-on to see your activity here`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <ActivityRow index={index} item={item} key={item.id} />
      ))}
    </div>
  );
}
