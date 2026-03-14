import db from "../db.server";
import { sendSlackAlert } from "./slack-notifier.server";

interface InventoryUpdate {
  shop: string;
  productId: string;
  variantId: string;
  quantity: number;
}

export async function checkAndAlert(update: InventoryUpdate): Promise<void> {
  const productConfig = await db.alertConfig.findFirst({
    where: { shop: update.shop, productId: update.productId, isActive: true },
  });

  const defaultConfig = await db.alertConfig.findFirst({
    where: { shop: update.shop, productId: null, isActive: true },
  });

  const config = productConfig ?? defaultConfig;
  if (!config) return;

  const threshold = config.threshold;
  const shouldAlert =
    (update.quantity <= threshold) ||
    (config.alertOnZero && update.quantity === 0);

  if (!shouldAlert) return;

  const recentAlert = await db.alertLog.findFirst({
    where: {
      shop: update.shop,
      productId: update.productId,
      variantId: update.variantId,
      sentAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });

  if (recentAlert) return;

  const webhookUrl = config.slackWebhookUrl ?? defaultConfig?.slackWebhookUrl;
  if (!webhookUrl) return;

  const sent = await sendSlackAlert(webhookUrl, {
    productId: update.productId,
    variantId: update.variantId,
    quantity: update.quantity,
    threshold,
    shop: update.shop,
  });

  if (sent) {
    await db.alertLog.create({
      data: {
        shop: update.shop,
        productId: update.productId,
        variantId: update.variantId,
        quantity: update.quantity,
        threshold,
      },
    });
  }
}
