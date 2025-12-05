import { Skeleton } from "@/components/ui/skeleton";

const SubPageHeader = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => (
  <div className="flex flex-col gap-1">
    {title && !title.includes("undefined") ? (
      <h2 className="font-bold text-base md:text-lg lg:text-xl">{title}</h2>
    ) : (
      <Skeleton className="h-9 w-48" />
    )}
    {description && <p className="text-muted-foreground">{description}</p>}
  </div>
);

export default SubPageHeader;
