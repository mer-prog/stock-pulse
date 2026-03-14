import { Layout, LegacyCard, Text, InlineGrid, Box, BlockStack } from "@shopify/polaris";
import { useTranslation } from "../i18n/i18nContext";

interface SummaryData {
  totalProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  totalQuantity: number;
}

function SummaryCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone?: "critical" | "caution" | "success";
}) {
  return (
    <LegacyCard sectioned>
      <BlockStack gap="200">
        <Text as="p" variant="bodyMd" tone="subdued">
          {title}
        </Text>
        <Text
          as="p"
          variant="headingXl"
          fontWeight="bold"
          tone={tone}
        >
          {value.toLocaleString()}
        </Text>
      </BlockStack>
    </LegacyCard>
  );
}

export function InventoryDashboard({ summary }: { summary: SummaryData }) {
  const { t } = useTranslation();

  return (
    <Layout.Section>
      <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
        <Box>
          <SummaryCard title={t("inventory.totalProducts")} value={summary.totalProducts} />
        </Box>
        <Box>
          <SummaryCard
            title={t("inventory.outOfStock")}
            value={summary.outOfStockCount}
            tone="critical"
          />
        </Box>
        <Box>
          <SummaryCard
            title={t("inventory.lowStock")}
            value={summary.lowStockCount}
            tone="caution"
          />
        </Box>
        <Box>
          <SummaryCard title={t("inventory.totalQuantity")} value={summary.totalQuantity} />
        </Box>
      </InlineGrid>
    </Layout.Section>
  );
}
