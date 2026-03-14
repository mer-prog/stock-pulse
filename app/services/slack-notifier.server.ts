interface SlackAlertPayload {
  productId: string;
  variantId: string;
  quantity: number;
  threshold: number;
  shop: string;
}

export async function sendSlackAlert(
  webhookUrl: string,
  payload: SlackAlertPayload,
): Promise<boolean> {
  const emoji = payload.quantity === 0 ? ":x:" : ":warning:";
  const status = payload.quantity === 0 ? "在庫切れ" : "低在庫";

  const message = {
    text: `${emoji} *${status}アラート*\n` +
      `ショップ: ${payload.shop}\n` +
      `商品ID: ${payload.productId}\n` +
      `バリアントID: ${payload.variantId}\n` +
      `現在の在庫数: *${payload.quantity}*\n` +
      `閾値: ${payload.threshold}`,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    return response.ok;
  } catch (error) {
    console.error("Slack notification failed:", error);
    return false;
  }
}
