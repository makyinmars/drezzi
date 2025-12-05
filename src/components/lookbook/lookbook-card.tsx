import { Trans, useLingui } from "@lingui/react/macro";
import { Link } from "@tanstack/react-router";
import { BookOpen, Edit, Eye, Share2, Trash } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LookbookListProcedure } from "@/trpc/routers/lookbook";

import LookbookDelete from "./lookbook-delete";
import LookbookForm from "./lookbook-form";
import ShareDialog from "./share-dialog";

type LookbookCardProps = {
  lookbook: LookbookListProcedure[number];
};

const LookbookCard = ({ lookbook }: LookbookCardProps) => {
  const { t } = useLingui();

  return (
    <Card className="overflow-hidden">
      <Link params={{ lookbookId: lookbook.id }} to="/lookbooks/$lookbookId">
        <div className="relative h-48 bg-muted">
          {lookbook.coverUrl ? (
            <img
              alt={lookbook.name}
              className="h-full w-full object-cover"
              src={lookbook.coverUrl}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1">
            {lookbook.isPublic && (
              <Badge variant="secondary">
                <Eye className="mr-1 h-3 w-3" />
                <Trans>Public</Trans>
              </Badge>
            )}
          </div>
          <div className="absolute right-2 bottom-2">
            <Badge variant="secondary">{t`${lookbook.itemCount} items`}</Badge>
          </div>
        </div>
      </Link>
      <CardHeader className="pb-2">
        <CardTitle className="truncate">{lookbook.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {lookbook.description ?? <Trans>No description</Trans>}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex gap-2 pt-2">
        <LookbookForm lookbook={lookbook}>
          <Button size="sm" variant="outline">
            <Edit className="mr-1 h-3 w-3" />
            <Trans>Edit</Trans>
          </Button>
        </LookbookForm>
        <ShareDialog lookbook={lookbook}>
          <Button size="sm" variant="outline">
            <Share2 className="mr-1 h-3 w-3" />
            <Trans>Share</Trans>
          </Button>
        </ShareDialog>
        <LookbookDelete lookbook={lookbook}>
          <Button size="sm" variant="destructive">
            <Trash className="mr-1 h-3 w-3" />
            <Trans>Delete</Trans>
          </Button>
        </LookbookDelete>
      </CardFooter>
    </Card>
  );
};

export default LookbookCard;
