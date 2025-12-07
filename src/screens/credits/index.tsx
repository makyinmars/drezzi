import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CreditCard,
  Gift,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TRY_ON_COST } from "@/services/credits/constants";
import { useTRPC } from "@/trpc/react";

const CreditsScreen = () => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const navigate = useNavigate();
  const search = useSearch({ from: "/(authed)/credits/" });
  const [processingSync, setProcessingSync] = useState(false);

  const balanceQuery = useSuspenseQuery(trpc.credits.getBalance.queryOptions());
  const packagesQuery = useSuspenseQuery(
    trpc.credits.getPackages.queryOptions()
  );
  const historyQuery = useSuspenseQuery(
    trpc.credits.getHistory.queryOptions({ limit: 10 })
  );

  const syncMutation = useMutation(
    trpc.credits.syncCheckoutSession.mutationOptions()
  );
  const cancelMutation = useMutation(
    trpc.credits.cancelCheckout.mutationOptions()
  );
  const checkoutMutation = useMutation(
    trpc.credits.createCheckoutSession.mutationOptions()
  );

  useEffect(() => {
    if (search.purchase === "success" && search.session_id && !processingSync) {
      setProcessingSync(true);
      syncMutation.mutate(
        { sessionId: search.session_id },
        {
          onSuccess: (data) => {
            if (!data.alreadyProcessed) {
              toast.success(
                t`Payment successful! ${data.creditsGranted} credits added.`
              );
            }
            balanceQuery.refetch();
            historyQuery.refetch();
            navigate({ to: "/credits", replace: true });
          },
          onError: () => {
            toast.error(t`Failed to process payment. Please contact support.`);
            navigate({ to: "/credits", replace: true });
          },
          onSettled: () => setProcessingSync(false),
        }
      );
    } else if (search.purchase === "cancelled" && search.session_id) {
      cancelMutation.mutate(
        { sessionId: search.session_id },
        {
          onSettled: () => {
            toast.info(t`Purchase cancelled`);
            navigate({ to: "/credits", replace: true });
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search.purchase,
    search.session_id,
    balanceQuery.refetch,
    cancelMutation.mutate,
    historyQuery.refetch,
    navigate,
    processingSync,
    syncMutation.mutate,
    t,
  ]);

  const handlePurchase = (packageId: "starter" | "basic" | "pro") => {
    checkoutMutation.mutate(
      { packageId },
      {
        onSuccess: (data) => {
          if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          }
        },
        onError: () => {
          toast.error(t`Failed to create checkout session`);
        },
      }
    );
  };

  const balance = balanceQuery.data;
  const packages = packagesQuery.data;
  const history = historyQuery.data;

  return (
    <div className="space-y-8">
      <PageHeader
        description={t`Purchase credits to use virtual try-ons`}
        title={t`Credits`}
      />

      {/* Balance Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <Trans>Your Balance</Trans>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-5xl text-primary">
              {balance.balance}
            </span>
            <span className="text-muted-foreground">
              <Trans>credits</Trans>
            </span>
          </div>
          <p className="mt-2 text-muted-foreground text-sm">
            <Trans>Each try-on uses {TRY_ON_COST} credit</Trans>
          </p>
          <div className="mt-4 flex gap-4 text-muted-foreground text-sm">
            <span>
              <Trans>Purchased: {balance.totalPurchased}</Trans>
            </span>
            <span>
              <Trans>Used: {balance.totalUsed}</Trans>
            </span>
            <span>
              <Trans>Bonus: {balance.totalBonus}</Trans>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <section>
        <h2 className="mb-4 font-bold text-2xl">
          <Trans>Buy Credits</Trans>
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {packages.map((pkg) => {
            const isPopular = pkg.id === "basic";
            return (
              <Card
                className={cn(
                  "relative transition-all hover:shadow-lg",
                  isPopular && "border-primary ring-1 ring-primary"
                )}
                key={pkg.id}
              >
                {isPopular && (
                  <div className="-translate-y-1/2 absolute top-0 right-4 rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground text-xs">
                    <Trans>Most Popular</Trans>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{pkg.name}</CardTitle>
                  <CardDescription>
                    {pkg.credits} <Trans>credits</Trans>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-3xl">
                      ${(pkg.priceInCents / 100).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-sm">USD</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    ${(pkg.priceInCents / 100 / pkg.credits).toFixed(2)}{" "}
                    <Trans>per credit</Trans>
                  </p>
                  <Button
                    className="w-full"
                    disabled={checkoutMutation.isPending}
                    onClick={() =>
                      handlePurchase(pkg.id as "starter" | "basic" | "pro")
                    }
                    variant={isPopular ? "default" : "outline"}
                  >
                    {checkoutMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        <Trans>Buy Now</Trans>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Transaction History */}
      <section>
        <h2 className="mb-4 font-bold text-2xl">
          <Trans>Recent Transactions</Trans>
        </h2>
        {history.items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Trans>No transactions yet</Trans>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="divide-y p-0">
              {history.items.map((tx) => (
                <div
                  className="flex items-center justify-between p-4"
                  key={tx.id}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full",
                        tx.amount > 0
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-rose-500/10 text-rose-500"
                      )}
                    >
                      {tx.type === "PURCHASE" && (
                        <CreditCard className="h-5 w-5" />
                      )}
                      {tx.type === "USAGE" && <Sparkles className="h-5 w-5" />}
                      {tx.type === "BONUS" && <Gift className="h-5 w-5" />}
                      {tx.type === "REFUND" && (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                      {tx.type === "ADMIN" && <Check className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium">
                        {tx.description ?? tx.type}
                        {tx.packageName && ` - ${tx.packageName}`}
                        {tx.garmentName && ` - ${tx.garmentName}`}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.amount > 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-rose-500" />
                    )}
                    <span
                      className={cn(
                        "font-semibold",
                        tx.amount > 0 ? "text-emerald-500" : "text-rose-500"
                      )}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Processing overlay */}
      {processingSync && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-80">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="font-medium">
                <Trans>Processing your payment...</Trans>
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CreditsScreen;
