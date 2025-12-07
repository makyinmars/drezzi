import { Trans, useLingui } from "@lingui/react/macro";
import { useNavigate } from "@tanstack/react-router";
import { Eye } from "lucide-react";

import CardMediaDisplay from "@/components/custom/card-media-display";
import { Badge } from "@/components/ui/badge";
import type { LookbookListProcedure } from "@/trpc/routers/lookbook";

import LookbookActionsMenu from "./lookbook-actions-menu";
import PreviewGrid from "./preview-grid";

type LookbookCardProps = {
  lookbook: LookbookListProcedure[number];
};

const LookbookCard = ({ lookbook }: LookbookCardProps) => {
  const { t } = useLingui();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({
      to: "/lookbooks/$lookbookId",
      params: { lookbookId: lookbook.id },
    });
  };

  return (
    <CardMediaDisplay
      aspectRatio="4/5"
      bottomRight={
        <Badge variant="secondary">{t`${lookbook.itemCount} items`}</Badge>
      }
      customMedia={
        <PreviewGrid
          coverUrl={lookbook.coverUrl}
          itemCount={lookbook.itemCount}
          name={lookbook.name}
          urls={lookbook.previewUrls}
        />
      }
      onClick={handleClick}
      topRight={<LookbookActionsMenu lookbook={lookbook} />}
    >
      <div className="space-y-1">
        <p className="truncate font-medium text-sm">{lookbook.name}</p>
        {lookbook.description && (
          <p className="line-clamp-2 text-muted-foreground text-xs">
            {lookbook.description}
          </p>
        )}
        {lookbook.isPublic && (
          <Badge className="text-xs" variant="outline">
            <Eye className="mr-1 h-3 w-3" />
            <Trans>Public</Trans>
          </Badge>
        )}
      </div>
    </CardMediaDisplay>
  );
};

export default LookbookCard;
