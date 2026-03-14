import { Link } from "@remix-run/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { useTranslation } from "../i18n/i18nContext";

export function AppNavMenu() {
  const { t } = useTranslation();

  return (
    <NavMenu>
      <Link to="/app" rel="home">
        {t("nav.dashboard")}
      </Link>
      <Link to="/app/alerts">{t("nav.alerts")}</Link>
    </NavMenu>
  );
}
