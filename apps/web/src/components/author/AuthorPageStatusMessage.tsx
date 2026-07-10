"use client";

import { LocalizedLink } from "@/lib/i18n/LocalizedLink";
import { useTranslation } from "@/lib/i18n/use-translation";

export type AuthorPageStatusMessageProps = {
  title: string;
  description: string;
};

export function AuthorPageStatusMessage({
  title,
  description,
}: AuthorPageStatusMessageProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-white/60">{description}</p>
      <LocalizedLink
        href="/"
        className="mt-4 inline-block text-sm text-andromeda-light hover:text-white"
      >
        {t("authorProfile.backToLibrary")}
      </LocalizedLink>
    </div>
  );
}

export function AuthorPageInvalidAddress() {
  const { t } = useTranslation();

  return (
    <AuthorPageStatusMessage
      title={t("authorProfile.invalidAddressTitle")}
      description={t("authorProfile.invalidAddressDescription")}
    />
  );
}

export function AuthorPageNotFound({ address }: { address: string }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <AuthorPageStatusMessage
        title={t("authorProfile.notFoundTitle")}
        description={t("authorProfile.notFoundDescription")}
      />
      <p className="break-all text-center font-mono text-xs text-white/40">
        {address}
      </p>
    </div>
  );
}
