import { pageTitle } from "@/i18n/metadata";
import { AuthForm } from "@/components/AuthForm";

export const generateMetadata = pageTitle("login");

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
