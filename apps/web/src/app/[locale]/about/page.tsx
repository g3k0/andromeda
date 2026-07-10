import type { Metadata } from "next";

import { DonationSection } from "@/components/about/DonationSection";
import { buildLocalizedPageMetadata } from "@/lib/i18n/page-metadata";
import { isSupportedLocale, type SupportedLocale } from "@/lib/i18n/locales";

type AboutPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isSupportedLocale(localeParam)) {
    return {};
  }

  return buildLocalizedPageMetadata(
    localeParam as SupportedLocale,
    "/about",
    "meta.about.title",
    "meta.about.description",
  );
}

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">About Andromeda</h1>
        <p className="max-w-2xl text-lg text-white/70">
          Andromeda is a blockchain publishing platform for literary works.
          Writers certify, number, and mint limited editions as NFTs; readers
          buy, read, and collect genuine copies. The platform connects authors
          and readers — it does not take a cut of your sales.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">What we do</h2>
        <p className="max-w-2xl text-white/70">
          Each work is stored off-chain on IPFS and certified on-chain on
          Polygon. Every copy is an ERC-721 token tied to its author&apos;s
          wallet. Ownership and transfer history are public and verifiable.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">No platform fees</h2>
        <ul className="max-w-2xl list-disc space-y-2 pl-5 text-white/70">
          <li>
            Andromeda does not charge authors subscription fees or listing
            fees.
          </li>
          <li>
            Andromeda does not take a percentage of primary or secondary
            sales.
          </li>
          <li>
            <strong className="text-white/90">
              100% of primary-sale proceeds go to the author.
            </strong>{" "}
            The smart contract forwards payment directly to the author&apos;s
            wallet.
          </li>
          <li>
            Authors remain solely responsible for taxes and legal obligations
            in their jurisdiction.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">What authors pay for</h2>
        <p className="max-w-2xl text-white/70">
          Putting a work on-chain involves costs that{" "}
          <strong className="text-white/90">authors bear directly</strong> — not
          the platform:
        </p>
        <ul className="max-w-2xl list-disc space-y-2 pl-5 text-white/70">
          <li>
            <strong className="text-white/90">Blockchain gas fees (Polygon)</strong>{" "}
            — paid in MATIC when registering a work, minting copies, and
            updating on-chain settings. These fees go to the Polygon network
            validators, not to Andromeda.
          </li>
          <li>
            <strong className="text-white/90">IPFS storage</strong> — storing
            the text and metadata, typically via a pinning service the author
            chooses and pays for.
          </li>
          <li>
            <strong className="text-white/90">Buyer transaction fees</strong>{" "}
            — when a reader purchases a copy, they pay network gas on top of
            the sale price. That cost is borne by the buyer, not the author.
          </li>
        </ul>
        <p className="max-w-2xl text-sm text-white/50">
          Andromeda itself does not invoice authors for minting or publishing.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Where the money goes</h2>
        <div className="max-w-2xl space-y-4 rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
          <div>
            <p className="font-medium text-white">Primary sale (on Andromeda)</p>
            <p className="mt-2">
              The reader pays the listed price in crypto. The smart contract
              mints the NFT and sends the{" "}
              <strong className="text-white/90">full amount to the author&apos;s wallet</strong>.
              Andromeda receives nothing.
            </p>
          </div>
          <div>
            <p className="font-medium text-white">
              Secondary market (e.g. OpenSea)
            </p>
            <p className="mt-2">
              Collectors may resell copies on external marketplaces. Proceeds and
              any marketplace fees are between buyer, seller, and that
              marketplace — not Andromeda.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Author control</h2>
        <ul className="max-w-2xl list-disc space-y-2 pl-5 text-white/70">
          <li>
            <strong className="text-white/90">Edition size</strong> — the author
            decides how many copies can be minted (e.g. 100 numbered editions).
          </li>
          <li>
            <strong className="text-white/90">Certification and numbering</strong>{" "}
            — each copy is author-certified on-chain and receives a distinct
            edition number.
          </li>
          <li>
            <strong className="text-white/90">Sale or hold</strong> — the
            author can enable or disable sales, or keep copies unsold.
          </li>
          <li>
            <strong className="text-white/90">Pricing</strong> — set a fixed
            price per copy, or list copies at auction to the highest bidder
            (auction support is on the publishing roadmap).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">For readers</h2>
        <p className="max-w-2xl text-white/70">
          What you purchase is a{" "}
          <strong className="text-white/90">
            digital copy of a book certified and signed by the author
          </strong>
          . Each edition is tied to the author&apos;s public wallet address on
          the blockchain — the same idea as owning a physical book that is
          personally signed and authenticated by its writer, except in digital
          form and with a provenance anyone can verify.
        </p>
        <p className="max-w-2xl text-white/70">
          When you buy a copy, the NFT is minted straight into{" "}
          <strong className="text-white/90">your wallet</strong>. It is yours —
          not a rental, not a subscription, and not an account locked inside
          Andromeda.{" "}
          <strong className="text-white/90">
            Readers are not tied to this platform in any way.
          </strong>
        </p>
        <p className="max-w-2xl text-white/70">
          You may read the work with Andromeda or with{" "}
          <strong className="text-white/90">
            any other reading application
          </strong>{" "}
          capable of supporting this kind of technology. The token stays in your
          wallet whether or not you ever visit Andromeda again.
        </p>
      </section>

      <DonationSection />

      <section className="space-y-3 border-t border-white/10 pt-8">
        <h2 className="text-2xl font-semibold">Open to everyone</h2>
        <p className="max-w-2xl text-white/70">
          This page is public. You can learn about Andromeda without connecting
          a wallet — whether you are a reader, an author, or just browsing.
        </p>
      </section>
    </div>
  );
}
