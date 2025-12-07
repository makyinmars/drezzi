import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ButtonWithTooltipProps = ComponentProps<typeof Button> & {
  tooltip: string;
  showTooltip?: boolean;
  side?: "top" | "right" | "bottom" | "left";
};

const ButtonWithTooltip = ({
  tooltip,
  showTooltip = true,
  side = "top",
  children,
  ...buttonProps
}: ButtonWithTooltipProps) => {
  const button = <Button {...buttonProps}>{children}</Button>;

  if (!showTooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

export default ButtonWithTooltip;
