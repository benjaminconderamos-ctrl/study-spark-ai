import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/I18nProvider";
import { Languages } from "lucide-react";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useT();
  const next = lang === "en" ? "es-MX" : "en";
  const label = lang === "en" ? "ES" : "EN";
  const title = lang === "en" ? "Cambiar a español (México)" : "Switch to English";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(next)}
      title={title}
      aria-label={title}
      className={className}
    >
      <Languages className="h-4 w-4 mr-1" strokeWidth={1.5} />
      {label}
    </Button>
  );
}
