import { Button } from "@shopify/polaris";
import { useTranslation, type Locale } from "../i18n/i18nContext";

export function LanguageToggle() {
  const { locale, setLocale, t } = useTranslation();

  const handleToggle = () => {
    const next: Locale = locale === "ja" ? "en" : "ja";
    setLocale(next);
  };

  return (
    <Button onClick={handleToggle} variant="plain">
      {t("language.toggle")}
    </Button>
  );
}
