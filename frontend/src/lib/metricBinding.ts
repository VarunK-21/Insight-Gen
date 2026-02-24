/**
 * Metric Binding Module
 * 
 * Solves the core problem: System defaults to count instead of binding actual metric columns.
 * This module ensures that when insight mentions "Amount", "Revenue", "Sales", etc.,
 * the system uses those columns with appropriate aggregation (sum/avg), not count.
 */

import { ColumnMetadata } from "./analyticalIntent";

/**
 * Metric priority keywords - columns that suggest this is a primary metric
 * Universal across domains (finance, retail, healthcare, etc.)
 */
const METRIC_KEYWORDS = [
  // Financial metrics
  'amount', 'revenue', 'sales', 'price', 'cost', 'profit', 'income', 'expense',
  'value', 'total', 'sum', 'revenue', 'earnings', 'payment', 'fee', 'charge',
  
  // Quantity metrics
  'quantity', 'qty', 'count', 'units', 'volume', 'weight', 'size', 'length',
  
  // Performance metrics
  'score', 'rating', 'performance', 'efficiency', 'rate', 'ratio', 'percentage',
  
  // Time-based metrics
  'duration', 'time', 'hours', 'minutes', 'seconds',
  
  // Scientific/technical metrics
  'measurement', 'reading', 'value', 'metric', 'data', 'signal'
];

/**
 * Aggregation keywords that suggest specific aggregation type
 */
const AGGREGATION_KEYWORDS = {
  'sum': ['total', 'sum', 'revenue', 'amount', 'sales', 'cost', 'expense', 'income'],
  'avg': ['average', 'avg', 'mean', 'typical', 'typical', 'per', 'rate'],
  'count': ['count', 'number', 'frequency', 'occurrence', 'instances']
};

/**
 * Ranks numeric columns by their likelihood of being the primary metric
 * Higher score = more likely to be the metric we want to aggregate
 */
export function rankMetricColumns(
  columnMetadata: Record<string, ColumnMetadata>,
  title?: string,
  insightText?: string
): Array<{ column: string; score: number; metadata: ColumnMetadata }> {
  const titleLower = (title || '').toLowerCase();
  const insightLower = (insightText || '').toLowerCase();
  const combinedText = `${titleLower} ${insightLower}`;
  
  const rankings: Array<{ column: string; score: number; metadata: ColumnMetadata }> = [];
  
  for (const [columnName, metadata] of Object.entries(columnMetadata)) {
    if (!metadata.is_metric_variable) {
      continue; // Skip non-metric columns
    }
    
    let score = 0;
    const colLower = columnName.toLowerCase();
    
    // 1. Keyword matching (high priority)
    for (const keyword of METRIC_KEYWORDS) {
      if (colLower.includes(keyword)) {
        score += 10;
        
        // If keyword appears in title/insight, boost significantly
        if (combinedText.includes(keyword)) {
          score += 20;
        }
      }
    }
    
    // 2. Statistical properties (medium priority)
    if (metadata.stats) {
      // Higher variance = more likely to be a meaningful metric
      if (metadata.stats.stats?.stdDev) {
        const cv = metadata.stats.stats.stdDev / (metadata.stats.stats.mean || 1);
        score += cv * 5; // Coefficient of variation
      }
      
      // Higher magnitude = more likely to be important
      if (metadata.stats.stats?.max) {
        const magnitude = Math.log10(Math.abs(metadata.stats.stats.max) + 1);
        score += magnitude * 2;
      }
    }
    
    // 3. Column name quality (low priority)
    // Prefer columns with clear metric names over generic names
    if (colLower.length > 3 && colLower.length < 20) {
      score += 1;
    }
    
    rankings.push({ column: columnName, score, metadata });
  }
  
  // Sort by score descending
  return rankings.sort((a, b) => b.score - a.score);
}

/**
 * Determines appropriate aggregation based on context
 * Returns 'sum' for amounts/revenue, 'avg' for averages, 'count' only as last resort
 */
export function inferAggregationFromContext(
  title: string,
  insightText: string,
  metricColumn: string,
  columnMetadata: Record<string, ColumnMetadata>
): 'sum' | 'avg' | 'count' | 'median' | 'min' | 'max' {
  const titleLower = title.toLowerCase();
  const insightLower = insightText.toLowerCase();
  const combinedText = `${titleLower} ${insightLower}`;
  const metricLower = metricColumn.toLowerCase();
  
  // 1. Explicit aggregation keywords in title/insight
  for (const [agg, keywords] of Object.entries(AGGREGATION_KEYWORDS)) {
    if (keywords.some(kw => combinedText.includes(kw))) {
      // Verify this aggregation is allowed for the metric
      const metadata = columnMetadata[metricColumn];
      if (metadata && metadata.aggregation_allowed.includes(agg as any)) {
        return agg as any;
      }
    }
  }
  
  // 2. Metric column name suggests aggregation
  const metadata = columnMetadata[metricColumn];
  if (metadata) {
    // If column name suggests amount/revenue/sales, prefer sum
    if (['amount', 'revenue', 'sales', 'total', 'cost', 'price', 'income', 'expense'].some(kw => metricLower.includes(kw))) {
      if (metadata.aggregation_allowed.includes('sum')) {
        return 'sum';
      }
    }
    
    // If column name suggests average/rate, prefer avg
    if (['average', 'avg', 'mean', 'rate', 'per'].some(kw => metricLower.includes(kw))) {
      if (metadata.aggregation_allowed.includes('avg')) {
        return 'avg';
      }
    }
  }
  
  // 3. Default based on metric type (NOT count as default)
  if (metadata) {
    if (metadata.type === 'continuous') {
      // For continuous metrics, prefer sum (most common for amounts)
      if (metadata.aggregation_allowed.includes('sum')) {
        return 'sum';
      }
      // Fallback to avg if sum not allowed
      if (metadata.aggregation_allowed.includes('avg')) {
        return 'avg';
      }
    }
    
    // Only use count if it's the only option or explicitly requested
    if (metadata.aggregation_allowed.includes('count') && 
        metadata.aggregation_allowed.length === 1) {
      return 'count';
    }
    
    // Use first allowed aggregation (prefer sum/avg over count)
    const preferredOrder = ['sum', 'avg', 'median', 'min', 'max', 'count'];
    for (const agg of preferredOrder) {
      if (metadata.aggregation_allowed.includes(agg as any)) {
        return agg as any;
      }
    }
  }
  
  // Last resort: count (but this should rarely happen)
  return 'count';
}

/**
 * Extracts metric column name from title/insight text
 * This is more reliable than keyword matching
 */
function extractMetricFromTitle(
  title: string,
  insightText: string,
  columnMetadata: Record<string, ColumnMetadata>
): { column: string | null; aggregation: 'sum' | 'avg' | 'count' | null } {
  const combinedText = `${title} ${insightText}`.toLowerCase();
  
  // Pattern 1: "Average X by Y" or "Avg X by Y"
  const avgPattern = /(?:average|avg|mean)\s+([a-z][a-z0-9\s-]+?)(?:\s+by|\s*$)/i;
  const avgMatch = combinedText.match(avgPattern);
  if (avgMatch) {
    const metricTerm = avgMatch[1].trim();
    // Find matching column
    for (const [colName, metadata] of Object.entries(columnMetadata)) {
      const colLower = colName.toLowerCase();
      if (colLower === metricTerm || 
          colLower.includes(metricTerm) || 
          metricTerm.includes(colLower) ||
          colLower.replace(/[^a-z0-9]/g, '') === metricTerm.replace(/[^a-z0-9]/g, '')) {
        if (metadata.is_metric_variable || metadata.type === 'continuous' || metadata.type === 'ordinal') {
          return { column: colName, aggregation: 'avg' };
        }
      }
    }
  }
  
  // Pattern 2: "Total X by Y" or "Sum of X"
  const sumPattern = /(?:total|sum)\s+(?:of\s+)?([a-z][a-z0-9\s-]+?)(?:\s+by|\s*$)/i;
  const sumMatch = combinedText.match(sumPattern);
  if (sumMatch) {
    const metricTerm = sumMatch[1].trim();
    for (const [colName, metadata] of Object.entries(columnMetadata)) {
      const colLower = colName.toLowerCase();
      if (colLower === metricTerm || 
          colLower.includes(metricTerm) || 
          metricTerm.includes(colLower) ||
          colLower.replace(/[^a-z0-9]/g, '') === metricTerm.replace(/[^a-z0-9]/g, '')) {
        if (metadata.is_metric_variable || metadata.type === 'continuous' || metadata.type === 'ordinal') {
          return { column: colName, aggregation: 'sum' };
        }
      }
    }
  }
  
  // Pattern 3: "X by Y" where X is likely the metric
  const byPattern = /([a-z][a-z0-9\s-]+?)\s+by\s+([a-z][a-z0-9\s-]+)/i;
  const byMatch = combinedText.match(byPattern);
  if (byMatch) {
    const metricTerm = byMatch[1].trim();
    // Remove aggregation words to get clean metric name
    const cleanMetric = metricTerm.replace(/\b(average|avg|mean|total|sum|count)\b/gi, '').trim();
    
    for (const [colName, metadata] of Object.entries(columnMetadata)) {
      const colLower = colName.toLowerCase();
      if (colLower === cleanMetric || 
          colLower.includes(cleanMetric) || 
          cleanMetric.includes(colLower) ||
          colLower.replace(/[^a-z0-9]/g, '') === cleanMetric.replace(/[^a-z0-9]/g, '')) {
        if (metadata.is_metric_variable || metadata.type === 'continuous' || metadata.type === 'ordinal') {
          // Infer aggregation from title
          const agg = combinedText.includes('average') || combinedText.includes('avg') || combinedText.includes('mean') ? 'avg' :
                     combinedText.includes('total') || combinedText.includes('sum') ? 'sum' : null;
          return { column: colName, aggregation: agg };
        }
      }
    }
  }
  
  return { column: null, aggregation: null };
}

/**
 * Binds metric column from intent or extracts from title
 * CRITICAL: Prioritizes explicit declarations and title extraction over guessing
 */
export function bindMetricColumn(
  intent: { metric?: { column?: string; aggregation?: string }; group_by?: string[] | null; analysis_type?: string },
  variables: string[],
  columnMetadata: Record<string, ColumnMetadata>,
  title?: string,
  insightText?: string
): { column: string; aggregation: 'sum' | 'avg' | 'count' | 'median' | 'min' | 'max' } {
  // 1. If intent already specifies metric, use it (highest priority)
  if (intent.metric?.column) {
    const metadata = columnMetadata[intent.metric.column];
    if (metadata && (metadata.is_metric_variable || metadata.type === 'continuous' || metadata.type === 'ordinal')) {
      // Use explicit aggregation if provided, otherwise infer from context
      const aggregation = intent.metric.aggregation || inferAggregationFromContext(
        title || '',
        insightText || '',
        intent.metric.column,
        columnMetadata
      );
      
      // Validate aggregation is allowed
      if (metadata.aggregation_allowed.includes(aggregation)) {
        return {
          column: intent.metric.column,
          aggregation
        };
      }
    }
  }
  
  // 2. Extract metric from title/insight (more reliable than keyword matching)
  if (title || insightText) {
    const extracted = extractMetricFromTitle(title || '', insightText || '', columnMetadata);
    if (extracted.column) {
      const metadata = columnMetadata[extracted.column];
      if (metadata) {
        const aggregation = extracted.aggregation || inferAggregationFromContext(
          title || '',
          insightText || '',
          extracted.column,
          columnMetadata
        );
        
        // Validate aggregation is allowed
        if (metadata.aggregation_allowed.includes(aggregation)) {
          return { column: extracted.column, aggregation };
        } else if (metadata.aggregation_allowed.length > 0) {
          // Use first allowed aggregation if extracted one not allowed
          return { column: extracted.column, aggregation: metadata.aggregation_allowed[0] as any };
        }
      }
    }
  }
  
  // 3. Use variables if one is numeric (but only if not explicitly distribution)
  const groupBy = Array.isArray(intent.group_by) ? intent.group_by : [];
  const isDistribution = intent.analysis_type === 'distribution';
  
  if (!isDistribution) {
    for (const varName of variables) {
      const metadata = columnMetadata[varName];
      if (metadata && (metadata.is_metric_variable || metadata.type === 'continuous' || metadata.type === 'ordinal')) {
        // Don't use grouping variable as metric
        if (!groupBy.includes(varName)) {
          const aggregation = inferAggregationFromContext(
            title || '',
            insightText || '',
            varName,
            columnMetadata
          );
          
          if (metadata.aggregation_allowed.includes(aggregation)) {
            return { column: varName, aggregation };
          } else if (metadata.aggregation_allowed.length > 0) {
            return { column: varName, aggregation: metadata.aggregation_allowed[0] as any };
          }
        }
      }
    }
  }
  
  // 4. Find best metric column from available numeric columns (keyword-based fallback)
  const rankedMetrics = rankMetricColumns(columnMetadata, title, insightText);
  
  if (rankedMetrics.length > 0 && !isDistribution) {
    const bestMetric = rankedMetrics[0];
    
    // Exclude grouping variables from being metrics
    if (!groupBy.includes(bestMetric.column)) {
      const aggregation = inferAggregationFromContext(
        title || '',
        insightText || '',
        bestMetric.column,
        columnMetadata
      );
      
      if (bestMetric.metadata.aggregation_allowed.includes(aggregation)) {
        return {
          column: bestMetric.column,
          aggregation
        };
      }
    }
  }
  
  // 5. Last resort: Use first continuous/ordinal numeric column (not categorical)
  for (const [colName, metadata] of Object.entries(columnMetadata)) {
    if ((metadata.type === 'continuous' || metadata.type === 'ordinal') && 
        metadata.is_metric_variable && 
        !groupBy.includes(colName)) {
      // Prefer sum/avg over count
      const preferredAgg = metadata.aggregation_allowed.includes('sum') ? 'sum' :
                          metadata.aggregation_allowed.includes('avg') ? 'avg' :
                          metadata.aggregation_allowed[0];
      return {
        column: colName,
        aggregation: preferredAgg as any
      };
    }
  }
  
  // 6. Only use count if:
  // - Explicitly distribution analysis
  // - OR no numeric metric available
  if (isDistribution || variables.length === 0) {
    return { column: variables[0] || 'unknown', aggregation: 'count' };
  }
  
  // 7. Absolute last resort: count (should rarely happen)
  return { column: variables[0] || 'unknown', aggregation: 'count' };
}

/**
 * Validates that metric binding is correct
 * Prevents count from hijacking actual metric columns
 */
export function validateMetricBinding(
  intent: { metric: { column: string; aggregation: string }; group_by?: string[] | null },
  columnMetadata: Record<string, ColumnMetadata>,
  title?: string
): { isValid: boolean; errors: string[]; fixedMetric?: { column: string; aggregation: string } } {
  const errors: string[] = [];
  const metadata = columnMetadata[intent.metric.column];
  const titleLower = (title || '').toLowerCase();
  
  // Check if metric column is actually a metric variable
  if (metadata && !metadata.is_metric_variable) {
    errors.push(`Column "${intent.metric.column}" is not a metric variable (it's ${metadata.type})`);
    
    // Try to find a better metric
    const rankedMetrics = rankMetricColumns(columnMetadata, title);
    if (rankedMetrics.length > 0) {
      const bestMetric = rankedMetrics[0];
      const aggregation = inferAggregationFromContext(
        title || '',
        '',
        bestMetric.column,
        columnMetadata
      );
      
      return {
        isValid: false,
        errors,
        fixedMetric: {
          column: bestMetric.column,
          aggregation
        }
      };
    }
  }
  
  // Check if aggregation is count when it should be sum/avg
  // This is the CRITICAL check that prevents count hijacking
  if (intent.metric.aggregation === 'count' && metadata && 
      (metadata.type === 'continuous' || metadata.type === 'ordinal')) {
    
    // Check if title/context suggests aggregation type
    const titleLower = (title || '').toLowerCase();
    const hasAverageKeyword = titleLower.includes('average') || titleLower.includes('avg') || titleLower.includes('mean');
    const hasTotalKeyword = titleLower.includes('total') || titleLower.includes('sum');
    const amountKeywords = ['amount', 'revenue', 'sales', 'cost', 'price', 'income', 'value'];
    const hasAmountKeyword = amountKeywords.some(kw => titleLower.includes(kw));
    
    // If title says "Average X", must use avg, not count
    if (hasAverageKeyword) {
      errors.push(
        `Title says "Average" but aggregation is "count". ` +
        `For "${intent.metric.column}", use "avg" to show average value, not count of rows.`
      );
      
      if (metadata.aggregation_allowed.includes('avg')) {
        return {
          isValid: false,
          errors,
          fixedMetric: {
            column: intent.metric.column,
            aggregation: 'avg'
          }
        };
      }
    }
    
    // If title says "Total X" or mentions amount/revenue, must use sum, not count
    if (hasTotalKeyword || hasAmountKeyword) {
      errors.push(
        `Title suggests "${intent.metric.column}" should be aggregated (sum/avg), but aggregation is "count". ` +
        `Count shows transaction frequency, not the metric value.`
      );
      
      if (metadata.aggregation_allowed.includes('sum')) {
        return {
          isValid: false,
          errors,
          fixedMetric: {
            column: intent.metric.column,
            aggregation: 'sum'
          }
        };
      } else if (metadata.aggregation_allowed.includes('avg')) {
        return {
          isValid: false,
          errors,
          fixedMetric: {
            column: intent.metric.column,
            aggregation: 'avg'
          }
        };
      }
    }
    
    // General rule: If metric is numeric and title doesn't explicitly say "count" or "distribution",
    // prefer sum/avg over count
    if (!titleLower.includes('count') && !titleLower.includes('distribution') && 
        !titleLower.includes('frequency')) {
      // Prefer sum for amounts, avg for averages, but not count
      if (metadata.aggregation_allowed.includes('sum')) {
        errors.push(
          `Numeric metric "${intent.metric.column}" is using "count" but should use "sum" or "avg" to show the metric value.`
        );
        return {
          isValid: false,
          errors,
          fixedMetric: {
            column: intent.metric.column,
            aggregation: 'sum'
          }
        };
      } else if (metadata.aggregation_allowed.includes('avg')) {
        errors.push(
          `Numeric metric "${intent.metric.column}" is using "count" but should use "avg" to show the metric value.`
        );
        return {
          isValid: false,
          errors,
          fixedMetric: {
            column: intent.metric.column,
            aggregation: 'avg'
          }
        };
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
