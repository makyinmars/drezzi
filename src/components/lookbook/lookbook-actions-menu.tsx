import { Trans } from "@lingui/react/macro";
import { Edit, MoreVertical, Share2, Trash } from "lucide-react";
import { type MouseEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LookbookListProcedure } from "@/trpc/routers/lookbook";

import LookbookDelete from "./lookbook-delete";
import LookbookForm from "./lookbook-form";
import ShareDialog from "./share-dialog";

type LookbookActionsMenuProps = {
  lookbook: LookbookListProcedure[number];
};

const LookbookActionsMenu = ({ lookbook }: LookbookActionsMenuProps) => {
  const [action, setAction] = useState<"edit" | "share" | "delete" | null>(
    null
  );
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (action && triggerRef.current) {
      triggerRef.current.click();
      setAction(null);
    }
  }, [action]);

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="size-8 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={handleClick}
            size="icon"
            variant="ghost"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setAction("edit")}>
            <Edit className="size-4" />
            <Trans>Edit</Trans>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setAction("share")}>
            <Share2 className="size-4" />
            <Trans>Share</Trans>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setAction("delete")}
            variant="destructive"
          >
            <Trash className="size-4" />
            <Trans>Delete</Trans>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LookbookForm lookbook={lookbook}>
        <button
          className="hidden"
          ref={action === "edit" ? triggerRef : undefined}
          type="button"
        />
      </LookbookForm>

      <ShareDialog lookbook={lookbook}>
        <button
          className="hidden"
          ref={action === "share" ? triggerRef : undefined}
          type="button"
        />
      </ShareDialog>

      <LookbookDelete lookbook={lookbook}>
        <button
          className="hidden"
          ref={action === "delete" ? triggerRef : undefined}
          type="button"
        />
      </LookbookDelete>
    </>
  );
};

export default LookbookActionsMenu;
