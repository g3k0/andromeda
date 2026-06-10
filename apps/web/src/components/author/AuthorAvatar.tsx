import Image from "next/image";
import { DEFAULT_AUTHOR_AVATAR_SIZE } from "./constants";
import { resolveAuthorAvatarSrc } from "./avatar-src";

export type AuthorAvatarProps = {
  avatarUrl: string | null;
  alt?: string;
  className?: string;
  size?: number;
};

function shouldLoadAvatarUnoptimized(src: string): boolean {
  return (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("https://ipfs.io/")
  );
}

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
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      unoptimized={shouldLoadAvatarUnoptimized(src)}
      className={classes}
    />
  );
}
