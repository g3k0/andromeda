import { parseEther } from "viem";

import type { TranslateFn } from "@/lib/i18n/translate";
import {
  WORK_PUBLISH_MAX_MAX_COPIES,
  WORK_PUBLISH_MIN_MAX_COPIES,
} from "./work-publish-limits";

export const WORK_PUBLISH_NAME_MAX_LENGTH = 120;
export const WORK_PUBLISH_EXTERNAL_URL_MAX_LENGTH = 2048;

const UNSAFE_CONTROL_CHARS = /[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/;

export function containsUnsafeControlCharacters(value: string): boolean {
  return UNSAFE_CONTROL_CHARS.test(value);
}

export function validateWorkPublishName(name: string, t: TranslateFn): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return t("publish.validation.title.required");
  }
  if (trimmed.length > WORK_PUBLISH_NAME_MAX_LENGTH) {
    return t("publish.validation.title.maxLength", {
      max: String(WORK_PUBLISH_NAME_MAX_LENGTH),
    });
  }
  if (containsUnsafeControlCharacters(trimmed)) {
    return t("publish.validation.title.invalidCharacters");
  }
  return null;
}

export function validateWorkPublishExternalUrl(
  externalUrl: string,
  t: TranslateFn,
): string | null {
  const trimmed = externalUrl.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > WORK_PUBLISH_EXTERNAL_URL_MAX_LENGTH) {
    return t("publish.validation.externalUrl.tooLong");
  }
  if (containsUnsafeControlCharacters(trimmed)) {
    return t("publish.validation.externalUrl.invalidCharacters");
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return t("publish.validation.externalUrl.invalidProtocol");
    }
  } catch {
    return t("publish.validation.externalUrl.invalid");
  }

  return null;
}

export function validateWorkPublishMaxCopies(
  maxCopies: string,
  t: TranslateFn,
): string | null {
  const trimmed = maxCopies.trim();
  if (!trimmed) {
    return t("publish.validation.maxCopies.required");
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    return t("publish.validation.maxCopies.wholeNumber");
  }
  if (parsed < WORK_PUBLISH_MIN_MAX_COPIES) {
    return t("publish.validation.maxCopies.min", {
      min: String(WORK_PUBLISH_MIN_MAX_COPIES),
    });
  }
  if (parsed > WORK_PUBLISH_MAX_MAX_COPIES) {
    return t("publish.validation.maxCopies.max", {
      max: String(WORK_PUBLISH_MAX_MAX_COPIES),
    });
  }

  return null;
}

export function validateWorkPublishPriceMatic(
  priceMatic: string,
  t: TranslateFn,
): string | null {
  const trimmed = priceMatic.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const price = parseEther(trimmed);
    if (price < 0n) {
      return t("publish.validation.priceMatic.negative");
    }
  } catch {
    return t("publish.validation.priceMatic.invalid");
  }

  return null;
}
