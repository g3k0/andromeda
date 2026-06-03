import Link from "next/link";

export type AuthorPageStatusMessageProps = {
  title: string;
  description: string;
};

export function AuthorPageStatusMessage({
  title,
  description,
}: AuthorPageStatusMessageProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-white/60">{description}</p>
      <Link
        href="/"
        className="mt-4 inline-block text-sm text-andromeda-light hover:text-white"
      >
        Back to Library
      </Link>
    </div>
  );
}

export function AuthorPageInvalidAddress() {
  return (
    <AuthorPageStatusMessage
      title="Invalid wallet address"
      description="The URL does not contain a valid Ethereum address."
    />
  );
}

export function AuthorPageNotFound({ address }: { address: string }) {
  return (
    <div className="space-y-4">
      <AuthorPageStatusMessage
        title="Author page not found"
        description="No author profile exists for this wallet address yet."
      />
      <p className="break-all text-center font-mono text-xs text-white/40">
        {address}
      </p>
    </div>
  );
}
