import {
  DONATION_WALLET_ADDRESS,
} from "@/lib/donations/constants";
import { generateDonationQrDataUrl } from "@/lib/donations/donation-qr";

export async function DonationSection() {
  const qrDataUrl = await generateDonationQrDataUrl({ width: 200 });

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Donations</h2>
      <p className="max-w-2xl text-white/70">
        Andromeda is free to use for authors and readers. If you would like to
        support the project, you can make a voluntary crypto donation. Contributions
        help cover infrastructure costs — hosting, RPC, indexing, and related
        services that keep the platform running.
      </p>
      <div className="flex max-w-2xl flex-col gap-6 rounded-xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- inline data URL from server-side QR generation */}
        <img
          src={qrDataUrl}
          alt="QR code for crypto donations to Andromeda"
          width={200}
          height={200}
          className="h-[200px] w-[200px] shrink-0 rounded-lg bg-white p-2"
        />
        <div className="space-y-2 text-sm text-white/70">
          <p>
            Scan the QR code with your wallet app, or send crypto directly to:
          </p>
          <p className="break-all font-mono text-white/90">
            {DONATION_WALLET_ADDRESS}
          </p>
          <p className="text-white/50">
            Any EVM-compatible network or token your wallet supports may be used;
            verify the destination address before sending.
          </p>
        </div>
      </div>
    </section>
  );
}
