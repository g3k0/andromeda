import Link from "next/link";
import { SiteHeaderNav } from "./navigation/SiteHeaderNav";
import { WalletButton } from "./WalletButton";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Andromeda
      </Link>
      <nav className="flex items-center gap-6 text-sm">
        <SiteHeaderNav />
        <WalletButton />
      </nav>
    </header>
  );
}
