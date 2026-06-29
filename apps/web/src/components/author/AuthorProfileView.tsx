import type { AuthorProfile } from "@/lib/authors/types";
import Link from "next/link";
import { AuthorAvatar } from "./AuthorAvatar";

export type AuthorProfileViewProps = {
  profile: AuthorProfile;
  showEditButton?: boolean;
  onEditClick?: () => void;
  showPublishWorkLink?: boolean;
};

export function AuthorProfileView({
  profile,
  showEditButton = false,
  onEditClick,
  showPublishWorkLink = false,
}: AuthorProfileViewProps) {
  return (
    <article className="flex max-w-lg flex-col items-center gap-4 text-center sm:items-start sm:text-left">
      <AuthorAvatar avatarUrl={profile.avatarUrl} alt={profile.displayName} />
      <div className="w-full space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {profile.displayName}
        </h1>
        <div className="space-y-1 text-left">
          <span className="text-sm text-white/60">Public address</span>
          <p className="break-all font-mono text-sm text-white/60">
            {profile.address}
          </p>
        </div>
        {showEditButton ? (
          <button
            type="button"
            onClick={onEditClick}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
          >
            Edit
          </button>
        ) : null}
      </div>
      {showPublishWorkLink ? (
        <div className="flex w-full justify-center pt-2">
          <Link
            href={`/author/${profile.address}/publish`}
            className="inline-flex items-center justify-center rounded-lg bg-andromeda px-6 py-3 text-base font-semibold text-white shadow-lg shadow-andromeda/25 transition-colors hover:bg-andromeda-dark"
          >
            Publish work
          </Link>
        </div>
      ) : null}
    </article>
  );
}
