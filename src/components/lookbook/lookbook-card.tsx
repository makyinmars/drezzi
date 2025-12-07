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
import { APP_LOGO_URL } from "@/constants/app";
import type { LookbookListProcedure } from "@/trpc/routers/lookbook";

import MediaDisplay from "../common/media-display";
import LookbookDelete from "./lookbook-delete";
import LookbookForm from "./lookbook-form";
import ShareDialog from "./share-dialog";

type PreviewGridProps = {
  urls: string[];
  name: string;
};

const PreviewGrid = ({ urls, name }: PreviewGridProps) => {
  const count = urls.length;

  if (count === 1) {
    return (
      <img
        alt={name}
        className="h-full w-full object-cover"
        loading="lazy"
        src={urls[0]}
      />
    );
  }

  if (count === 2) {
    return (
      <div className="grid h-full w-full grid-cols-2 gap-0.5">
        {urls.map((url, i) => (
          <img
            alt={`${name} preview ${i + 1}`}
            className="h-full w-full object-cover"
            key={url}
            loading="lazy"
            src={url}
          />
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid h-full w-full grid-cols-2 gap-0.5">
        <img
          alt={`${name} preview 1`}
          className="h-full w-full object-cover"
          loading="lazy"
          src={urls[0]}
        />
        <div className="grid h-full grid-rows-2 gap-0.5">
          <img
            alt={`${name} preview 2`}
            className="h-full w-full object-cover"
            loading="lazy"
            src={urls[1]}
          />
          <img
            alt={`${name} preview 3`}
            className="h-full w-full object-cover"
            loading="lazy"
            src={urls[2]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
      {urls.map((url, i) => (
        <img
          alt={`${name} preview ${i + 1}`}
          className="h-full w-full object-cover"
          key={url}
          loading="lazy"
          src={url}
        />
      ))}
    </div>
  );
};

type LookbookCardProps = {
  lookbook: LookbookListProcedure[number];
};

const PreviewContent = ({ lookbook }: LookbookCardProps) => {
  if (lookbook.itemCount === 0) {
    return (
      <img
        alt="Drezzi Logo"
        className="h-16 w-16 object-contain opacity-50"
        src={APP_LOGO_URL}
      />
    );
  }

  if (lookbook.previewUrls.length > 0) {
    return <PreviewGrid name={lookbook.name} urls={lookbook.previewUrls} />;
  }

  if (lookbook.coverUrl) {
    return (
      <img
        alt={lookbook.name}
        className="h-full w-full object-cover"
        loading="lazy"
        src={lookbook.coverUrl}
      />
    );
  }

  return <BookOpen className="h-12 w-12 text-muted-foreground" />;
};

const LookbookCard = ({ lookbook }: LookbookCardProps) => {
  const { t } = useLingui();

  return (
    <Card className="overflow-hidden pt-0">
      <Link params={{ lookbookId: lookbook.id }} to="/lookbooks/$lookbookId">
        <MediaDisplay
          alt={lookbook.name}
          className="aspect-auto h-64"
          fit="cover"
          variant="card"
        >
          <PreviewContent lookbook={lookbook} />
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
        </MediaDisplay>
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
