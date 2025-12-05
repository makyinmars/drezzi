import { Trans } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { BookOpen, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useTRPC } from "@/trpc/react";

const Route = getRouteApi("/shared/lookbook/$slug");

const ShareLookbookScreen = () => {
  const { slug } = Route.useParams();
  const trpc = useTRPC();

  const lookbookQuery = useSuspenseQuery(
    trpc.lookbook.bySlug.queryOptions({ slug })
  );
  const lookbook = lookbookQuery.data;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-4xl space-y-8 p-6">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Drezzi</span>
          </div>
          <h1 className="mb-2 font-bold text-3xl">{lookbook.name}</h1>
          {lookbook.description && (
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {lookbook.description}
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={lookbook.user.image ?? undefined} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-sm">
              <Trans>by {lookbook.user.name ?? "Anonymous"}</Trans>
            </span>
          </div>
        </div>

        {lookbook.items.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Trans>This lookbook is empty.</Trans>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lookbook.items.map((item) => (
              <Card className="overflow-hidden" key={item.id}>
                <div className="aspect-[3/4] bg-muted">
                  {item.tryOn.resultUrl ? (
                    <img
                      alt={item.tryOn.garment.name}
                      className="h-full w-full object-cover"
                      src={item.tryOn.resultUrl}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Trans>No image</Trans>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="truncate font-medium">
                    {item.tryOn.garment.name}
                  </h3>
                  {item.note && (
                    <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
                      {item.note}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center text-muted-foreground text-sm">
          <Trans>Shared from Drezzi - Virtual Try-On</Trans>
        </div>
      </div>
    </div>
  );
};

export default ShareLookbookScreen;
