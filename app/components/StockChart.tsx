import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { LegacyCard, Text, BlockStack, SkeletonBodyText } from "@shopify/polaris";
import { useTranslation } from "../i18n/i18nContext";

interface ChartData {
  date: string;
  quantity: number;
}

export function StockChart({
  data,
  title,
}: {
  data: ChartData[];
  title?: string;
}) {
  const { t } = useTranslation();
  const displayTitle = title ?? t("stockChart.defaultTitle");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <LegacyCard sectioned>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          {displayTitle}
        </Text>
        {data.length === 0 ? (
          <Text as="p" tone="subdued">
            {t("stockChart.noData")}
          </Text>
        ) : !isClient ? (
          <div style={{ width: "100%", height: 300 }}>
            <SkeletonBodyText lines={8} />
          </div>
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: string) => {
                    const parts = value.split("-");
                    return `${parts[1]}/${parts[2]}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [
                    Number(value).toLocaleString(),
                    t("stockChart.tooltipLabel"),
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="quantity"
                  stroke="#2c6ecb"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </BlockStack>
    </LegacyCard>
  );
}
