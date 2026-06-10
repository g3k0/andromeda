import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthorIndexPage } from "@/components/author/AuthorIndexPage";
import { resolveAuthorIndexServerRedirect } from "@/lib/authors/author-index-server";

export const metadata: Metadata = {
  title: "Author page",
  description:
    "Open or create your Andromeda author page to publish and sell author-certified literary works.",
};

export default async function AuthorIndexRoute() {
  const redirectPath = await resolveAuthorIndexServerRedirect();
  if (redirectPath) {
    redirect(redirectPath);
  }

  return <AuthorIndexPage />;
}
