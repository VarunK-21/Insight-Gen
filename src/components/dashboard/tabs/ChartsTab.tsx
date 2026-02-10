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

interface DashboardView {
  title: string;
  purpose: string;
  chartType: 'line' | 'bar' | 'scatter' | 'table' | 'pie' | 'area' | 'radar';
  variables: string[];
  aggregation?: string;
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
const formatValue = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
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

    // Find column indices for the variables
    const varIndices = view.variables.map(v => {
      let idx = headers.findIndex(h => h?.toLowerCase() === v?.toLowerCase());
      if (idx === -1) {
        idx = headers.findIndex(h => 
          h?.toLowerCase()?.includes(v?.toLowerCase()) || 
          v?.toLowerCase()?.includes(h?.toLowerCase())
        );
      }
      return idx;
    }).filter(i => i !== -1);

    // Find fallback columns if no matches
    let labelIdx = varIndices[0] ?? -1;
    let valueIdx = varIndices[1] ?? -1;

    if (labelIdx === -1) {
      // Find first text column
      labelIdx = headers.findIndex((_, idx) => {
        const vals = rows.slice(0, 20).map(r => r[idx]).filter(Boolean);
        return vals.some(v => v && isNaN(parseFloat(v.toString())));
      });
      if (labelIdx === -1) labelIdx = 0;
    }

    if (valueIdx === -1 || valueIdx === labelIdx) {
      // Find first numeric column that isn't the label
      valueIdx = headers.findIndex((_, idx) => {
        if (idx === labelIdx) return false;
        const vals = rows.slice(0, 20).map(r => r[idx]).filter(Boolean);
        return vals.length > 0 && vals.every(v => !isNaN(parseFloat(v.toString().replace(/[,$%]/g, ''))));
      });
      if (valueIdx === -1) valueIdx = labelIdx === 0 ? Math.min(1, headers.length - 1) : 0;
    }

    // Sample larger datasets to prevent performance issues
    const sampleSize = Math.min(rows.length, 500);
    const sampleStep = Math.ceil(rows.length / sampleSize);
    const sampledRows = rows.filter((_, i) => i % sampleStep === 0).slice(0, sampleSize);

    // Aggregate data - filter out invalid labels early
    const aggregated: Record<string, { sum: number; count: number; values: number[] }> = {};
    
    sampledRows.forEach(row => {
      const rawLabel = (row[labelIdx] || '').toString().trim();
      const label = cleanLabel(rawLabel);
      
      // Skip invalid labels
      if (!label) return;
      
      const rawVal = row[valueIdx] || '0';
      const val = parseFloat(rawVal.toString().replace(/[,$%]/g, ''));
      
      if (!aggregated[label]) {
        aggregated[label] = { sum: 0, count: 0, values: [] };
      }
      
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
        switch (view.aggregation) {
          case 'avg':
            value = d.count > 0 ? Math.round(d.sum / d.count * 100) / 100 : 0;
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
        };
      })
      .filter(d => d.value !== 0 && isFinite(d.value) && d.name)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Limit to 10 items for cleaner charts

    return result.length >= 2 ? result : null; // Require at least 2 data points
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
    
    // Extract meaningful axis labels from view
    const xAxisLabel = view.variables[0] || 'Category';
    const yAxisLabel = view.aggregation === 'count' ? 'Count' : view.aggregation === 'avg' ? 'Average Value' : 'Value';

    // Custom tooltip formatter with context
    const formatTooltipValue = (value: number, name: string) => {
      const formattedValue = value >= 1000000 
        ? `${(value / 1000000).toFixed(2)}M` 
        : value >= 1000 
          ? `${(value / 1000).toFixed(1)}K`
          : value.toLocaleString();
      
      const label = view.aggregation === 'count' ? 'Count' : 
                    view.aggregation === 'avg' ? 'Average' : 'Total';
      return [formattedValue, label];
    };

    switch (view.chartType) {
      case 'bar':
        return (
          <div className="space-y-2">
            {/* Chart Description */}
            <div className="px-2 py-1.5 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">X-Axis:</span> {xAxisLabel} • 
                <span className="font-medium text-foreground ml-2">Y-Axis:</span> {yAxisLabel}
                {view.aggregation && view.aggregation !== 'none' && (
                  <span className="ml-2">• Aggregated by <span className="text-primary">{view.aggregation}</span></span>
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
                  formatter={formatTooltipValue}
                  labelFormatter={(label) => `${xAxisLabel}: ${label}`}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="value" name={yAxisLabel} fill={COLORS[0]} radius={[6, 6, 0, 0]} />
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
    return dashboardViews
      .map((view, idx) => ({ view, idx, chartData: generateChartData(view) }))
      .filter(item => item.chartData && item.chartData.length >= 2);
  }, [dashboardViews, generateChartData]);

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
                    {view.aggregation && view.aggregation !== 'none' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent/20 text-accent uppercase flex-shrink-0">
                        {view.aggregation}
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