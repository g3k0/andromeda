import { LocalizedLink } from "@/lib/i18n/LocalizedLink";
import { SiteHeaderNav } from "./navigation/SiteHeaderNav";
import { WalletButton } from "./WalletButton";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
      <LocalizedLink href="/" className="text-lg font-semibold tracking-tight">
        Andromeda
      </LocalizedLink>
      <nav className="flex items-center gap-6 text-sm">
        <SiteHeaderNav />
        <WalletButton />
      </nav>
    </header>
  );
}
