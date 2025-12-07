import { Trans } from "@lingui/react/macro";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Shirt, User } from "lucide-react";
import { motion } from "motion/react";

import ContentLayout from "@/components/common/content-layout";
import MediaDisplay from "@/components/common/media-display";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
    <ContentLayout>
      <div className="mx-auto max-w-4xl space-y-8 p-6 pt-24">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="mb-2 font-bold text-3xl tracking-tight">
            {lookbook.name}
          </h1>
          {lookbook.description && (
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {lookbook.description}
            </p>
          )}
          <div className="mt-4 flex items-center justify-center gap-3">
            <Avatar className="h-8 w-8 ring-2 ring-background">
              <AvatarImage src={lookbook.user.image ?? undefined} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground text-sm">
              <Trans>by {lookbook.user.name ?? "Anonymous"}</Trans>
            </span>
            <Badge variant="secondary">
              {lookbook.items.length}{" "}
              {lookbook.items.length === 1 ? (
                <Trans>item</Trans>
              ) : (
                <Trans>items</Trans>
              )}
            </Badge>
          </div>
        </motion.div>

        {lookbook.items.length === 0 ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Empty className="border">
              <EmptyMedia variant="icon">
                <Shirt className="h-6 w-6" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>
                  <Trans>No items yet</Trans>
                </EmptyTitle>
                <EmptyDescription>
                  <Trans>
                    This lookbook doesn't have any items to display.
                  </Trans>
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lookbook.items.map((item, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0, scale: 1 }}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                key={item.id}
                transition={{
                  delay: 0.1 + index * 0.05,
                  duration: 0.4,
                  ease: "easeOut",
                }}
              >
                <Card className="group overflow-hidden pt-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                  <MediaDisplay
                    alt={item.tryOn.garment.name}
                    aspectRatio="3/4"
                    className="overflow-hidden"
                    fit="cover"
                    src={item.tryOn.resultUrl ?? undefined}
                    variant="card"
                  >
                    {!item.tryOn.resultUrl && (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Shirt className="h-12 w-12 opacity-50" />
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </MediaDisplay>
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
              </motion.div>
            ))}
          </div>
        )}

        <motion.div
          animate={{ opacity: 1 }}
          className="text-center text-muted-foreground text-sm"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Trans>Shared from Drezzi - Virtual Try-On</Trans>
        </motion.div>
      </div>
    </ContentLayout>
  );
};

export default ShareLookbookScreen;
