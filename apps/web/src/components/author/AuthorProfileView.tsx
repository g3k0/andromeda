import type { AuthorProfile } from "@/lib/authors/types";
import { AuthorAvatar } from "./AuthorAvatar";

export type AuthorProfileViewProps = {
  profile: AuthorProfile;
};

export function AuthorProfileView({ profile }: AuthorProfileViewProps) {
  return (
    <article className="flex max-w-lg flex-col items-center gap-4 text-center sm:items-start sm:text-left">
      <AuthorAvatar avatarUrl={profile.avatarUrl} alt={profile.displayName} />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {profile.displayName}
        </h1>
        <p className="break-all font-mono text-sm text-white/60">
          {profile.address}
        </p>
      </div>
    </article>
  );
}
