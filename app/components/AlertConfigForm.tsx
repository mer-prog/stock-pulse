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
          {productId ? `商品別アラート設定` : "デフォルトアラート設定（全商品共通）"}
        </Text>
        {fetcher.data?.success && (
          <Banner tone="success">設定を保存しました。</Banner>
        )}
        <fetcher.Form method="post">
          <input type="hidden" name="productId" value={productId ?? ""} />
          <FormLayout>
            <TextField
              label="在庫閾値"
              type="number"
              value={threshold}
              onChange={setThreshold}
              name="threshold"
              helpText="在庫がこの数以下になるとアラートを送信します"
              autoComplete="off"
            />
            <Checkbox
              label="在庫切れ時にもアラート"
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
              label="Slack Webhook URL"
              value={slackWebhookUrl}
              onChange={setSlackWebhookUrl}
              name="slackWebhookUrl"
              placeholder="https://hooks.slack.com/services/..."
              autoComplete="off"
            />
            <Checkbox
              label="アラートを有効にする"
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
              保存
            </Button>
          </FormLayout>
        </fetcher.Form>
      </BlockStack>
    </LegacyCard>
  );
}
