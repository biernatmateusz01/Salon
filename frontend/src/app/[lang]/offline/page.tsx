import { WifiOff } from "lucide-react";
import { notFound } from "next/navigation";
import { dictionaries, hasLocale } from "@/i18n";
import { pageTitle } from "@/i18n/metadata";

export const generateMetadata = pageTitle("offline");

export default async function OfflinePage({ params }: PageProps<"/[lang]/offline">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = dictionaries[lang].offline;
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 pt-16 text-center">
      <WifiOff className="size-10 text-muted" />
      <h1 className="font-display text-2xl font-semibold">{t.title}</h1>
      <p className="text-muted">{t.text}</p>
    </div>
  );
}
