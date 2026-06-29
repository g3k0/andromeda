import type { ReactNode } from "react";
import { AuthorFramedAvatar } from "./AuthorAvatar";

export type AuthorProfileIdentitySectionProps = {
  avatarUrl: string | null;
  avatarAlt: string;
  identity: ReactNode;
};

export function AuthorProfileIdentitySection({
  avatarUrl,
  avatarAlt,
  identity,
}: AuthorProfileIdentitySectionProps) {
  return (
    <div
      data-testid="author-profile-identity"
      className="flex w-full items-start gap-4 text-left"
    >
      <div className="shrink-0">
        <AuthorFramedAvatar avatarUrl={avatarUrl} alt={avatarAlt} />
      </div>
      <div className="min-w-0 flex-1 space-y-4">{identity}</div>
    </div>
  );
}
