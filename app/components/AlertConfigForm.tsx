import { useState } from "react";
import {
  FormLayout,
  TextField,
  Checkbox,
  Button,
  LegacyCard,
  Text,
  BlockStack,
  Banner,
} from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";
import { useTranslation } from "../i18n/i18nContext";

interface AlertConfigData {
  id?: string;
  threshold: number;
  alertOnZero: boolean;
  slackWebhookUrl: string;
  isActive: boolean;
}

export function AlertConfigForm({
  config,
  productId,
}: {
  config: AlertConfigData;
  productId?: string;
}) {
  const fetcher = useFetcher<{ success: boolean }>();
  const { t } = useTranslation();
  const [threshold, setThreshold] = useState(String(config.threshold));
  const [alertOnZero, setAlertOnZero] = useState(config.alertOnZero);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(
    config.slackWebhookUrl,
  );
  const [isActive, setIsActive] = useState(config.isActive);

  const isSubmitting = fetcher.state !== "idle";

  return (
    <LegacyCard sectioned>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          {productId
            ? t("alerts.productConfigTitle")
            : t("alerts.defaultConfigTitle")}
        </Text>
        {fetcher.data?.success && (
          <Banner tone="success">{t("alerts.saveSuccess")}</Banner>
        )}
        <fetcher.Form method="post">
          <input type="hidden" name="productId" value={productId ?? ""} />
          <FormLayout>
            <TextField
              label={t("alerts.thresholdLabel")}
              type="number"
              value={threshold}
              onChange={setThreshold}
              name="threshold"
              helpText={t("alerts.thresholdHelpText")}
              autoComplete="off"
            />
            <Checkbox
              label={t("alerts.alertOnZero")}
              checked={alertOnZero}
              onChange={setAlertOnZero}
              name="alertOnZero"
            />
            <input
              type="hidden"
              name="alertOnZero"
              value={alertOnZero ? "true" : "false"}
            />
            <TextField
              label={t("alerts.slackWebhookLabel")}
              value={slackWebhookUrl}
              onChange={setSlackWebhookUrl}
              name="slackWebhookUrl"
              placeholder="https://hooks.slack.com/services/..."
              autoComplete="off"
            />
            <Checkbox
              label={t("alerts.enableAlert")}
              checked={isActive}
              onChange={setIsActive}
              name="isActive"
            />
            <input
              type="hidden"
              name="isActive"
              value={isActive ? "true" : "false"}
            />
            <Button submit variant="primary" loading={isSubmitting}>
              {t("alerts.save")}
            </Button>
          </FormLayout>
        </fetcher.Form>
      </BlockStack>
    </LegacyCard>
  );
}
