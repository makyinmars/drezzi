import { BookOpen } from "lucide-react";

import { APP_LOGO_URL } from "@/constants/app";

type PreviewGridProps = {
  urls: string[];
  coverUrl?: string | null;
  name: string;
  itemCount: number;
};

const ImageGrid = ({ urls, name }: { urls: string[]; name: string }) => {
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

const PreviewGrid = ({ urls, coverUrl, name, itemCount }: PreviewGridProps) => {
  if (itemCount === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <img
          alt="Drezzi Logo"
          className="h-16 w-16 object-contain opacity-50"
          src={APP_LOGO_URL}
        />
      </div>
    );
  }

  if (urls.length > 0) {
    return <ImageGrid name={name} urls={urls} />;
  }

  if (coverUrl) {
    return (
      <img
        alt={name}
        className="h-full w-full object-cover"
        loading="lazy"
        src={coverUrl}
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <BookOpen className="h-12 w-12 text-muted-foreground" />
    </div>
  );
};

export default PreviewGrid;
