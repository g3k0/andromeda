import { AuthorPublicPage } from "@/components/author/AuthorPublicPage";

type AuthorAddressPageProps = {
  params: Promise<{ address: string }>;
};

export default async function AuthorAddressPage({
  params,
}: AuthorAddressPageProps) {
  const { address } = await params;

  return (
    <div className="space-y-6">
      <AuthorPublicPage addressParam={address} />
    </div>
  );
}
