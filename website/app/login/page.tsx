import LoginForm from "./LoginForm";

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string; registered?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialCallbackUrl =
    typeof params?.callbackUrl === "string" && params.callbackUrl
      ? params.callbackUrl
      : "/app/dashboard";
  const initialRegistered = params?.registered === "1";
  return (
    <LoginForm
      initialCallbackUrl={initialCallbackUrl}
      initialRegistered={initialRegistered}
    />
  );
}
