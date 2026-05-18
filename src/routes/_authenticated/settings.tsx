import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useT } from "@/i18n/I18nProvider";
import { LANGUAGES, type Lang } from "@/i18n/translations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { t, lang, setLang } = useT();
  return (
    <div className="px-6 md:px-12 py-10 max-w-3xl mx-auto">
      <PageHeader eyebrow={t("settings.eyebrow")} title={t("settings.title")} />
      <dl className="divide-y divide-border border-y border-border">
        <div className="flex justify-between py-4">
          <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t("settings.email")}</dt>
          <dd className="text-sm text-foreground">{user?.email}</dd>
        </div>
        <div className="flex justify-between py-4">
          <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t("settings.userId")}</dt>
          <dd className="text-xs font-mono text-muted-foreground">{user?.id}</dd>
        </div>
        <div className="flex items-center justify-between py-4 gap-4">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t("settings.language")}</dt>
            <p className="text-xs text-muted-foreground mt-1">{t("settings.languageHint")}</p>
          </div>
          <dd>
            <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </dd>
        </div>
      </dl>
    </div>
  );
}
