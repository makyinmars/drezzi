import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ComboboxProps<T> = {
  items: T[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  getItemValue: (item: T) => string;
  getItemLabel: (item: T) => string;
  renderItem?: (item: T, selected: boolean) => React.ReactNode;
  renderPreview?: (item: T) => React.ReactNode;
  className?: string;
  disabled?: boolean;
};

function Combobox<T>({
  items,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  getItemValue,
  getItemLabel,
  renderItem,
  renderPreview,
  className,
  disabled = false,
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false);

  const selected = items.find((item) => getItemValue(item) === value);

  return (
    <div className="space-y-2" data-slot="combobox">
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            disabled={disabled}
            role="combobox"
            variant="outline"
          >
            {selected ? getItemLabel(selected) : placeholder}
            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {items.map((item) => {
                  const itemValue = getItemValue(item);
                  const isSelected = value === itemValue;

                  return (
                    <CommandItem
                      key={itemValue}
                      onSelect={() => {
                        onValueChange(isSelected ? "" : itemValue);
                        setOpen(false);
                      }}
                      value={itemValue}
                    >
                      {renderItem ? (
                        renderItem(item, isSelected)
                      ) : (
                        <>
                          <CheckIcon
                            className={cn(
                              "mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {getItemLabel(item)}
                        </>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected && renderPreview?.(selected)}
    </div>
  );
}

export { Combobox };
export type { ComboboxProps };
