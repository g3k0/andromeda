"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { useLocalizedHref } from "./use-localized-href";

type LocalizedLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

/** Wraps next/link and prepends the active locale segment to internal paths. */
export function LocalizedLink({ href, ...props }: LocalizedLinkProps) {
  const localizedHref = useLocalizedHref();

  return <Link href={localizedHref(href)} {...props} />;
}
