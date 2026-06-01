import Link from "next/link";
import { WalletButton } from "./WalletButton";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Andromeda
      </Link>
      <nav className="flex items-center gap-6 text-sm">
        <Link href="/" className="text-white/70 hover:text-white">
          Library
        </Link>
        <Link href="/admin" className="text-white/70 hover:text-white">
          Admin
        </Link>
        <WalletButton />
      </nav>
    </header>
  );
}
