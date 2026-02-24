import { useMemo, useState, useEffect } from "react";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ScatterChart, Scatter, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table2, TrendingUp, Activity, Maximize2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import { AnalyticalIntent } from "@/lib/analyticalIntent";
import { deriveAxisLabels } from "@/lib/axisLabels";
import {
  calculateConfidenceInterval,
  calculateMedianAndSkewness,
  detectOutliersIQR,
  calculateRobustStatistics
} from "@/lib/advancedAnalytics";

interface DashboardView {
  title: string;
  purpose: string;
  chartType: 'line' | 'bar' | 'scatter' | 'table' | 'pie' | 'area' | 'radar';
  variables: string[];
  aggregation?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  analyticalIntent?: AnalyticalIntent; // Structured intent for relationship charts
}

interface ChartsTabProps {
  data: string[][];
  dashboardViews: DashboardView[];
}

const COLORS = [
  'hsl(173, 80%, 45%)', // primary teal
  'hsl(271, 91%, 65%)', // accent purple
  'hsl(45, 93%, 47%)',  // persona-common gold
  'hsl(142, 71%, 45%)', // persona-accountant green
  'hsl(199, 89%, 48%)', // persona-engineer blue
  'hsl(280, 67%, 60%)', // persona-policy purple
  'hsl(0, 72%, 51%)',   // red
  'hsl(25, 95%, 53%)',  // orange
];

const ChartIcon = ({ type }: { type: DashboardView['chartType'] }) => {
  switch (type) {
    case 'line': return <LineChartIcon className="w-5 h-5" />;
    case 'bar': return <BarChart3 className="w-5 h-5" />;
    case 'pie': return <PieChartIcon className="w-5 h-5" />;
    case 'area': return <Activity className="w-5 h-5" />;
    case 'radar': return <TrendingUp className="w-5 h-5" />;
    default: return <Table2 className="w-5 h-5" />;
  }
};

// Clean label to remove "?" and unknown values
const cleanLabel = (label: string): string => {
  if (!label || label === '?' || label === 'Unknown' || label === 'null' || label === 'undefined' || label.trim() === '') {
    return null as any; // Will be filtered out
  }
  return label.trim();
};

// Format large numbers for display
// Special handling: Don't format years (1900-2100) with K/M suffixes
const formatValue = (value: number): string => {
  // Check if value is a year (4-digit integer in reasonable range)
  if (Number.isInteger(value) && value >= 1900 && value <= 2100) {
    return value.toString(); // Return year as-is, no formatting
  }
  
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
};

const normalizeAggregation = (value?: string): "sum" | "avg" | "count" => {
  const normalized = (value || "sum").toLowerCase();
  if (normalized === "avg" || normalized === "average" || normalized === "mean") return "avg";
  if (normalized === "count" || normalized === "distribution" || normalized === "frequency") return "count";
  return "sum";
};

export const ChartsTab = ({ data, dashboardViews }: ChartsTabProps) => {
  const [expandedChart, setExpandedChart] = useState<number | null>(null);
  const [chartsReady, setChartsReady] = useState(false);
  
  const headers = data[0] || [];
  const rows = data.slice(1);

  // Add a delay to ensure data is fully processed before rendering
  useEffect(() => {
    const timer = setTimeout(() => setChartsReady(true), 100);
    return () => clearTimeout(timer);
  }, [data]);

  const generateChartData = useMemo(() => (view: DashboardView) => {
    if (!headers.length || !rows.length) return null;

    const isNumericColumn = (idx: number) => {
      const vals = rows.slice(0, 25).map(r => r[idx]).filter(Boolean);
      if (!vals.length) return false;
      const numericCount = vals.filter(v => !isNaN(parseFloat(v.toString().replace(/[,$%]/g, '')))).length;
      return numericCount >= vals.length * 0.6;
    };

    const isTextColumn = (idx: number) => {
      const vals = rows.slice(0, 25).map(r => r[idx]).filter(Boolean);
      if (!vals.length) return false;
      const textCount = vals.filter(v => v && isNaN(parseFloat(v.toString().replace(/[,$%]/g, '')))).length;
      return textCount >= vals.length * 0.6;
    };

    // SPECIAL HANDLING: Scatter plots with relationship variables
    // For relationship charts, use raw variables directly, not aggregated data
    if (view.chartType === 'scatter' && view.analyticalIntent?.relationship_variables) {
      const relVars = view.analyticalIntent.relationship_variables;
      
      // Find column indices for relationship variables
      const indVarIdx = headers.findIndex(h => 
        h?.toLowerCase() === relVars.independent?.toLowerCase() ||
        h?.toLowerCase()?.includes(relVars.independent?.toLowerCase()) ||
        relVars.independent?.toLowerCase()?.includes(h?.toLowerCase())
      );
      
      const depVarIdx = headers.findIndex(h => 
        h?.toLowerCase() === relVars.dependent?.toLowerCase() ||
        h?.toLowerCase()?.includes(relVars.dependent?.toLowerCase()) ||
        relVars.dependent?.toLowerCase()?.includes(h?.toLowerCase())
      );
      
      if (indVarIdx >= 0 && depVarIdx >= 0) {
        // Sample data for scatter plot (raw points, not aggregated)
        const sampleSize = Math.min(rows.length, 1000); // More points for scatter
        const sampleStep = Math.ceil(rows.length / sampleSize);
        const sampledRows = rows.filter((_, i) => i % sampleStep === 0).slice(0, sampleSize);
        
        const scatterData = sampledRows
          .map(row => {
            const xVal = parseFloat((row[indVarIdx] || '0').toString().replace(/[,$%]/g, ''));
            const yVal = parseFloat((row[depVarIdx] || '0').toString().replace(/[,$%]/g, ''));
            
            if (isNaN(xVal) || isNaN(yVal) || !isFinite(xVal) || !isFinite(yVal)) {
              return null;
            }
            
            return {
              x: xVal,
              y: yVal,
              name: `${relVars.independent}: ${xVal}, ${relVars.dependent}: ${yVal}`
            };
          })
          .filter((point): point is { x: number; y: number; name: string } => point !== null);
        
        return scatterData.length >= 2 ? scatterData : null;
      }
    }

    // CRITICAL: Use analyticalIntent as the ONLY source of truth
    // Do NOT use view.variables or view.aggregation - they can drift
    if (!view.analyticalIntent) {
      console.error('Chart view missing analyticalIntent:', view);
      return null; // Fail fast - no intent means no chart
    }

    const intent = view.analyticalIntent;
    const groupBy = Array.isArray(intent.group_by) ? intent.group_by : [];
    
    // For grouped charts (bar, line, pie, area), we need group_by and metric
    if (groupBy.length === 0 && !intent.relationship_variables) {
      console.error('Chart intent missing group_by or relationship_variables:', intent);
      return null;
    }

    // Find label column (grouping variable) - EXACT MATCH ONLY, NO FALLBACK
    const labelColumnName = groupBy[0];
    let labelIdx = headers.findIndex(h => h?.toLowerCase() === labelColumnName?.toLowerCase());
    if (labelIdx === -1) {
      // Try case-insensitive partial match as last resort
      labelIdx = headers.findIndex(h => 
        h?.toLowerCase()?.includes(labelColumnName?.toLowerCase()) || 
        labelColumnName?.toLowerCase()?.includes(h?.toLowerCase())
      );
    }
    
    if (labelIdx === -1) {
      console.error(`Grouping column "${labelColumnName}" not found in dataset headers:`, headers);
      return null; // FAIL FAST - no fallback
    }

    // Find value column (metric column) - EXACT MATCH ONLY, NO FALLBACK
    const metricColumnName = intent.metric.column;
    let valueIdx = headers.findIndex(h => h?.toLowerCase() === metricColumnName?.toLowerCase());
    if (valueIdx === -1) {
      // Try case-insensitive partial match as last resort
      valueIdx = headers.findIndex(h => 
        h?.toLowerCase()?.includes(metricColumnName?.toLowerCase()) || 
        metricColumnName?.toLowerCase()?.includes(h?.toLowerCase())
      );
    }
    
    if (valueIdx === -1) {
      console.error(`Metric column "${metricColumnName}" not found in dataset headers:`, headers);
      return null; // FAIL FAST - no fallback
    }

    if (labelIdx === valueIdx) {
      console.error(`Label column and metric column are the same: "${labelColumnName}"`);
      return null; // FAIL FAST - invalid configuration
    }

    // Sample larger datasets to prevent performance issues
    const sampleSize = Math.min(rows.length, 500);
    const sampleStep = Math.ceil(rows.length / sampleSize);
    const sampledRows = rows.filter((_, i) => i % sampleStep === 0).slice(0, sampleSize);

    // Aggregate data - filter out invalid labels early
    // Enhanced structure to support advanced analytics
    const aggregated: Record<string, { 
      sum: number; 
      count: number; 
      values: number[];
      // Advanced analytics will be computed per group
    }> = {};
    
    // CRITICAL: Use aggregation from analyticalIntent, NOT view.aggregation
    // view.aggregation can drift, but intent.metric.aggregation is the source of truth
    const aggregation = normalizeAggregation(intent.metric.aggregation);
    
    // Log for debugging (can remove in production)
    console.log('Chart Data Generation:', {
      title: view.title,
      labelColumn: labelColumnName,
      metricColumn: metricColumnName,
      aggregation: intent.metric.aggregation,
      normalizedAggregation: aggregation,
      labelIdx,
      valueIdx
    });

    sampledRows.forEach(row => {
      const rawLabel = (row[labelIdx] || '').toString().trim();
      const label = cleanLabel(rawLabel);
      
      // Skip invalid labels
      if (!label) return;
      
      if (!aggregated[label]) {
        aggregated[label] = { sum: 0, count: 0, values: [] };
      }

      // For count charts, count rows directly and avoid numeric conversion noise.
      if (aggregation === "count") {
        aggregated[label].count++;
        return;
      }

      const rawVal = row[valueIdx] || '0';
      const val = parseFloat(rawVal.toString().replace(/[,$%]/g, ''));
      if (!isNaN(val) && isFinite(val)) {
        aggregated[label].sum += val;
        aggregated[label].count++;
        aggregated[label].values.push(val);
      }
    });

    const result = Object.entries(aggregated)
      .filter(([name]) => name && name.length > 0) // Extra filter for valid names
      .map(([name, d]) => {
        let value: number;
        let median: number | undefined;
        let confidenceInterval: ReturnType<typeof calculateConfidenceInterval> | undefined;
        let skewnessInfo: ReturnType<typeof calculateMedianAndSkewness> | undefined;
        let outlierInfo: ReturnType<typeof detectOutliersIQR> | undefined;
        let showWarning = false;
        let warningMessage = '';
        
        switch (aggregation) {
          case 'avg':
            value = d.count > 0 ? Math.round(d.sum / d.count * 100) / 100 : 0;
            
            // Advanced analytics for averages
            if (d.values.length >= 3) { // Need at least 3 values for meaningful stats
              // Calculate confidence interval
              confidenceInterval = calculateConfidenceInterval(d.values);
              
              // Calculate median and skewness
              skewnessInfo = calculateMedianAndSkewness(d.values);
              median = skewnessInfo.median;
              
              // Detect outliers
              outlierInfo = detectOutliersIQR(d.values);
              
              // Generate warnings if needed
              if (skewnessInfo.isSkewed && skewnessInfo.recommendation === 'median') {
                showWarning = true;
                warningMessage = `Data is skewed (skewness: ${skewnessInfo.skewness}). Consider using median (${median}) instead of mean (${value}).`;
              } else if (outlierInfo.outlierPercentage > 10) {
                showWarning = true;
                warningMessage = `High outlier rate (${outlierInfo.outlierPercentage}%). Mean may be misleading.`;
              }
            }
            break;
          case 'count':
            value = d.count;
            break;
          case 'sum':
          default:
            value = Math.round(d.sum * 100) / 100;
        }
        
        return {
          name: name.length > 18 ? name.slice(0, 18) + '...' : name,
          fullName: name,
          value,
          count: d.count,
          // Advanced analytics metadata
          median,
          confidenceInterval,
          skewnessInfo,
          outlierInfo,
          showWarning,
          warningMessage
        };
      })
      .filter(d => isFinite(d.value) && d.name)
      .slice(0, 10); // Limit to 10 items for cleaner charts

    if (view.chartType === "bar" || view.chartType === "pie") {
      result.sort((a, b) => b.value - a.value);
    }

    return result.length >= 2 ? result : null; // Require at least 2 data points
  }, [headers, rows]);

  const fallbackViews = useMemo(() => {
    const numericIdxs = headers
      .map((name, idx) => {
        const vals = rows.slice(0, 25).map(r => r[idx]).filter(Boolean);
        const numericCount = vals.filter(v => !isNaN(parseFloat(v.toString().replace(/[,$%]/g, '')))).length;
        return numericCount > vals.length * 0.6 ? idx : -1;
      })
      .filter(idx => idx >= 0);

    const textIdxs = headers
      .map((name, idx) => {
        const vals = rows.slice(0, 25).map(r => r[idx]).filter(Boolean);
        const textCount = vals.filter(v => v && isNaN(parseFloat(v.toString().replace(/[,$%]/g, '')))).length;
        return textCount > vals.length * 0.6 ? idx : -1;
      })
      .filter(idx => idx >= 0);

    const labelIdx = textIdxs[0] ?? 0;
    const valueIdx = numericIdxs.find(idx => idx !== labelIdx) ?? (labelIdx === 0 ? 1 : 0);

    const label = headers[labelIdx] || "Category";
    const value = headers[valueIdx] || "Value";

    return [
      { title: `${value} by ${label}`, purpose: "Compare totals by category", chartType: "bar", variables: [label, value], aggregation: "sum" },
      { title: `${value} trend by ${label}`, purpose: "See changes across categories", chartType: "line", variables: [label, value], aggregation: "avg" },
      { title: `${value} share by ${label}`, purpose: "Show proportional contribution", chartType: "pie", variables: [label, value], aggregation: "sum" },
      { title: `${label} vs ${value}`, purpose: "Tabular comparison", chartType: "table", variables: [label, value], aggregation: "sum" },
    ] as DashboardView[];
  }, [headers, rows]);

  const renderChart = (view: DashboardView, chartData: any[] | null, isExpanded = false) => {
    const height = isExpanded ? 500 : 320;
    
    if (!chartData || chartData.length < 2) {
      return null;
    }
    
    const tooltipStyle = { 
      backgroundColor: 'hsl(222, 47%, 11%)', 
      border: '1px solid hsl(222, 30%, 22%)',
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: '0 8px 24px -4px hsl(0 0% 0% / 0.4)',
    };

    const axisStyle = { fill: 'hsl(215, 20%, 60%)', fontSize: 11 };
    
    // CRITICAL: Always derive axis labels from intent - never trust stored labels
    // Ensures X/Y labels ALWAYS match what is actually displayed (any dataset, any domain)
    const derived = deriveAxisLabels(view);
    const xAxisLabel = derived.xAxisLabel;
    const yAxisLabel = derived.yAxisLabel;
    const aggregation = normalizeAggregation(derived.aggregationLabel === 'raw' ? view.aggregation : derived.aggregationLabel) as 'sum' | 'avg' | 'count';

    // Custom tooltip formatter - uses formatValue for consistency (years, K/M, etc.)
    const formatTooltipValue = (value: number, name: string) => {
      const formattedValue = formatValue(value);
      const label = aggregation === 'count' ? 'Count' : 
                    aggregation === 'avg' ? 'Average' : 'Total';
      return [formattedValue, label];
    };

    switch (view.chartType) {
      case 'bar':
        // Check if any data points have warnings
        const hasWarnings = chartData.some((d: any) => d.showWarning);
        const warnings = chartData.filter((d: any) => d.showWarning) as Array<any>;
        
        return (
          <div className="space-y-2">
            {/* Warnings for skewed data or outliers */}
            {hasWarnings && (
              <div className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                  ⚠️ Statistical Warning
                </p>
                {warnings.slice(0, 2).map((w: any, idx: number) => (
                  <p key={idx} className="text-xs text-yellow-700 dark:text-yellow-300">
                    {w.fullName}: {w.warningMessage}
                  </p>
                ))}
                {warnings.length > 2 && (
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    +{warnings.length - 2} more warnings
                  </p>
                )}
              </div>
            )}
            
            {/* Chart Description */}
            <div className="px-2 py-1.5 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">X-Axis:</span> {xAxisLabel} • 
                <span className="font-medium text-foreground ml-2">Y-Axis:</span> {yAxisLabel}
                {aggregation && aggregation !== 'none' && (
                  <span className="ml-2">• Aggregated by <span className="text-primary">{aggregation}</span></span>
                )}
                {aggregation === 'avg' && chartData[0]?.confidenceInterval && (
                  <span className="ml-2">• 95% CI available</span>
                )}
              </p>
            </div>
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" opacity={0.4} />
                <XAxis 
                  dataKey="name" 
                  tick={axisStyle}
                  angle={-40}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tickLine={{ stroke: 'hsl(222, 30%, 25%)' }}
                  label={{ value: xAxisLabel, position: 'bottom', offset: -5, fill: 'hsl(173, 80%, 45%)', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis 
                  tick={axisStyle}
                  tickFormatter={(val) => formatValue(val)}
                  tickLine={{ stroke: 'hsl(222, 30%, 25%)' }}
                  axisLine={{ stroke: 'hsl(222, 30%, 25%)' }}
                  label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: 'hsl(173, 80%, 45%)', fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: 'hsl(210, 40%, 98%)', fontWeight: 600, marginBottom: 4 }}
                  formatter={(value: number, name: string, props: any) => {
                    const payload = props.payload;
                    const formattedValue = formatTooltipValue(value, name)[0];
                    const label = formatTooltipValue(value, name)[1];
                    
                    // Enhanced tooltip with advanced analytics
                    const tooltipLines = [`${formattedValue}`, label];
                    
                    if (aggregation === 'avg' && payload?.confidenceInterval) {
                      const ci = payload.confidenceInterval;
                      tooltipLines.push(`95% CI: [${ci.lowerBound}, ${ci.upperBound}]`);
                    }
                    
                    if (aggregation === 'avg' && payload?.median !== undefined) {
                      tooltipLines.push(`Median: ${payload.median}`);
                    }
                    
                    if (payload?.count !== undefined) {
                      tooltipLines.push(`Sample size: ${payload.count}`);
                    }
                    
                    return tooltipLines;
                  }}
                  labelFormatter={(label) => `${xAxisLabel}: ${label}`}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="value" name={yAxisLabel} fill={COLORS[0]} radius={[6, 6, 0, 0]}>
                  {chartData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry?.showWarning ? 'hsl(45, 93%, 47%)' : COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'line':
        return (
          <div className="space-y-2">
            <div className="px-2 py-1.5 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">X-Axis:</span> {xAxisLabel} • 
                <span className="font-medium text-foreground ml-2">Y-Axis:</span> {yAxisLabel}
                <span className="ml-2">• Shows trend progression</span>
              </p>
            </div>
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" opacity={0.4} />
                <XAxis 
                  dataKey="name" 
                  tick={axisStyle}
                  angle={-40}
                  textAnchor="end"
                  height={80}
                  tickLine={{ stroke: 'hsl(222, 30%, 25%)' }}
                  label={{ value: xAxisLabel, position: 'bottom', offset: -5, fill: 'hsl(173, 80%, 45%)', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis 
                  tick={axisStyle}
                  tickFormatter={(val) => formatValue(val)}
                  tickLine={{ stroke: 'hsl(222, 30%, 25%)' }}
                  label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: 'hsl(173, 80%, 45%)', fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={tooltipStyle} 
                  labelStyle={{ color: 'hsl(210, 40%, 98%)', fontWeight: 600 }}
                  formatter={formatTooltipValue}
                  labelFormatter={(label) => `${xAxisLabel}: ${label}`}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Line 
                  type="monotone" 
                  dataKey="value"
                  name={yAxisLabel}
                  stroke={COLORS[0]} 
                  strokeWidth={3} 
                  dot={{ fill: COLORS[0], strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: COLORS[1], stroke: COLORS[0], strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'area':
        return (
          <div className="space-y-2">
            <div className="px-2 py-1.5 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">X-Axis:</span> {xAxisLabel} • 
                <span className="font-medium text-foreground ml-2">Y-Axis:</span> {yAxisLabel}
                <span className="ml-2">• Area shows cumulative distribution</span>
              </p>
            </div>
            <ResponsiveContainer width="100%" height={height}>
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 80 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.7}/>
                    <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" opacity={0.4} />
                <XAxis 
                  dataKey="name" 
                  tick={axisStyle}
                  angle={-40}
                  textAnchor="end"
                  height={80}
                  tickLine={{ stroke: 'hsl(222, 30%, 25%)' }}
                  label={{ value: xAxisLabel, position: 'bottom', offset: -5, fill: 'hsl(173, 80%, 45%)', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis 
                  tick={axisStyle}
                  tickFormatter={(val) => formatValue(val)}
                  tickLine={{ stroke: 'hsl(222, 30%, 25%)' }}
                  label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: 'hsl(173, 80%, 45%)', fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={tooltipStyle} 
                  labelStyle={{ color: 'hsl(210, 40%, 98%)', fontWeight: 600 }}
                  formatter={formatTooltipValue}
                  labelFormatter={(label) => `${xAxisLabel}: ${label}`}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Area 
                  type="monotone" 
                  dataKey="value"
                  name={yAxisLabel}
                  stroke={COLORS[0]} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'pie':
        const pieData = chartData.slice(0, 8);
        const total = pieData.reduce((sum, d) => sum + d.value, 0);
        
        return (
          <div className="space-y-2">
            <div className="px-2 py-1.5 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Distribution of:</span> {xAxisLabel}
                <span className="ml-2">• Each slice represents proportion of {yAxisLabel.toLowerCase()}</span>
              </p>
            </div>
            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={isExpanded ? 160 : 100}
                  innerRadius={isExpanded ? 50 : 35}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string, props: any) => [
                    `${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`,
                    props.payload.fullName || name
                  ]}
                />
                <Legend 
                  wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                  formatter={(value, entry: any) => (
                    <span style={{ color: 'hsl(215, 20%, 65%)' }}>{entry.payload.fullName || value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'scatter':
        // Check if this is a relationship scatter plot with raw variables
        const isRelationshipScatter = view.analyticalIntent?.relationship_variables && 
          Array.isArray(chartData) && 
          chartData.length > 0 && 
          'x' in chartData[0] && 
          'y' in chartData[0];
        
        if (isRelationshipScatter && view.analyticalIntent?.relationship_variables) {
          // Use derived labels - same as xAxisLabel/yAxisLabel from deriveAxisLabels (exact column names)
          return (
            <div className="space-y-2">
              <div className="px-2 py-1.5 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">X-Axis:</span> {xAxisLabel} • 
                  <span className="font-medium text-foreground ml-2">Y-Axis:</span> {yAxisLabel}
                  <span className="ml-2">• Each point represents a data row</span>
                </p>
              </div>
              <ResponsiveContainer width="100%" height={height}>
                <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" opacity={0.4} />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name={xAxisLabel}
                    tick={axisStyle}
                    tickFormatter={(val) => formatValue(val)}
                    label={{ value: xAxisLabel, position: 'bottom', offset: 0, fill: 'hsl(173, 80%, 45%)', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name={yAxisLabel}
                    tick={axisStyle}
                    tickFormatter={(val) => formatValue(val)}
                    label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: 'hsl(173, 80%, 45%)', fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3', stroke: 'hsl(173, 80%, 45%)' }} 
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [formatValue(value), name]}
                    labelFormatter={(label) => `${xAxisLabel}: ${label}`}
                  />
                  <Legend wrapperStyle={{ paddingTop: 10 }} />
                  <Scatter name="Data Points" data={chartData} fill={COLORS[0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[0]} opacity={0.6} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          );
        }
        
        // Fallback: Legacy scatter plot (aggregated data)
        return (
          <div className="space-y-2">
            <div className="px-2 py-1.5 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">X-Axis:</span> Frequency (occurrences) • 
                <span className="font-medium text-foreground ml-2">Y-Axis:</span> {yAxisLabel}
                <span className="ml-2">• Each point represents a category</span>
              </p>
            </div>
            <ResponsiveContainer width="100%" height={height}>
              <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" opacity={0.4} />
                <XAxis 
                  type="number" 
                  dataKey="count" 
                  name="Frequency" 
                  tick={axisStyle}
                  label={{ value: 'Frequency (Count)', position: 'bottom', offset: 0, fill: 'hsl(173, 80%, 45%)', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="value" 
                  name="Value" 
                  tick={axisStyle}
                  tickFormatter={(val) => formatValue(val)}
                  label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: 'hsl(173, 80%, 45%)', fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3', stroke: 'hsl(173, 80%, 45%)' }} 
                  contentStyle={tooltipStyle}
                  formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Scatter name="Data Points" data={chartData} fill={COLORS[0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'radar':
        return (
          <div className="space-y-2">
            <div className="px-2 py-1.5 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Dimensions:</span> {xAxisLabel} categories
                <span className="ml-2">• Radius shows {yAxisLabel.toLowerCase()} magnitude</span>
              </p>
            </div>
            <ResponsiveContainer width="100%" height={height}>
              <RadarChart cx="50%" cy="50%" outerRadius={isExpanded ? "70%" : "60%"} data={chartData.slice(0, 8)}>
                <PolarGrid stroke="hsl(222, 30%, 22%)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(215, 20%, 60%)', fontSize: 10 }} />
                <PolarRadiusAxis tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 10 }} />
                <Radar name={yAxisLabel} dataKey="value" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.4} strokeWidth={2} />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={formatTooltipValue} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );
      
      default:
        return (
          <div className="space-y-2">
            <div className="px-2 py-1.5 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">X-Axis:</span> {xAxisLabel} • 
                <span className="font-medium text-foreground ml-2">Y-Axis:</span> {yAxisLabel}
              </p>
            </div>
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 20%)" opacity={0.4} />
                <XAxis 
                  dataKey="name" 
                  tick={axisStyle} 
                  angle={-40} 
                  textAnchor="end" 
                  height={80}
                  label={{ value: xAxisLabel, position: 'bottom', offset: -5, fill: 'hsl(173, 80%, 45%)', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis 
                  tick={axisStyle} 
                  tickFormatter={(val) => formatValue(val)}
                  label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: 'hsl(173, 80%, 45%)', fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={formatTooltipValue} />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="value" name={yAxisLabel} fill={COLORS[0]} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
    }
  };

  // Pre-compute chart data to filter out views with no valid data
  const viewsWithData = useMemo(() => {
    const combined: DashboardView[] = [...dashboardViews];
    if (combined.length < 4) {
      fallbackViews.forEach((view) => {
        const exists = combined.some(
          (existing) =>
            existing.chartType === view.chartType &&
            existing.variables?.join("|") === view.variables?.join("|")
        );
        if (!exists) combined.push(view);
      });
    }

    const hydrated = combined
      .map((view, idx) => ({ view, idx, chartData: generateChartData(view) }))
      .filter(item => item.chartData && item.chartData.length >= 2);

    const pickFinalViews = (items: typeof hydrated, limit = 4) => {
      if (items.length <= limit) return items;

      // Prefer at least one pie chart when dataset supports it.
      const pieItem = items.find((item) => item.view.chartType === "pie");
      const selected: typeof items = [];
      const seen = new Set<string>();

      if (pieItem) {
        const pieKey = `${pieItem.view.chartType}:${pieItem.view.variables?.join("|")}`;
        selected.push(pieItem);
        seen.add(pieKey);
      }

      for (const item of items) {
        const key = `${item.view.chartType}:${item.view.variables?.join("|")}`;
        if (seen.has(key)) continue;
        selected.push(item);
        seen.add(key);
        if (selected.length >= limit) break;
      }

      return selected.slice(0, limit);
    };

    if (hydrated.length < 4) {
      const fallbackHydrated = fallbackViews
        .map((view, idx) => ({ view, idx: idx + 1000, chartData: generateChartData(view) }))
        .filter(item => item.chartData && item.chartData.length >= 2);
      const merged = [...hydrated, ...fallbackHydrated];
      const unique: typeof merged = [];
      const seen = new Set<string>();
      for (const item of merged) {
        const key = `${item.view.chartType}:${item.view.variables?.join("|")}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(item);
        }
        if (unique.length >= 4) break;
      }
      return pickFinalViews(unique, 4);
    }

    return pickFinalViews(hydrated, 4);
  }, [dashboardViews, generateChartData, fallbackViews]);

  const selectedViewItem = expandedChart !== null 
    ? viewsWithData.find(v => v.idx === expandedChart) 
    : null;

  if (!chartsReady) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border bg-secondary/30">
              <Skeleton className="h-10 w-3/4" />
            </div>
            <div className="p-4">
              <Skeleton className="h-[280px] w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (viewsWithData.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <Info className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">No Visualizations Available</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          The AI could not generate charts for this dataset. This may be due to the data format or structure.
          Try with a dataset that has clear numeric and categorical columns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20">
        <Info className="w-5 h-5 text-primary flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{viewsWithData.length} visualizations</span> generated based on AI analysis of your data structure and patterns.
        </p>
      </div>

      {/* Chart Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {viewsWithData.map(({ view, idx, chartData }) => (
          <div key={idx} className="glass-card rounded-2xl overflow-hidden group">
            {/* Chart Header */}
            <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <ChartIcon type={view.chartType} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-foreground truncate">{view.title}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary uppercase flex-shrink-0">
                      {view.chartType}
                    </span>
                    {view.analyticalIntent?.metric.aggregation && view.analyticalIntent.metric.aggregation !== 'none' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent/20 text-accent uppercase flex-shrink-0">
                        {normalizeAggregation(view.analyticalIntent.metric.aggregation)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{view.purpose}</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpandedChart(idx)}
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Chart Body */}
            <div className="p-4">
              {renderChart(view, chartData)}
            </div>
            
            {/* Chart Footer */}
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-1.5">
                {view.variables.slice(0, 3).map((variable, vIdx) => (
                  <span
                    key={vIdx}
                    className="px-2 py-1 rounded-md text-xs bg-secondary border border-border text-muted-foreground"
                  >
                    {variable}
                  </span>
                ))}
                {view.variables.length > 3 && (
                  <span className="px-2 py-1 rounded-md text-xs bg-secondary border border-border text-muted-foreground">
                    +{view.variables.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Chart Modal */}
      <Dialog open={expandedChart !== null} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="max-w-5xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedViewItem && <ChartIcon type={selectedViewItem.view.chartType} />}
              <span>{selectedViewItem?.view.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedViewItem && renderChart(selectedViewItem.view, selectedViewItem.chartData, true)}
          </div>
          {selectedViewItem && (
            <p className="text-sm text-muted-foreground">{selectedViewItem.view.purpose}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};