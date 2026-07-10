import type { TranslationParams } from "./types";

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

/**
 * Replaces `{name}` placeholders in a template with stringified param values.
 * Missing params leave the placeholder visible for easier debugging.
 */
export function interpolate(
  template: string,
  params?: TranslationParams,
): string {
  if (!params) {
    return template;
  }

  return template.replace(PLACEHOLDER_PATTERN, (match, key: string) => {
    const value = params[key];
    if (value === undefined || value === null) {
      return match;
    }
    return String(value);
  });
}
