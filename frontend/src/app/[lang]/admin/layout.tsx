import { RequireRole } from "@/components/ui";

export default function AdminLayout({ children }: LayoutProps<"/[lang]/admin">) {
  return <RequireRole role="admin">{children}</RequireRole>;
}
