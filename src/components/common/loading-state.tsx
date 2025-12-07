import { APP_LOGO_URL } from "@/constants/app";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  centered?: boolean;
};

const LoadingState = ({
  size = "md",
  text,
  className,
  centered = true,
}: LoadingStateProps) => {
  const sizeClasses = {
    sm: "h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32",
    md: "h-28 w-28 sm:h-32 sm:w-32 md:h-40 md:w-40",
    lg: "h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48",
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-6",
        centered ? "min-h-screen justify-center" : "min-h-96 justify-start",
        className
      )}
    >
      <div className="relative">
        <img
          alt="Loading"
          className={cn("animate-loading-breathe", sizeClasses[size])}
          src={APP_LOGO_URL}
        />
      </div>
      {text && (
        <p className="animate-loading-text text-center font-medium text-muted-foreground text-sm tracking-wide sm:text-base">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingState;
