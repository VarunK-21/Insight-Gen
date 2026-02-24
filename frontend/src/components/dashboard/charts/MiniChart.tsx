import { useMemo } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table2, Activity, TrendingUp } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardView {
  title: string;
  purpose: string;
  chartType: 'line' | 'bar' | 'scatter' | 'table' | 'pie' | 'area' | 'radar';
  variables: string[];
  aggregation?: string;
}

interface MiniChartProps {
  view: DashboardView;
  data: string[][];
  index: number;
}

const COLORS = [
  'hsl(173, 80%, 45%)',
  'hsl(271, 91%, 65%)',
  'hsl(45, 93%, 47%)',
  'hsl(142, 71%, 45%)',
  'hsl(217, 91%, 60%)',
  'hsl(280, 68%, 60%)',
];

const ChartIcon = ({ type }: { type: DashboardView['chartType'] }) => {
  switch (type) {
    case 'line': return <LineChartIcon className="w-4 h-4" />;
    case 'bar': return <BarChart3 className="w-4 h-4" />;
    case 'pie': return <PieChartIcon className="w-4 h-4" />;
    case 'area': return <Activity className="w-4 h-4" />;
    case 'radar': return <TrendingUp className="w-4 h-4" />;
    default: return <Table2 className="w-4 h-4" />;
  }
};

// Clean label to remove "?" and unknown values
const cleanLabel = (label: string): string | null => {
  if (!label || label === '?' || label === 'Unknown' || label === 'null' || label === 'undefined' || label.trim() === '') {
    return null;
  }
  return label.trim();
};

// Format values for display
const formatValue = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
};

export const MiniChart = ({ view, data, index }: MiniChartProps) => {
  const headers = data[0] || [];
  const rows = data.slice(1);

  const chartData = useMemo(() => {
    // Find the best columns to use based on view variables
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

    // If no matching columns, find first text and numeric columns
    let labelIdx = varIndices[0] ?? -1;
    let valueIdx = varIndices[1] ?? -1;

    if (labelIdx === -1) {
      labelIdx = headers.findIndex((_, idx) => {
        const vals = rows.slice(0, 10).map(r => r[idx]).filter(Boolean);
        return vals.some(v => isNaN(parseFloat(v)));
      });
      if (labelIdx === -1) labelIdx = 0;
    }

    if (valueIdx === -1) {
      valueIdx = headers.findIndex((_, idx) => {
        if (idx === labelIdx) return false;
        const vals = rows.slice(0, 10).map(r => r[idx]).filter(Boolean);
        return vals.length > 0 && vals.every(v => !isNaN(parseFloat(v.replace(/[,$%]/g, ''))));
      });
      if (valueIdx === -1) valueIdx = labelIdx === 0 ? 1 : 0;
    }

    // Aggregate data by label - filter out invalid labels
    const aggregated: Record<string, { sum: number; count: number }> = {};
    
    rows.slice(0, 300).forEach(row => {
      const rawLabel = (row[labelIdx] || '').toString().trim();
      const label = cleanLabel(rawLabel);
      
      // Skip invalid labels
      if (!label) return;
      
      const rawVal = row[valueIdx] || '0';
      const val = parseFloat(rawVal.toString().replace(/[,$%]/g, ''));
      
      if (!aggregated[label]) {
        aggregated[label] = { sum: 0, count: 0 };
      }
      
      if (!isNaN(val) && isFinite(val)) {
        aggregated[label].sum += val;
        aggregated[label].count++;
      }
    });

    const result = Object.entries(aggregated)
      .filter(([name]) => name && name.length > 0)
      .slice(0, 8)
      .map(([name, d]) => ({
        name: name.length > 10 ? name.slice(0, 10) + '..' : name,
        fullName: name,
        value: view.aggregation === 'avg' && d.count > 0 
          ? Math.round(d.sum / d.count) 
          : view.aggregation === 'count' 
            ? d.count 
            : Math.round(d.sum),
      }))
      .filter(d => d.value > 0 && isFinite(d.value))
      .sort((a, b) => b.value - a.value);

    return result.length >= 2 ? result : null; // Require at least 2 data points
  }, [data, view, headers, rows]);

  const color = COLORS[index % COLORS.length];

  // If no valid chart data, don't render anything
  if (!chartData || chartData.length < 2) {
    return null;
  }

  // Extract axis info
  const xAxisLabel = view.variables[0] || 'Category';
  const yAxisLabel = view.aggregation === 'count' ? 'Count' : view.aggregation === 'avg' ? 'Avg' : 'Value';

  const tooltipStyle = { 
    backgroundColor: 'hsl(222, 47%, 11%)', 
    border: '1px solid hsl(222, 30%, 22%)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '11px',
  };

  const renderMiniChart = () => {
    switch (view.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 8 }}
                axisLine={false}
                tickLine={false}
                angle={-30}
                textAnchor="end"
                height={25}
              />
              <YAxis 
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 8 }}
                axisLine={false}
                tickLine={false}
                width={30}
                tickFormatter={(val) => formatValue(val)}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [formatValue(val), yAxisLabel]} />
              <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 8 }}
                axisLine={false}
                tickLine={false}
                angle={-30}
                textAnchor="end"
                height={25}
              />
              <YAxis 
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 8 }}
                axisLine={false}
                tickLine={false}
                width={30}
                tickFormatter={(val) => formatValue(val)}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [formatValue(val), yAxisLabel]} />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id={`miniGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.6}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 8 }}
                axisLine={false}
                tickLine={false}
                angle={-30}
                textAnchor="end"
                height={25}
              />
              <YAxis 
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 8 }}
                axisLine={false}
                tickLine={false}
                width={30}
                tickFormatter={(val) => formatValue(val)}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [formatValue(val), yAxisLabel]} />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#miniGradient-${index})`} />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie
                data={chartData.slice(0, 5)}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={40}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={3}
              >
                {chartData.slice(0, 5).map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(val: number, name: string, props: any) => [formatValue(val), props.payload.fullName || name]} />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 8 }}
                axisLine={false}
                tickLine={false}
                angle={-30}
                textAnchor="end"
                height={25}
              />
              <YAxis 
                tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 8 }}
                axisLine={false}
                tickLine={false}
                width={30}
                tickFormatter={(val) => formatValue(val)}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(val: number) => [formatValue(val), yAxisLabel]} />
              <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  // Calculate a simple stat to show
  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  const avg = Math.round(total / chartData.length);

  return (
    <div className="p-4 rounded-xl bg-secondary/30 border border-border hover:border-primary/50 transition-all duration-300 group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <ChartIcon type={view.chartType} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-foreground line-clamp-1">{view.title}</span>
            <span className="text-[10px] text-muted-foreground">{chartData.length} categories</span>
          </div>
        </div>
      </div>
      
      {/* Axis labels */}
      <div className="mb-1 px-1">
        <p className="text-[9px] text-muted-foreground">
          <span className="text-primary/80">X:</span> {xAxisLabel.slice(0, 15)}{xAxisLabel.length > 15 ? '..' : ''} • 
          <span className="text-primary/80 ml-1">Y:</span> {yAxisLabel}
        </p>
      </div>
      
      {renderMiniChart()}
      
      {/* Quick stat */}
      <div className="mt-2 flex items-center justify-between">
        <UITooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground cursor-help">
              Avg: <span className="text-foreground font-medium">{formatValue(avg)}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">{view.purpose}</p>
          </TooltipContent>
        </UITooltip>
        
        <div className="flex gap-1">
          {view.variables.slice(0, 1).map((v, i) => (
            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground truncate max-w-[60px]">
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};