import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { resolveSiteBaseUrl } from "@/lib/i18n/seo";

export const metadata: Metadata = {
  metadataBase: new URL(resolveSiteBaseUrl()),
  title: "Andromeda",
  description:
    "A blockchain platform that empowers writers to share and sell their work as author-certified NFT copies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
