import { Trans, useLingui } from "@lingui/react/macro";
import { Upload, X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import MediaDisplay from "@/components/common/media-display";
import { Button } from "@/components/ui/button";

const IMAGE_TYPE_REGEX = /^image\/(jpeg|png|webp)$/;

type ImageUploadProps = {
  onFileSelect: (file: File | null, previewUrl: string | null) => void;
  currentImageUrl?: string;
  alt?: string;
  uploadLabel?: ReactNode;
  uploadSubLabel?: ReactNode;
};

export default function ImageUpload({
  onFileSelect,
  currentImageUrl,
  alt = "Image preview",
  uploadLabel,
  uploadSubLabel,
}: ImageUploadProps) {
  const { t } = useLingui();
  const [preview, setPreview] = useState<string | null>(
    currentImageUrl ?? null
  );

  useEffect(() => {
    if (currentImageUrl) {
      setPreview(currentImageUrl);
    }
  }, [currentImageUrl]);

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
          alt={alt}
          className="h-72 rounded-lg"
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
            <X />
          </Button>
        </MediaDisplay>
      ) : (
        <label
          className="flex h-72 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed transition-colors hover:border-muted-foreground/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">
            {uploadLabel ?? <Trans>Drop image here or click to upload</Trans>}
          </span>
          <span className="mt-1 text-muted-foreground text-xs">
            {uploadSubLabel ?? <Trans>JPEG, PNG, or WebP up to 10MB</Trans>}
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
}
