import { Trans, useLingui } from "@lingui/react/macro";
import { Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import MediaDisplay from "@/components/common/media-display";
import { Button } from "@/components/ui/button";

const IMAGE_TYPE_REGEX = /^image\/(jpeg|png|webp)$/;

type GarmentImageUploadProps = {
  onFileSelect: (file: File | null, previewUrl: string | null) => void;
  currentImageUrl?: string;
};

const GarmentImageUpload = ({
  onFileSelect,
  currentImageUrl,
}: GarmentImageUploadProps) => {
  const { t } = useLingui();
  const [preview, setPreview] = useState<string | null>(
    currentImageUrl ?? null
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.type.match(IMAGE_TYPE_REGEX)) {
        toast.error(t`Please select a valid image file (JPEG, PNG, or WebP)`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(t`File size must be less than 10MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        setPreview(previewUrl);
        onFileSelect(file, previewUrl);
      };
      reader.readAsDataURL(file);
    },
    [onFileSelect, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files.item(0);
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.item(0);
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const clearPreview = () => {
    setPreview(null);
    onFileSelect(null, null);
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <MediaDisplay
          alt="Garment preview"
          className="h-48 rounded-lg"
          fit="cover"
          src={preview}
          variant="card"
        >
          <Button
            className="absolute top-2 right-2"
            onClick={clearPreview}
            size="icon"
            type="button"
            variant="destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </MediaDisplay>
      ) : (
        <label
          className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed transition-colors hover:border-muted-foreground/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">
            <Trans>Drop garment image here or click to upload</Trans>
          </span>
          <span className="mt-1 text-muted-foreground text-xs">
            <Trans>JPEG, PNG, or WebP up to 10MB</Trans>
          </span>
          <input
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleInputChange}
            type="file"
          />
        </label>
      )}
    </div>
  );
};

export default GarmentImageUpload;
