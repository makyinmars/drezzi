import { Trans, useLingui } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import { Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/react";

const IMAGE_TYPE_REGEX = /^image\/(jpeg|png|webp)$/;

type PhotoUploadProps = {
  onUploadComplete: (photoUrl: string, photoKey: string) => void;
  currentPhotoUrl?: string;
};

const PhotoUpload = ({
  onUploadComplete,
  currentPhotoUrl,
}: PhotoUploadProps) => {
  const { t } = useLingui();
  const trpc = useTRPC();
  const [preview, setPreview] = useState<string | null>(
    currentPhotoUrl || null
  );
  const [uploading, setUploading] = useState(false);

  const getUploadUrlMutation = useMutation(
    trpc.profile.getUploadUrl.mutationOptions({})
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.match(IMAGE_TYPE_REGEX)) {
        toast.error(t`Please select a valid image file (JPEG, PNG, or WebP)`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(t`File size must be less than 10MB`);
        return;
      }

      setUploading(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const uploadPromise = async () => {
        const { url, key, photoUrl } = await getUploadUrlMutation.mutateAsync({
          contentType: file.type,
          contentLength: file.size,
        });

        const response = await fetch(url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to upload photo");
        }

        onUploadComplete(photoUrl, key);
        return photoUrl;
      };

      toast.promise(uploadPromise(), {
        loading: t`Uploading photo...`,
        success: () => {
          setUploading(false);
          return t`Photo uploaded successfully`;
        },
        error: (err) => {
          setUploading(false);
          setPreview(currentPhotoUrl || null);
          return t`Error uploading photo: ${err.message}`;
        },
      });
    },
    [getUploadUrlMutation, onUploadComplete, currentPhotoUrl, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative">
          <img
            alt="Profile preview"
            className="h-48 w-full rounded-lg object-cover"
            src={preview}
          />
          <Button
            className="absolute top-2 right-2"
            onClick={clearPreview}
            size="icon"
            type="button"
            variant="destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed transition-colors hover:border-muted-foreground/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">
            <Trans>Drop photo here or click to upload</Trans>
          </span>
          <span className="mt-1 text-muted-foreground text-xs">
            <Trans>JPEG, PNG, or WebP up to 10MB</Trans>
          </span>
          <input
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={handleInputChange}
            type="file"
          />
        </label>
      )}
    </div>
  );
};

export default PhotoUpload;
