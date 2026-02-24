/**
 * Universal Axis Label Derivation
 *
 * Derives canonical X and Y axis labels from analytical intent.
 * Ensures labels ALWAYS match what is actually displayed - for any dataset, any domain, any chart type.
 * This is the single source of truth for axis labels.
 */

import type { AnalyticalIntent } from "./analyticalIntent";

/** View with optional analytical intent (added during processing) */
export interface ViewWithIntent {
  title?: string;
  purpose?: string;
  chartType?: string;
  variables?: string[];
  aggregation?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  analyticalIntent?: AnalyticalIntent;
}

const AGGREGATION_LABELS: Record<string, string> = {
  avg: "Average",
  sum: "Total",
  count: "Count",
  median: "Median",
  min: "Minimum",
  max: "Maximum",
};

/**
 * Derives canonical axis labels from analytical intent.
 * Labels are ALWAYS derived from intent - never from LLM-provided text.
 *
 * Rules (universal for any dataset/domain):
 * - X-axis: The grouping dimension (categories, time, etc.)
 * - Y-axis: For aggregated charts = "{Aggregation} {MetricColumn}"; for scatter = raw column names
 */
export function deriveAxisLabels(view: ViewWithIntent): {
  xAxisLabel: string;
  yAxisLabel: string;
  aggregationLabel: string;
} {
  const intent = view.analyticalIntent;

  // Scatter / relationship charts: raw variables on both axes
  if (
    intent?.relationship_variables &&
    (view.chartType === "scatter" || intent.analysis_type === "relationship" || intent.analysis_type === "correlation")
  ) {
    const xLabel = intent.relationship_variables.independent;
    const yLabel = intent.relationship_variables.dependent;
    return {
      xAxisLabel: xLabel,
      yAxisLabel: yLabel,
      aggregationLabel: "raw",
    };
  }

  // Aggregated charts (bar, line, pie, area): group_by on X, aggregated metric on Y
  if (intent) {
    const groupBy = Array.isArray(intent.group_by) ? intent.group_by : [];
    const xAxisLabel = groupBy[0] || view.variables?.[0] || "Category";
    const metricCol = intent.metric.column;
    const agg = (intent.metric.aggregation || "count").toLowerCase();
    const aggLabel = AGGREGATION_LABELS[agg] || agg;

    // Y-axis: Must include aggregation + metric name for clarity
    let yAxisLabel: string;
    if (agg === "count") {
      yAxisLabel = "Count";
    } else {
      const metricName = intent.metric.display_name || metricCol;
      // Avoid double words: "Average Average Age" -> "Average Age"
      const metricLower = metricName.toLowerCase();
      const alreadyHasAgg =
        metricLower.startsWith("average ") ||
        metricLower.startsWith("total ") ||
        metricLower.startsWith("median ") ||
        metricLower.startsWith("count ");
      yAxisLabel = alreadyHasAgg ? metricName : `${aggLabel} ${metricName}`;
    }

    return {
      xAxisLabel,
      yAxisLabel,
      aggregationLabel: agg,
    };
  }

  // Fallback for legacy views without intent
  const xLabel = view.xAxisLabel || view.variables?.[0] || "Category";
  const yLabel = view.yAxisLabel || view.variables?.[1] || "Value";
  const agg = (view.aggregation || "count").toLowerCase();
  if (agg === "count") {
    return { xAxisLabel: xLabel, yAxisLabel: "Count", aggregationLabel: agg };
  }
  const aggLabel = AGGREGATION_LABELS[agg] || agg;
  return {
    xAxisLabel: xLabel,
    yAxisLabel: yLabel.toLowerCase().startsWith(aggLabel.toLowerCase()) ? yLabel : `${aggLabel} ${yLabel}`,
    aggregationLabel: agg,
  };
}

/**
 * Validates that axis labels match the actual data structure.
 * Returns errors if labels would mislead the user.
 */
export function validateAxisLabelAccuracy(
  view: ViewWithIntent,
  headers: string[]
): { isValid: boolean; errors: string[]; fixedLabels?: { xAxisLabel: string; yAxisLabel: string } } {
  const errors: string[] = [];
  const derived = deriveAxisLabels(view);

  // X-axis: must be a valid column or grouping dimension
  const headerSet = new Set(headers.map((h) => h.toLowerCase()));
  const xVar = derived.xAxisLabel;
  const xExists =
    headerSet.has(xVar.toLowerCase()) ||
    headers.some((h) => h.toLowerCase().includes(xVar.toLowerCase()) || xVar.toLowerCase().includes(h.toLowerCase()));

  if (!xExists && view.analyticalIntent?.group_by?.length) {
    const groupBy = view.analyticalIntent.group_by[0];
    if (headerSet.has(groupBy.toLowerCase())) {
      errors.push(`X-axis label "${xVar}" not found; using "${groupBy}" from intent`);
    }
  }

  // Y-axis for aggregated: metric column must exist
  if (view.analyticalIntent && view.chartType !== "scatter") {
    const metricCol = view.analyticalIntent.metric.column;
    const metricExists =
      headerSet.has(metricCol.toLowerCase()) ||
      headers.some(
        (h) => h.toLowerCase().includes(metricCol.toLowerCase()) || metricCol.toLowerCase().includes(h.toLowerCase())
      );
    if (!metricExists) {
      errors.push(`Y-axis metric column "${metricCol}" not found in dataset`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    fixedLabels: derived,
  };
}
