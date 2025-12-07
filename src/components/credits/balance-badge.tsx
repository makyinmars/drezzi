import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Coins } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/react";

type BalanceBadgeProps = {
  className?: string;
};

export function BalanceBadge({ className }: BalanceBadgeProps) {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.credits.getBalance.queryOptions());

  if (isLoading) {
    return (
      <Badge className={className} variant="secondary">
        <Coins className="mr-1 h-3 w-3" />
        <span className="animate-pulse">...</span>
      </Badge>
    );
  }

  return (
    <Link to="/credits">
      <Badge
        className={className}
        variant={data && data.balance > 0 ? "secondary" : "destructive"}
      >
        <Coins className="mr-1 h-3 w-3" />
        {data?.balance ?? 0}
      </Badge>
    </Link>
  );
}
