import { AUTHOR_AVATAR_MAX_KB } from "@/components/author/author-avatar-upload-guidance";
import type { TranslationParams } from "./types";
import type { TranslateFn } from "./translate";

export function getAuthorAvatarUploadGuidance(t: TranslateFn): string {
  return t("authorProfile.guidance.avatarUpload", {
    formats: "PNG, JPEG, WebP",
    maxKb: String(AUTHOR_AVATAR_MAX_KB),
  });
}

export function getAuthorBioGuidance(t: TranslateFn): string {
  return t("authorProfile.guidance.bio");
}

export function translateAvatarFileError(
  t: TranslateFn,
  error: { code: string; params?: TranslationParams },
): string {
  return t(error.code, error.params);
}
