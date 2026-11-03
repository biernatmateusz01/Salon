import { RequireRole } from "@/components/ui";

export default function MyLayout({ children }: LayoutProps<"/[lang]/my">) {
  return <RequireRole role="client">{children}</RequireRole>;
}
