import { RequireRole } from "@/components/ui";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <RequireRole role="admin">{children}</RequireRole>;
}
