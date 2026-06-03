import { DEFAULT_AUTHOR_AVATAR_SIZE } from "./constants";
import { resolveAuthorAvatarSrc } from "./avatar-src";

export type AuthorAvatarProps = {
  avatarUrl: string | null;
  alt?: string;
  className?: string;
  size?: number;
};

export function AuthorAvatar({
  avatarUrl,
  alt = "Author profile",
  className,
  size = DEFAULT_AUTHOR_AVATAR_SIZE,
}: AuthorAvatarProps) {
  const src = resolveAuthorAvatarSrc(avatarUrl);
  const classes = ["rounded-full object-cover bg-white/10", className]
    .filter(Boolean)
    .join(" ");

  return (
    // eslint-disable-next-line @next/next/no-img-element -- placeholder and IPFS URLs vary; img keeps the component simple.
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={classes}
    />
  );
}
