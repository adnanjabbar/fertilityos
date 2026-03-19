import ResetPasswordClient from "./reset-password-client";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = typeof params?.token === "string" ? params.token : "";
  return <ResetPasswordClient token={token} />;
}

