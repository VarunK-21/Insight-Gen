/**
 * Chart Validation Module
 * 
 * Validates chart specifications to prevent:
 * - Title/axis mismatches
 * - Inappropriate aggregations (e.g., averaging ordinal data)
 * - Relationship charts that don't show relationships
 * - Variable mapping errors
 */

import { ColumnStats } from "./dataCleaning";
import { deriveAxisLabels } from "./axisLabels";

export interface DashboardView {
  title: string;
  purpose: string;
  chartType: 'line' | 'bar' | 'scatter' | 'table' | 'pie' | 'area' | 'radar';
  variables: string[];
  aggregation?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  analyticalIntent?: any; // Optional - added during processing
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixedView?: DashboardView;
}

/**
 * Detects if a column name suggests ordinal data (education levels, ratings, etc.)
 * Works for any domain - detects ordinal patterns generically
 */
function isOrdinalColumn(columnName: string, columnStats?: ColumnStats): boolean {
  const name = columnName.toLowerCase();
  
  // Domain-agnostic ordinal keywords (works for any industry)
  const ordinalKeywords = [
    'education', 'level', 'grade', 'rating', 'rank', 'score',
    'satisfaction', 'quality', 'priority', 'importance', 'tier',
    'class', 'category', 'stage', 'phase', 'step', 'order',
    'scale', 'degree', 'status', 'state', 'condition'
  ];
  
  if (ordinalKeywords.some(keyword => name.includes(keyword))) {
    return true;
  }
  
  // Statistical detection: numeric but with low cardinality relative to range
  // This works for any domain - detects ordinal patterns in numeric data
  if (columnStats?.type === 'numeric' && columnStats.stats) {
    const uniqueCount = columnStats.uniqueCount;
    const range = (columnStats.stats.max || 0) - (columnStats.stats.min || 0);
    // If unique values are sparse (e.g., 1-16 but only 5 unique values), likely ordinal
    // This catches education levels, ratings, etc. in any dataset
    if (range > 0 && uniqueCount < range * 0.5 && uniqueCount < 20) {
      return true;
    }
    
    // If mean/median are close and stdDev is low relative to range, likely ordinal
    if (columnStats.stats.mean && columnStats.stats.stdDev && range > 0) {
      const cv = columnStats.stats.stdDev / columnStats.stats.mean; // coefficient of variation
      if (cv < 0.3 && uniqueCount < 15) {
        return true; // Low variance + low cardinality = likely ordinal
      }
    }
  }
  
  return false;
}

/**
 * Detects if a column name suggests categorical data
 * Domain-agnostic - works for any industry/dataset
 */
function isCategoricalColumn(columnName: string, columnStats?: ColumnStats): boolean {
  const name = columnName.toLowerCase();
  
  // Universal categorical keywords (works across all domains)
  const categoricalKeywords = [
    'category', 'type', 'status', 'group', 'class', 'label',
    'marital', 'gender', 'race', 'country', 'region', 'state',
    'department', 'division', 'team', 'unit', 'branch', 'office',
    'product', 'service', 'brand', 'model', 'version', 'variant',
    'industry', 'sector', 'segment', 'market', 'channel',
    'source', 'medium', 'campaign', 'platform', 'device',
    'color', 'size', 'shape', 'material', 'style', 'format'
  ];
  
  if (categoricalKeywords.some(keyword => name.includes(keyword))) {
    return true;
  }
  
  // Statistical detection: text type with low cardinality = categorical
  // Works for any domain - if text column has <50 unique values, it's categorical
  if (columnStats?.type === 'text' && columnStats.uniqueCount < 50) {
    return true;
  }
  
  // If it's text and unique count is low relative to total rows, likely categorical
  if (columnStats?.type === 'text' && columnStats.uniqueCount > 0) {
    // If unique values represent <5% of total, likely categorical
    // This catches things like "Yes/No", "Active/Inactive", etc.
    const sampleValues = columnStats.sampleValues || [];
    if (sampleValues.length > 0 && columnStats.uniqueCount <= 10) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extracts key terms from title to validate against variables
 * Universal stop words - works for any language/domain
 */
function extractTitleTerms(title: string): string[] {
  const stopWords = new Set([
    'by', 'vs', 'versus', 'and', 'or', 'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for',
    'with', 'from', 'across', 'between', 'among', 'through', 'over', 'under', 'above', 'below',
    'relationship', 'comparison', 'distribution', 'trend', 'analysis', 'overview', 'summary'
  ]);
  
  return title
    .toLowerCase()
    .split(/[\s\-_()]+/)
    .filter(term => term.length > 2 && !stopWords.has(term))
    .map(term => term.replace(/[^a-z0-9]/g, '')) // Remove special chars
    .filter(term => term.length > 0);
}

/**
 * Checks if title matches the variables being used
 */
function validateTitleVariableConsistency(
  title: string,
  variables: string[],
  headers: string[],
  columnStats: Record<string, ColumnStats>
): { isValid: boolean; errors: string[]; suggestedTitle?: string } {
  const errors: string[] = [];
  const titleTerms = extractTitleTerms(title);
  
  // Check if title mentions variables that aren't in the chart
  const variableNames = variables.map(v => v.toLowerCase());
  const headerMap = new Map(headers.map((h, i) => [h.toLowerCase(), i]));
  
  // Find which variables from title are actually in the dataset
  const titleVariables: string[] = [];
  for (const term of titleTerms) {
    for (const [header, _] of headerMap) {
      if (header.includes(term) || term.includes(header)) {
        titleVariables.push(header);
        break;
      }
    }
  }
  
  // Check if title suggests a relationship but variables don't match
  const relationshipKeywords = ['vs', 'by', 'across', 'relationship', 'comparison', 'versus'];
  const hasRelationshipKeyword = relationshipKeywords.some(kw => title.toLowerCase().includes(kw));
  
  if (hasRelationshipKeyword && variables.length < 2) {
    errors.push(`Title suggests a relationship ("${title}") but only ${variables.length} variable(s) provided`);
  }
  
  // Check if title mentions a variable that's not in the chart variables
  const missingInVariables: string[] = [];
  for (const titleVar of titleVariables) {
    if (!variableNames.some(v => v.includes(titleVar) || titleVar.includes(v))) {
      missingInVariables.push(titleVar);
    }
  }
  
  if (missingInVariables.length > 0 && titleVariables.length > 0) {
    errors.push(`Title mentions "${missingInVariables.join(', ')}" but chart uses different variables: ${variables.join(', ')}`);
  }
  
  // Universal pattern matching - works for any domain
  // Detects "X by Y" pattern where X should be on Y-axis and Y on X-axis
  const titleLower = title.toLowerCase();
  const byPattern = /(\w+)\s+by\s+(\w+)/i;
  const byMatch = title.match(byPattern);
  
  if (byMatch) {
    const yAxisTerm = byMatch[1].toLowerCase(); // What should be on Y-axis
    const xAxisTerm = byMatch[2].toLowerCase(); // What should be on X-axis
    
    // Find if these terms are in variables
    const yVar = variables.find(v => {
      const vLower = v.toLowerCase();
      return vLower.includes(yAxisTerm) || yAxisTerm.includes(vLower) ||
             headers.some(h => h.toLowerCase().includes(yAxisTerm) && 
                            (h.toLowerCase().includes(vLower) || vLower.includes(h.toLowerCase())));
    });
    
    const xVar = variables.find(v => {
      const vLower = v.toLowerCase();
      return vLower.includes(xAxisTerm) || xAxisTerm.includes(vLower) ||
             headers.some(h => h.toLowerCase().includes(xAxisTerm) && 
                            (h.toLowerCase().includes(vLower) || vLower.includes(h.toLowerCase())));
    });
    
    // Check if variables are in wrong positions
    if (yVar && xVar) {
      const yVarIndex = variables.indexOf(yVar);
      const xVarIndex = variables.indexOf(xVar);
      
      // Y-axis variable should be second (index 1), X-axis should be first (index 0)
      if (yVarIndex === 0 && xVarIndex === 1) {
        errors.push(`Title says "${yAxisTerm} by ${xAxisTerm}" but ${yAxisTerm} is on X-axis. Should be on Y-axis.`);
      }
    } else if (yVar && !xVar) {
      errors.push(`Title mentions "${xAxisTerm}" but no matching variable found in chart`);
    } else if (!yVar && xVar) {
      errors.push(`Title mentions "${yAxisTerm}" but no matching variable found in chart`);
    }
  }
  
  // Generic pattern: "X vs Y" or "X and Y relationship" needs both variables
  const vsPattern = /(\w+)\s+(?:vs|versus|and)\s+(\w+)/i;
  const vsMatch = title.match(vsPattern);
  if (vsMatch && variables.length < 2) {
    errors.push(`Title suggests comparison between "${vsMatch[1]}" and "${vsMatch[2]}" but only ${variables.length} variable(s) provided`);
  }
  
  // Check for domain-agnostic keyword mismatches
  // Extract all significant words from title and check if they appear in variables
  const significantWords = extractTitleTerms(title).filter(term => term.length > 3);
  const missingKeywords: string[] = [];
  
  for (const word of significantWords) {
    const found = variableNames.some(v => v.includes(word) || word.includes(v)) ||
                  headers.some(h => {
                    const hLower = h.toLowerCase();
                    return hLower.includes(word) || word.includes(hLower);
                  });
    if (!found && word.length > 4) { // Only flag longer, more specific terms
      missingKeywords.push(word);
    }
  }
  
  // Only flag if we have clear mismatches (not false positives from generic words)
  if (missingKeywords.length > 0 && significantWords.length > 1) {
    // Check if missing keywords are actually important (not generic)
    const genericWords = new Set(['distribution', 'trend', 'analysis', 'overview', 'summary', 'chart', 'view']);
    const importantMissing = missingKeywords.filter(w => !genericWords.has(w));
    if (importantMissing.length > 0) {
      errors.push(`Title mentions "${importantMissing.join(', ')}" but no matching variables found`);
    }
  }
  
  // Generate suggested title if errors found
  let suggestedTitle: string | undefined;
  if (errors.length > 0 && variables.length >= 1) {
    const firstVar = headers.find(h => 
      variables.some(v => h.toLowerCase().includes(v.toLowerCase()) || v.toLowerCase().includes(h.toLowerCase()))
    ) || variables[0];
    const secondVar = variables.length > 1 
      ? headers.find(h => 
          variables.some(v => h.toLowerCase().includes(v.toLowerCase()) || v.toLowerCase().includes(h.toLowerCase())) && 
          h !== firstVar
        ) || variables[1]
      : null;
    
    if (secondVar) {
      suggestedTitle = `${secondVar} by ${firstVar}`;
    } else {
      suggestedTitle = `${firstVar} Distribution`;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    suggestedTitle
  };
}

/**
 * Validates aggregation type against data type
 */
function validateAggregationType(
  aggregation: string,
  variableName: string,
  columnStats?: ColumnStats
): { isValid: boolean; errors: string[]; suggestedAggregation?: string } {
  const errors: string[] = [];
  const agg = aggregation.toLowerCase();
  const varName = variableName.toLowerCase();
  
  // Universal rule: Check if averaging inappropriate data types (works for ANY domain)
  if (agg === 'avg' || agg === 'average' || agg === 'mean') {
    // Ordinal data detection (works for any domain - education, ratings, levels, etc.)
    if (isOrdinalColumn(varName, columnStats)) {
      errors.push(`Cannot average ordinal data ("${variableName}"). Ordinal values (levels, ratings, ranks) cannot be meaningfully averaged. Use "count" to show distribution instead.`);
      return {
        isValid: false,
        errors,
        suggestedAggregation: 'count'
      };
    }
    
    // Categorical data detection (universal - works for any category type)
    if (isCategoricalColumn(varName, columnStats)) {
      errors.push(`Cannot average categorical data ("${variableName}"). Categories cannot be averaged. Use "count" instead.`);
      return {
        isValid: false,
        errors,
        suggestedAggregation: 'count'
      };
    }
    
    // Text data (any domain)
    if (columnStats?.type === 'text') {
      errors.push(`Cannot average text data ("${variableName}"). Text values cannot be averaged. Use "count" instead.`);
      return {
        isValid: false,
        errors,
        suggestedAggregation: 'count'
      };
    }
    
    // Boolean data (any domain)
    if (columnStats?.type === 'boolean') {
      errors.push(`Cannot average boolean data ("${variableName}"). Use "count" to show true/false distribution instead.`);
      return {
        isValid: false,
        errors,
        suggestedAggregation: 'count'
      };
    }
    
    // Date data (any domain)
    if (columnStats?.type === 'date') {
      errors.push(`Cannot average date data ("${variableName}"). Extract components (year, month) or use "count" for grouping.`);
      return {
        isValid: false,
        errors,
        suggestedAggregation: 'count'
      };
    }
    
    // Numeric but low cardinality (likely ordinal/categorical encoded as numbers)
    if (columnStats?.type === 'numeric' && columnStats.uniqueCount < 10 && columnStats.stats) {
      const range = (columnStats.stats.max || 0) - (columnStats.stats.min || 0);
      if (range > 0 && columnStats.uniqueCount / range < 0.3) {
        errors.push(`Variable "${variableName}" appears to be categorical/ordinal (low unique count). Use "count" instead of "avg".`);
        return {
          isValid: false,
          errors,
          suggestedAggregation: 'count'
        };
      }
    }
  }
  
  // Universal rule: Check if summing inappropriate data
  if (agg === 'sum') {
    // Can't sum text/categorical (unless it's numeric encoded)
    if (isCategoricalColumn(varName, columnStats) && columnStats?.type !== 'numeric') {
      errors.push(`Cannot sum categorical data ("${variableName}"). Use "count" instead.`);
      return {
        isValid: false,
        errors,
        suggestedAggregation: 'count'
      };
    }
    
    if (columnStats?.type === 'text' || columnStats?.type === 'boolean' || columnStats?.type === 'date') {
      errors.push(`Cannot sum ${columnStats.type} data ("${variableName}"). Use "count" instead.`);
      return {
        isValid: false,
        errors,
        suggestedAggregation: 'count'
      };
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validates relationship charts actually show relationships
 */
function validateRelationshipChart(
  view: DashboardView,
  headers: string[],
  columnStats: Record<string, ColumnStats>
): { isValid: boolean; errors: string[]; fixedView?: DashboardView } {
  const errors: string[] = [];
  const titleLower = view.title.toLowerCase();
  const hasRelationshipKeyword = ['relationship', 'vs', 'versus', 'comparison', 'by', 'across'].some(
    kw => titleLower.includes(kw)
  );
  
  if (!hasRelationshipKeyword) {
    return { isValid: true, errors: [] };
  }
  
  // Relationship charts need 2+ variables
  if (view.variables.length < 2) {
    errors.push(`Relationship chart "${view.title}" requires at least 2 variables, but only ${view.variables.length} provided`);
    
    // Try to fix by finding a second variable
    const firstVar = view.variables[0];
    const firstVarIdx = headers.findIndex(h => 
      h.toLowerCase().includes(firstVar.toLowerCase()) || firstVar.toLowerCase().includes(h.toLowerCase())
    );
    
    if (firstVarIdx >= 0) {
      // Find a complementary variable
      const complementaryVar = headers.find((h, idx) => {
        if (idx === firstVarIdx) return false;
        const stats = columnStats[h];
        // If first is categorical, second should be numeric (or vice versa)
        if (isCategoricalColumn(firstVar, columnStats[firstVar])) {
          return stats?.type === 'numeric';
        }
        if (stats?.type === 'numeric') {
          return isCategoricalColumn(h, stats);
        }
        return true;
      });
      
      if (complementaryVar) {
        const fixedView: DashboardView = {
          ...view,
          variables: [view.variables[0], complementaryVar]
        };
        return { isValid: false, errors, fixedView };
      }
    }
  }
  
  // For pie charts with relationship titles, suggest stacked bar instead
  if (view.chartType === 'pie' && hasRelationshipKeyword && view.variables.length >= 2) {
    errors.push(`Pie chart cannot show relationship between two variables. Consider using stacked bar chart instead.`);
    const fixedView: DashboardView = {
      ...view,
      chartType: 'bar',
      aggregation: 'count'
    };
    return { isValid: false, errors, fixedView };
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Validates and fixes axis labels to match actual data.
 * UNIVERSAL RULE: Labels must ALWAYS describe what is actually displayed.
 * Uses deriveAxisLabels when analyticalIntent exists - single source of truth.
 */
function validateAxisLabels(
  view: DashboardView,
  headers: string[],
  columnStats: Record<string, ColumnStats>
): { isValid: boolean; errors: string[]; fixedView?: DashboardView } {
  const errors: string[] = [];
  const fixes: Partial<DashboardView> = {};

  // When analyticalIntent exists, ALWAYS derive labels from it - never trust LLM-provided
  if (view.analyticalIntent) {
    const derived = deriveAxisLabels(view);
    const currentX = (view.xAxisLabel || "").trim();
    const currentY = (view.yAxisLabel || "").trim();
    const derivedX = derived.xAxisLabel.trim();
    const derivedY = derived.yAxisLabel.trim();

    // Fix if labels don't match what will actually be displayed
    if (currentX !== derivedX || currentY !== derivedY) {
      if (currentX && currentX !== derivedX) {
        errors.push(`X-axis label "${view.xAxisLabel}" doesn't match data; using "${derivedX}"`);
      }
      if (currentY && currentY !== derivedY) {
        errors.push(`Y-axis label "${view.yAxisLabel}" doesn't match data; using "${derivedY}"`);
      }
      fixes.xAxisLabel = derivedX;
      fixes.yAxisLabel = derivedY;
    }
  } else {
    // Fallback for legacy views: ensure labels reference actual variables
    if (view.variables.length > 0) {
      const xVar = view.variables[0];
      const xVarHeader = headers.find(h =>
        h.toLowerCase().includes(xVar.toLowerCase()) || xVar.toLowerCase().includes(h.toLowerCase())
      ) || xVar;
      if (!view.xAxisLabel || !view.xAxisLabel.toLowerCase().includes(xVar.toLowerCase())) {
        fixes.xAxisLabel = xVarHeader;
      }
    }
    if (view.variables.length > 1) {
      const yVar = view.variables[1];
      const yVarHeader = headers.find(h =>
        h.toLowerCase().includes(yVar.toLowerCase()) || yVar.toLowerCase().includes(h.toLowerCase())
      ) || yVar;
      if (!view.yAxisLabel || !view.yAxisLabel.toLowerCase().includes(yVar.toLowerCase())) {
        fixes.yAxisLabel = yVarHeader;
      }
    }
  }

  if (Object.keys(fixes).length > 0) {
    const fixedView: DashboardView = {
      ...view,
      ...fixes
    };
    return { isValid: errors.length === 0, errors, fixedView };
  }

  return { isValid: true, errors: [] };
}

/**
 * Main validation function
 */
export function validateChartView(
  view: DashboardView,
  headers: string[],
  columnStats: Record<string, ColumnStats>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let fixedView: DashboardView | undefined = view;
  
  // 1. Validate title-variable consistency
  const titleValidation = validateTitleVariableConsistency(
    view.title,
    view.variables,
    headers,
    columnStats
  );
  errors.push(...titleValidation.errors);
  if (titleValidation.suggestedTitle && fixedView) {
    fixedView = { ...fixedView, title: titleValidation.suggestedTitle };
  }
  
  // 2. Validate aggregation types
  if (view.variables.length > 0 && view.aggregation) {
    const varName = view.variables[0];
    const stats = columnStats[varName] || Object.values(columnStats).find((_, i) => 
      headers[i]?.toLowerCase().includes(varName.toLowerCase())
    );
    
    const aggValidation = validateAggregationType(view.aggregation, varName, stats);
    if (!aggValidation.isValid) {
      errors.push(...aggValidation.errors);
      if (aggValidation.suggestedAggregation && fixedView) {
        fixedView = { ...fixedView, aggregation: aggValidation.suggestedAggregation };
      }
    }
  }
  
  // 3. Validate relationship charts
  const relationshipValidation = validateRelationshipChart(fixedView || view, headers, columnStats);
  if (!relationshipValidation.isValid) {
    errors.push(...relationshipValidation.errors);
    if (relationshipValidation.fixedView) {
      fixedView = relationshipValidation.fixedView;
    }
  }
  
  // 4. Validate axis labels
  const axisValidation = validateAxisLabels(fixedView || view, headers, columnStats);
  if (!axisValidation.isValid) {
    errors.push(...axisValidation.errors);
    if (axisValidation.fixedView) {
      fixedView = axisValidation.fixedView;
    }
  }
  
  // 5. Check for common issues
  if (view.chartType === 'pie' && view.variables.length > 1) {
    warnings.push('Pie charts typically use one variable. Consider using a single categorical variable.');
  }
  
  if (view.chartType === 'line' && view.variables.length < 2) {
    warnings.push('Line charts typically show trends across categories. Consider providing a categorical X-axis variable.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fixedView: errors.length > 0 ? fixedView : undefined
  };
}

/**
 * Validates and fixes an array of chart views
 */
export function validateChartViews(
  views: DashboardView[],
  headers: string[],
  columnStats: Record<string, ColumnStats>
): { validViews: DashboardView[]; invalidViews: Array<{ view: DashboardView; errors: string[] }> } {
  const validViews: DashboardView[] = [];
  const invalidViews: Array<{ view: DashboardView; errors: string[] }> = [];
  
  for (const view of views) {
    const validation = validateChartView(view, headers, columnStats);
    
    if (validation.isValid) {
      validViews.push(view);
    } else {
      // Use fixed view if available, otherwise mark as invalid
      if (validation.fixedView) {
        // Re-validate the fixed view
        const revalidation = validateChartView(validation.fixedView, headers, columnStats);
        if (revalidation.isValid) {
          validViews.push(validation.fixedView);
        } else {
          invalidViews.push({ view: validation.fixedView, errors: validation.errors });
        }
      } else {
        invalidViews.push({ view, errors: validation.errors });
      }
    }
  }
  
  return { validViews, invalidViews };
}
