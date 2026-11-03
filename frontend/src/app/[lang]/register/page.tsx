import { pageTitle } from "@/i18n/metadata";
import { AuthForm } from "@/components/AuthForm";

export const generateMetadata = pageTitle("register");

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
