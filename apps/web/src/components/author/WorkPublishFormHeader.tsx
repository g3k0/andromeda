"use client";

import { useTranslation } from "@/lib/i18n/use-translation";
import { getPublishIntroGuidance } from "@/lib/i18n/publish-messages";

export function WorkPublishFormHeader() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 id="publish-work-title" className="text-2xl font-semibold text-white">
        {t("publish.title")}
      </h1>
      <p className="mt-1 text-sm text-white/60">{getPublishIntroGuidance(t)}</p>
      <p className="mt-2 text-xs text-white/50">
        {t("publish.requiredFieldsNote")}
      </p>
    </div>
  );
}
