import { describe, expect, it } from "vitest";

import { SUPPORTED_LOCALE_CODES } from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/translate";
import { WALLET_DISCONNECTED_MESSAGE_KEY } from "./messages";

const WALLET_KEYS = [
  "wallet.connect",
  "wallet.connecting",
  "wallet.connectingAria",
] as const;

describe("notification message keys", () => {
  it.each(SUPPORTED_LOCALE_CODES)(
    "resolves wallet disconnected copy for locale %s",
    (locale) => {
      const message = translate(locale, WALLET_DISCONNECTED_MESSAGE_KEY);
      expect(message).not.toMatch(/^\[missing:/);
      expect(message.length).toBeGreaterThan(0);
    },
  );

  it.each(SUPPORTED_LOCALE_CODES)(
    "resolves wallet button copy for locale %s",
    (locale) => {
      for (const key of WALLET_KEYS) {
        const label = translate(locale, key);
        expect(label).not.toMatch(/^\[missing:/);
        expect(label.length).toBeGreaterThan(0);
      }
    },
  );
});
