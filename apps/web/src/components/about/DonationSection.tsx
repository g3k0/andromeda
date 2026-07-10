import {
  DONATION_WALLET_ADDRESS,
} from "@/lib/donations/constants";
import { generateDonationQrDataUrl } from "@/lib/donations/donation-qr";
import { getServerTranslations } from "@/lib/i18n/server";
import type { SupportedLocale } from "@/lib/i18n/locales";

export async function DonationSection({ locale }: { locale: SupportedLocale }) {
  const { t } = getServerTranslations(locale);
  const qrDataUrl = await generateDonationQrDataUrl({ width: 200 });

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">{t("about.donationsTitle")}</h2>
      <p className="max-w-2xl text-white/70">{t("about.donationsIntro")}</p>
      <div className="flex max-w-2xl flex-col gap-6 rounded-xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- inline data URL from server-side QR generation */}
        <img
          src={qrDataUrl}
          alt={t("about.donationsQrAlt")}
          width={200}
          height={200}
          className="h-[200px] w-[200px] shrink-0 rounded-lg bg-white p-2"
        />
        <div className="space-y-2 text-sm text-white/70">
          <p>{t("about.donationsScan")}</p>
          <p className="break-all font-mono text-white/90">
            {DONATION_WALLET_ADDRESS}
          </p>
          <p className="text-white/50">{t("about.donationsDisclaimer")}</p>
        </div>
      </div>
    </section>
  );
}
