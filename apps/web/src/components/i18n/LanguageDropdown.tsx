"use client";

import { useRouter } from "next/navigation";

import {
  SUPPORTED_LOCALES,
  getLocaleDefinition,
  type SupportedLocale,
} from "@/lib/i18n/locales";
import { switchLocaleInPath } from "@/lib/i18n/routing";
import { useLocale } from "@/lib/i18n/use-locale";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  bindOutsideClose,
  closeParentDetails,
} from "@/components/role-menu-dropdown-behavior";

function navigateToLocale(
  router: ReturnType<typeof useRouter>,
  newLocale: SupportedLocale,
) {
  router.push(switchLocaleInPath(window.location.pathname, newLocale));
}

export function LanguageDropdown() {
  const router = useRouter();
  const activeLocale = useLocale();
  const { t } = useTranslation();
  const current = getLocaleDefinition(activeLocale);
  const menuId = "language-menu";

  return (
    <details
      ref={(node) => {
        if (!node) {
          return;
        }

        return bindOutsideClose(node);
      }}
      className="group relative"
    >
      <summary
        aria-haspopup="menu"
        aria-controls={menuId}
        className="inline-flex cursor-pointer list-none items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/80 marker:content-none hover:border-white/30 hover:text-white [&::-webkit-details-marker]:hidden"
      >
        <span aria-hidden>{current.flag}</span>
        <span>{t(`locales.${activeLocale}`)}</span>
        <span aria-hidden className="text-xs text-white/60">
          ▾
        </span>
      </summary>

      <div
        id={menuId}
        role="menu"
        aria-label="Language"
        className="absolute right-0 z-20 mt-2 min-w-44 overflow-hidden rounded-lg border border-white/10 bg-[#0b1020] py-1 shadow-lg"
      >
        {SUPPORTED_LOCALES.map((locale) => (
          <button
            key={locale.code}
            type="button"
            role="menuitem"
            aria-current={locale.code === activeLocale ? "true" : undefined}
            onClick={(event) => {
              closeParentDetails(event.currentTarget);
              if (locale.code !== activeLocale) {
                navigateToLocale(router, locale.code as SupportedLocale);
              }
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white"
          >
            <span aria-hidden>{locale.flag}</span>
            <span>{t(`locales.${locale.code}`)}</span>
          </button>
        ))}
      </div>
    </details>
  );
}
