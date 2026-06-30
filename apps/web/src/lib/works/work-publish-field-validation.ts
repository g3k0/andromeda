export const WORK_PUBLISH_NAME_MAX_LENGTH = 120;
export const WORK_PUBLISH_DESCRIPTION_MAX_LENGTH = 500;
export const WORK_PUBLISH_EXTERNAL_URL_MAX_LENGTH = 2048;

const UNSAFE_CONTROL_CHARS = /[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/;

export function containsUnsafeControlCharacters(value: string): boolean {
  return UNSAFE_CONTROL_CHARS.test(value);
}

export function validateWorkPublishName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Title is required.";
  }
  if (trimmed.length > WORK_PUBLISH_NAME_MAX_LENGTH) {
    return `Title must be ${WORK_PUBLISH_NAME_MAX_LENGTH} characters or fewer.`;
  }
  if (containsUnsafeControlCharacters(trimmed)) {
    return "Title contains invalid characters.";
  }
  return null;
}

export function validateWorkPublishDescription(description: string): string | null {
  const trimmed = description.trim();
  if (!trimmed) {
    return "Description is required.";
  }
  if (trimmed.length > WORK_PUBLISH_DESCRIPTION_MAX_LENGTH) {
    return `Description must be ${WORK_PUBLISH_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }
  if (containsUnsafeControlCharacters(trimmed)) {
    return "Description contains invalid characters.";
  }
  return null;
}

export function validateWorkPublishExternalUrl(externalUrl: string): string | null {
  const trimmed = externalUrl.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > WORK_PUBLISH_EXTERNAL_URL_MAX_LENGTH) {
    return "External URL is too long.";
  }
  if (containsUnsafeControlCharacters(trimmed)) {
    return "External URL contains invalid characters.";
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "External URL must use HTTP or HTTPS.";
    }
  } catch {
    return "Enter a valid URL.";
  }

  return null;
}
