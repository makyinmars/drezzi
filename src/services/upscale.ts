import type { EnhancementStatus } from "generated/prisma/enums";

import { prisma } from "@/lib/prisma";
import { getCachedPresignedUrl } from "@/lib/s3";

type UpdateProfileEnhancementParams = {
  status: EnhancementStatus;
  enhancedKey?: string;
  error?: string;
};

export async function updateProfileEnhancement(
  profileId: string,
  params: UpdateProfileEnhancementParams
) {
  let enhancedPhotoId: string | undefined;

  if (params.enhancedKey) {
    const file = await prisma.file.create({
      data: {
        key: params.enhancedKey,
        bucket: "media",
        mimeType: "image/png",
      },
    });
    enhancedPhotoId = file.id;
  }

  return await prisma.bodyProfile.update({
    where: { id: profileId },
    data: {
      enhancementStatus: params.status,
      enhancedPhotoId,
      enhancementError: params.error ?? null,
    },
  });
}

export async function getEnhancedPhotoUrl(key: string) {
  return await getCachedPresignedUrl(key);
}
