import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, BlockStack } from "@shopify/polaris";

import { authenticate } from "../shopify.server";
import db from "../db.server";
import { AlertConfigForm } from "../components/AlertConfigForm";
import { useTranslation } from "../i18n/i18nContext";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const defaultConfig = await db.alertConfig.findFirst({
    where: { shop, productId: null },
  });

  const productConfigs = await db.alertConfig.findMany({
    where: { shop, productId: { not: null } },
    orderBy: { productId: "asc" },
  });

  return json({
    defaultConfig: defaultConfig
      ? {
          id: defaultConfig.id,
          threshold: defaultConfig.threshold,
          alertOnZero: defaultConfig.alertOnZero,
          slackWebhookUrl: defaultConfig.slackWebhookUrl ?? "",
          isActive: defaultConfig.isActive,
        }
      : {
          threshold: 10,
          alertOnZero: true,
          slackWebhookUrl: "",
          isActive: true,
        },
    productConfigs: productConfigs.map((c) => ({
      id: c.id,
      productId: c.productId!,
      threshold: c.threshold,
      alertOnZero: c.alertOnZero,
      slackWebhookUrl: c.slackWebhookUrl ?? "",
      isActive: c.isActive,
    })),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();

  const rawProductId = formData.get("productId") as string;
  const productId = rawProductId || null;
  const threshold = parseInt(formData.get("threshold") as string, 10) || 10;
  const alertOnZero = formData.get("alertOnZero") === "true";
  const slackWebhookUrl = (formData.get("slackWebhookUrl") as string) || null;
  const isActive = formData.get("isActive") === "true";

  const data = { threshold, alertOnZero, slackWebhookUrl, isActive };

  const existing = await db.alertConfig.findFirst({
    where: { shop, productId },
  });

  if (existing) {
    await db.alertConfig.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await db.alertConfig.create({
      data: { shop, productId, ...data },
    });
  }

  return json({ success: true });
};

export default function Alerts() {
  const { defaultConfig, productConfigs } = useLoaderData<typeof loader>();
  const { t } = useTranslation();

  return (
    <Page title={t("alerts.pageTitle")} backAction={{ url: "/app" }}>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <AlertConfigForm config={defaultConfig} />
          </Layout.Section>
        </Layout>

        {productConfigs.map((config) => (
          <Layout key={config.id}>
            <Layout.Section>
              <AlertConfigForm
                config={config}
                productId={config.productId}
              />
            </Layout.Section>
          </Layout>
        ))}
      </BlockStack>
    </Page>
  );
}
