import type { UserRole } from "@/lib/auth/roles";

export type HeaderNavLink = {
  href: string;
  label: string;
};

export type HeaderNavInput = {
  role: UserRole;
  hasAuthorProfile: boolean;
};

export const LIBRARY_NAV_LINK: HeaderNavLink = {
  href: "/",
  label: "Library",
};

export const ADMIN_NAV_LINK: HeaderNavLink = {
  href: "/admin",
  label: "Admin",
};

export const MY_AUTHOR_PAGE_NAV_LINK: HeaderNavLink = {
  href: "/author",
  label: "La mia pagina",
};

export function shouldShowMyAuthorPageLink(input: HeaderNavInput): boolean {
  if (input.role === "author") {
    return true;
  }
  return input.role === "admin" && input.hasAuthorProfile;
}

export function buildHeaderNavLinks(input: HeaderNavInput): HeaderNavLink[] {
  const links: HeaderNavLink[] = [LIBRARY_NAV_LINK];

  if (input.role === "admin") {
    links.push(ADMIN_NAV_LINK);
  }

  if (shouldShowMyAuthorPageLink(input)) {
    links.push(MY_AUTHOR_PAGE_NAV_LINK);
  }

  return links;
}
