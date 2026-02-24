/**
 * Analytical Intent Layer
 * 
 * This module provides structured intent objects that link insights to visualizations.
 * Prevents semantic drift by enforcing analytical correctness, not just structural validation.
 */

import { ColumnStats } from "./dataCleaning";
import { bindMetricColumn, validateMetricBinding, inferAggregationFromContext } from "./metricBinding";

/**
 * Structured Intent Object - The contract between insight and visualization
 */
export interface AnalyticalIntent {
  // Natural language insight (for display)
  insight_text: string;
  
  // Analytical structure (for validation and chart generation)
  analysis_type: 'comparison' | 'distribution' | 'relationship' | 'trend' | 'correlation';
  
  // Metric variable (what we're measuring)
  metric: {
    column: string;
    aggregation: 'avg' | 'sum' | 'count' | 'median' | 'min' | 'max';
    display_name?: string;
  };
  
  // Grouping variable(s) (what we're comparing across)
  // Always ensure this is an array, even if empty
  group_by?: string[] | null;
  
  // Relationship variables (for relationship/correlation charts)
  relationship_variables?: {
    independent: string;  // X-axis
    dependent: string;    // Y-axis
  };
  
  // Chart configuration
  chart_type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'table';
  
  // Filters (if any)
  filters?: Array<{ column: string; operator: string; value: any }>;
  
  // Expected output description
  expected_output: string;
}

/**
 * Column metadata with explicit types (not inferred)
 */
export interface ColumnMetadata {
  name: string;
  type: 'continuous' | 'ordinal' | 'categorical' | 'text' | 'boolean' | 'date';
  aggregation_allowed: ('avg' | 'sum' | 'count' | 'median' | 'min' | 'max')[];
  is_grouping_variable: boolean;  // Can be used for grouping
  is_metric_variable: boolean;     // Can be used as metric
  stats?: ColumnStats;
}

/**
 * Validates analytical intent for correctness
 */
export function validateAnalyticalIntent(
  intent: AnalyticalIntent,
  columnMetadata: Record<string, ColumnMetadata>,
  headers: string[]
): { isValid: boolean; errors: string[]; fixedIntent?: AnalyticalIntent } {
  const errors: string[] = [];
  let fixedIntent: AnalyticalIntent | undefined = intent;

  // 1. Validate metric column exists and is valid
  const metricCol = columnMetadata[intent.metric.column] || 
    Object.values(columnMetadata).find(m => 
      m.name.toLowerCase() === intent.metric.column.toLowerCase()
    );
  
  if (!metricCol) {
    errors.push(`Metric column "${intent.metric.column}" not found in dataset`);
    return { isValid: false, errors };
  }

  // 1b. CRITICAL: Prevent using year columns as metrics with sum/avg
  // Years cannot be summed or averaged - they're time dimensions, not measurements
  const isYearColumn = metricCol.stats?.type === 'year' || 
    metricCol.name.toLowerCase().includes('year') ||
    (metricCol.type === 'date' && metricCol.stats?.stats && 
     metricCol.stats.stats.min >= 1900 && metricCol.stats.stats.max <= 2100);
  
  if (isYearColumn && (intent.metric.aggregation === 'sum' || intent.metric.aggregation === 'avg')) {
    errors.push(
      `Cannot use sum/avg aggregation on year column "${intent.metric.column}". ` +
      `Years are time dimensions, not measurements. Use count, min, or max instead.`
    );
    // Auto-fix: Change to count (most common for year analysis)
    fixedIntent = {
      ...intent,
      metric: {
        ...intent.metric,
        aggregation: 'count'
      }
    };
  }

  // 1c. Prevent using year columns as metrics at all (they should be grouping variables)
  if (isYearColumn && !metricCol.is_metric_variable) {
    errors.push(
      `Column "${intent.metric.column}" is a year/time dimension and cannot be used as a metric. ` +
      `Use it as a grouping variable instead.`
    );
  }

  // 2. Validate aggregation is allowed for metric type
  if (!metricCol.aggregation_allowed.includes(intent.metric.aggregation)) {
    errors.push(
      `Aggregation "${intent.metric.aggregation}" not allowed for ${metricCol.type} column "${intent.metric.column}". ` +
      `Allowed: ${metricCol.aggregation_allowed.join(', ')}`
    );
    
    // Auto-fix: Use context-aware aggregation, not just first allowed
    const contextAggregation = inferAggregationFromContext(
      intent.expected_output || '',
      intent.insight_text || '',
      intent.metric.column,
      columnMetadata
    );
    
    if (metricCol.aggregation_allowed.includes(contextAggregation)) {
      fixedIntent = {
        ...intent,
        metric: {
          ...intent.metric,
          aggregation: contextAggregation
        }
      };
    } else if (metricCol.aggregation_allowed.length > 0) {
      // Fallback to first allowed if context aggregation not available
      fixedIntent = {
        ...intent,
        metric: {
          ...intent.metric,
          aggregation: metricCol.aggregation_allowed[0] as any
        }
      };
    }
  }
  
  // 2b. Validate metric binding (prevent count hijacking)
  const metricBindingValidation = validateMetricBinding(intent, columnMetadata, intent.expected_output);
  if (!metricBindingValidation.isValid && metricBindingValidation.fixedMetric) {
    errors.push(...metricBindingValidation.errors);
    fixedIntent = {
      ...intent,
      metric: {
        ...intent.metric,
        column: metricBindingValidation.fixedMetric.column,
        aggregation: metricBindingValidation.fixedMetric.aggregation as any
      }
    };
  }

  // 3. Validate grouping variables exist and are grouping-capable
  // Ensure group_by is an array
  const groupBy = Array.isArray(intent.group_by) ? intent.group_by : [];
  
  for (const groupVar of groupBy) {
    if (!groupVar || typeof groupVar !== 'string') {
      continue; // Skip invalid entries
    }
    
    const groupCol = columnMetadata[groupVar] || 
      Object.values(columnMetadata).find(m => 
        m.name.toLowerCase() === groupVar.toLowerCase()
      );
    
    if (!groupCol) {
      errors.push(`Grouping variable "${groupVar}" not found in dataset`);
      continue;
    }
    
    if (!groupCol.is_grouping_variable) {
      errors.push(`Column "${groupVar}" cannot be used for grouping (not categorical/ordinal)`);
    }
  }

  // 4. Validate relationship charts have both variables
  if (intent.analysis_type === 'relationship' || intent.analysis_type === 'correlation') {
    if (!intent.relationship_variables) {
      errors.push(`Relationship analysis requires relationship_variables with independent and dependent`);
    } else {
      const indVar = columnMetadata[intent.relationship_variables.independent] ||
        Object.values(columnMetadata).find(m => 
          m.name.toLowerCase() === intent.relationship_variables!.independent.toLowerCase()
        );
      const depVar = columnMetadata[intent.relationship_variables.dependent] ||
        Object.values(columnMetadata).find(m => 
          m.name.toLowerCase() === intent.relationship_variables!.dependent.toLowerCase()
        );
      
      if (!indVar) {
        errors.push(`Independent variable "${intent.relationship_variables.independent}" not found`);
      }
      if (!depVar) {
        errors.push(`Dependent variable "${intent.relationship_variables.dependent}" not found`);
      }
      
      // Relationship charts must show raw variables, not derived stats
      if (intent.metric.aggregation === 'count' && intent.analysis_type === 'relationship') {
        errors.push(`Relationship charts must show raw variable relationships, not counts`);
      }
    }
  }

  // 5. Validate chart type matches analysis type
  const chartTypeCompatibility: Record<string, string[]> = {
    'comparison': ['bar', 'line', 'table'],
    'distribution': ['pie', 'bar', 'histogram'],
    'relationship': ['scatter', 'bar', 'line'],
    'correlation': ['scatter', 'line'],
    'trend': ['line', 'area', 'bar']
  };
  
  const allowedTypes = chartTypeCompatibility[intent.analysis_type] || [];
  if (allowedTypes.length > 0 && !allowedTypes.includes(intent.chart_type)) {
    errors.push(
      `Chart type "${intent.chart_type}" not compatible with analysis type "${intent.analysis_type}". ` +
      `Suggested: ${allowedTypes.join(', ')}`
    );
    
    if (allowedTypes.length > 0) {
      fixedIntent = {
        ...intent,
        chart_type: allowedTypes[0] as any
      };
    }
  }

  // 6. Validate pie charts are for distribution only
  if (intent.chart_type === 'pie' && intent.analysis_type !== 'distribution') {
    errors.push(`Pie charts can only show distributions, not ${intent.analysis_type}`);
    fixedIntent = {
      ...intent,
      chart_type: 'bar',
      analysis_type: 'distribution'
    };
  }

  // 7. Validate scatter plots show relationships
  if (intent.chart_type === 'scatter' && !intent.relationship_variables) {
    errors.push(`Scatter plots require relationship_variables (independent and dependent)`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    fixedIntent: errors.length > 0 ? fixedIntent : undefined
  };
}

/**
 * Generates title from structured intent (prevents drift)
 * Prevents double words like "Total Total" or "Average Average"
 */
export function generateTitleFromIntent(intent: AnalyticalIntent): string {
  // If aggregation changed, regenerate title to match
  const aggregationLabel: Record<string, string> = {
    'avg': 'Average',
    'sum': 'Total',
    'count': 'Count',
    'median': 'Median',
    'min': 'Minimum',
    'max': 'Maximum'
  };
  
  const aggLabel = aggregationLabel[intent.metric.aggregation] || intent.metric.aggregation;
  let metricName = intent.metric.display_name || intent.metric.column;
  
  // Prevent double words: if metric name already contains aggregation word, don't repeat
  const metricLower = metricName.toLowerCase();
  const aggLower = aggLabel.toLowerCase();
  
  // Remove aggregation word from metric name if it's already there
  if (metricLower.includes(aggLower)) {
    // Metric name already has aggregation word, don't duplicate
    // e.g., "Total Sales" -> "Total Sales" not "Total Total Sales"
    metricName = metricName.replace(new RegExp(`\\b${aggLower}\\b`, 'gi'), '').trim();
  }
  
  // Also check for common duplicates
  if (metricLower.startsWith(aggLower + ' ') || metricLower.includes(' ' + aggLower + ' ')) {
    metricName = metricName.replace(new RegExp(`\\b${aggLower}\\b`, 'gi'), '').trim();
  }
  
  if (intent.analysis_type === 'relationship' && intent.relationship_variables) {
    return `${intent.relationship_variables.independent} vs ${intent.relationship_variables.dependent}`;
  }
  
  const groupBy = Array.isArray(intent.group_by) ? intent.group_by : [];
  if (groupBy.length > 0) {
    if (intent.metric.aggregation === 'count') {
      return `${metricName} by ${groupBy[0]}`;
    }
    return `${aggLabel} ${metricName} by ${groupBy[0]}`;
  }
  
  if (intent.analysis_type === 'distribution') {
    return `${metricName} Distribution`;
  }
  
  return `${aggLabel} ${metricName}`;
}

/**
 * Converts column stats to explicit metadata
 */
export function buildColumnMetadata(
  headers: string[],
  columnStats: Record<string, ColumnStats>
): Record<string, ColumnMetadata> {
  const metadata: Record<string, ColumnMetadata> = {};
  
  for (const header of headers) {
    const stats = columnStats[header];
    const name = header.toLowerCase();
    
    // Determine type explicitly (not inferred)
    let type: ColumnMetadata['type'] = 'text';
    let aggregationAllowed: ColumnMetadata['aggregation_allowed'] = ['count'];
    let isGroupingVariable = false;
    let isMetricVariable = false;
    
    if (stats) {
      // Explicit type detection
      if (stats.type === 'numeric') {
        // Check if ordinal (low cardinality, limited range)
        const uniqueCount = stats.uniqueCount;
        const range = (stats.stats?.max || 0) - (stats.stats?.min || 0);
        
        if (uniqueCount < 20 && range > 0 && uniqueCount / range < 0.5) {
          // Likely ordinal (education levels, ratings, etc.)
          // BUT: If it's numeric, we CAN average it (e.g., education-num, age groups)
          // The key is: if title says "Average", we should allow it
          type = 'ordinal';
          // Allow avg for ordinal IF it's explicitly requested (e.g., "Average Education Level")
          // But prefer median/count for distribution analysis
          aggregationAllowed = ['avg', 'median', 'count', 'sum']; // Allow avg for ordinal numeric
          isGroupingVariable = true;
          isMetricVariable = true; // Ordinal numeric CAN be used as metric (e.g., education-num, age)
        } else {
          // Continuous numeric
          type = 'continuous';
          aggregationAllowed = ['avg', 'sum', 'count', 'median', 'min', 'max'];
          isGroupingVariable = false; // Can't group by continuous (need binning)
          isMetricVariable = true;
        }
      } else if (stats.type === 'text') {
        if (stats.uniqueCount < 50) {
          type = 'categorical';
          aggregationAllowed = ['count'];
          isGroupingVariable = true;
          isMetricVariable = false;
        } else {
          type = 'text';
          aggregationAllowed = ['count'];
          isGroupingVariable = false;
          isMetricVariable = false;
        }
      } else if (stats.type === 'boolean') {
        type = 'boolean';
        aggregationAllowed = ['count'];
        isGroupingVariable = true;
        isMetricVariable = false;
      } else if (stats.type === 'date') {
        type = 'date';
        aggregationAllowed = ['count', 'min', 'max'];
        isGroupingVariable = true; // Can group by date
        isMetricVariable = false;
      } else if (stats.type === 'year') {
        // Year columns: treat as date/ordinal, prevent sum/avg
        type = 'date'; // Use date type for years
        aggregationAllowed = ['count', 'min', 'max']; // NO sum/avg on years!
        isGroupingVariable = true; // Can group by year
        isMetricVariable = false; // Years cannot be used as metrics (can't sum/average years)
      }
    } else {
      // Fallback: infer from column name
      const categoricalKeywords = ['category', 'type', 'status', 'group', 'class', 'label'];
      const ordinalKeywords = ['level', 'grade', 'rating', 'rank', 'score'];
      const yearKeywords = ['year', 'launchyear', 'birthyear'];
      
      if (yearKeywords.some(kw => name.includes(kw))) {
        type = 'date'; // Treat as date
        aggregationAllowed = ['count', 'min', 'max']; // NO sum/avg on years!
        isGroupingVariable = true;
        isMetricVariable = false;
      } else if (categoricalKeywords.some(kw => name.includes(kw))) {
        type = 'categorical';
        aggregationAllowed = ['count'];
        isGroupingVariable = true;
      } else if (ordinalKeywords.some(kw => name.includes(kw))) {
        type = 'ordinal';
        aggregationAllowed = ['count', 'median'];
        isGroupingVariable = true;
      }
    }
    
    metadata[header] = {
      name: header,
      type,
      aggregation_allowed: aggregationAllowed,
      is_grouping_variable: isGroupingVariable,
      is_metric_variable: isMetricVariable,
      stats
    };
  }
  
  return metadata;
}

/**
 * Extracts analytical intent from LLM insight text
 * This is a fallback parser - ideally LLM should output structured intent directly
 */
export function extractIntentFromText(
  insightText: string,
  title: string,
  variables: string[],
  aggregation: string,
  chartType: string,
  columnMetadata: Record<string, ColumnMetadata>
): AnalyticalIntent | null {
  // Try to infer intent from title and variables
  const titleLower = title.toLowerCase();
  
  // Detect analysis type
  let analysisType: AnalyticalIntent['analysis_type'] = 'comparison';
  if (titleLower.includes('relationship') || titleLower.includes('vs') || titleLower.includes('versus')) {
    analysisType = 'relationship';
  } else if (titleLower.includes('distribution') || chartType === 'pie') {
    analysisType = 'distribution';
  } else if (titleLower.includes('trend') || titleLower.includes('over time')) {
    analysisType = 'trend';
  } else if (titleLower.includes('correlation')) {
    analysisType = 'correlation';
  }
  
  // Extract metric and grouping from "X by Y" pattern
  const byPattern = /(\w+)\s+by\s+(\w+)/i;
  const byMatch = title.match(byPattern);
  
  let groupBy: string[] = [];
  let relationshipVars: { independent: string; dependent: string } | undefined;
  
  if (byMatch) {
    const metricTerm = byMatch[1];
    const groupTerm = byMatch[2];
    
    // Find grouping column
    const groupColumn = Object.keys(columnMetadata).find(col => 
      col.toLowerCase().includes(groupTerm.toLowerCase()) || 
      groupTerm.toLowerCase().includes(col.toLowerCase())
    ) || variables[0];
    
    groupBy = [groupColumn];
  } else if (analysisType === 'relationship' && variables.length >= 2) {
    relationshipVars = {
      independent: variables[0],
      dependent: variables[1]
    };
  } else {
    groupBy = variables.length > 1 ? [variables[0]] : [];
  }
  
  // CRITICAL: Use metric binding to find the correct metric column
  // This prevents count from hijacking actual metric columns
  const metricBinding = bindMetricColumn(
    { metric: { column: variables[1] }, group_by: groupBy },
    variables,
    columnMetadata,
    title,
    insightText
  );
  
  const metricColumn = metricBinding.column;
  let metricAggregation = metricBinding.aggregation;
  
  // Override with explicit aggregation from title if present
  if (titleLower.includes('average') || titleLower.includes('avg') || titleLower.includes('mean')) {
    const metadata = columnMetadata[metricColumn];
    if (metadata && metadata.aggregation_allowed.includes('avg')) {
      metricAggregation = 'avg';
    }
  } else if (titleLower.includes('total') || titleLower.includes('sum')) {
    const metadata = columnMetadata[metricColumn];
    if (metadata && metadata.aggregation_allowed.includes('sum')) {
      metricAggregation = 'sum';
    }
  } else if (aggregation && aggregation !== 'count') {
    // Use provided aggregation if it's not count (count is often wrong)
    const metadata = columnMetadata[metricColumn];
    if (metadata && metadata.aggregation_allowed.includes(aggregation as any)) {
      metricAggregation = aggregation as any;
    }
  }
  
  // Final validation: ensure aggregation is allowed
  const metricMeta = columnMetadata[metricColumn];
  if (metricMeta && !metricMeta.aggregation_allowed.includes(metricAggregation)) {
    // Use context-aware aggregation instead of just first allowed
    metricAggregation = inferAggregationFromContext(
      title,
      insightText,
      metricColumn,
      columnMetadata
    );
  }
  
  return {
    insight_text: insightText,
    analysis_type: analysisType,
    metric: {
      column: metricColumn,
      aggregation: metricAggregation,
      display_name: metricColumn
    },
    group_by: groupBy,
    relationship_variables: relationshipVars,
    chart_type: chartType as any,
    expected_output: title
  };
}
