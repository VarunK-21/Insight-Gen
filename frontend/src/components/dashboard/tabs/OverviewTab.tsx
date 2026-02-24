import { useMemo } from "react";
import { PersonaType, CustomPersonaData } from "@/components/PersonaSelector";
import { AnalysisResult } from "@/components/InsightsPanel";
import { TrendingUp, BarChart3, Lightbulb, AlertTriangle, Database, Columns, Rows3, Hash, Sparkles, Info } from "lucide-react";
import { MiniChart } from "../charts/MiniChart";

interface CleaningReport {
  totalRows: number;
  cleanedRows: number;
  removedRows: number;
  nullsHandled: number;
  duplicatesRemoved: number;
  dataTypeCorrections: number;
  outliersFlagged: number;
}

interface ExtendedAnalysisResult extends AnalysisResult {
  cleaningReport?: CleaningReport;
  columnStats?: Record<string, any>;
}

interface OverviewTabProps {
  insights: ExtendedAnalysisResult;
  persona: PersonaType;
  data: string[][];
  customPersona?: CustomPersonaData;
}

const personaNames: Record<PersonaType, string> = {
  common: 'Common Citizen',
  accountant: 'Chartered Accountant',
  engineer: 'Systems Engineer',
  policy: 'Policy Strategist',
  lawyer: 'Legal Advisor',
  business: 'Business Analyst',
  data_scientist: 'Data Scientist',
  product_manager: 'Product Manager',
  custom: 'Custom Persona',
};

export const OverviewTab = ({ insights, persona, data, customPersona }: OverviewTabProps) => {
  const headers = data[0];
  const rows = data.slice(1);
  
  const displayPersonaName = persona === 'custom' && customPersona?.name 
    ? customPersona.name 
    : personaNames[persona];
  
  // Use cleaning report stats if available
  const cleaningReport = insights.cleaningReport;
  
  // Calculate some basic stats
  const numericColumns = headers.filter((_, idx) => {
    const vals = rows.map(row => row[idx]).filter(v => v && v.trim() !== '');
    const numericCount = vals.filter(v => !isNaN(parseFloat(v))).length;
    return numericCount > vals.length * 0.5;
  }).length;
  
  const completeness = cleaningReport 
    ? Math.round(((cleaningReport.totalRows * headers.length - cleaningReport.nullsHandled) / (cleaningReport.totalRows * headers.length)) * 100)
    : 100;

  // Filter mini charts to only show those with valid data - more robust check
  const validMiniCharts = useMemo(() => {
    if (!insights.dashboardViews || insights.dashboardViews.length === 0) return [];
    
    return insights.dashboardViews.slice(0, 6).filter(view => {
      // Pre-check if view can generate data by looking at actual data
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
      
      // Also check for any text column + numeric column combination as fallback
      const hasTextCol = headers.some((_, idx) => {
        const vals = rows.slice(0, 10).map(r => r[idx]).filter(Boolean);
        return vals.some(v => v && isNaN(parseFloat(v.toString())));
      });
      
      const hasNumericCol = headers.some((_, idx) => {
        const vals = rows.slice(0, 10).map(r => r[idx]).filter(Boolean);
        return vals.length > 0 && vals.every(v => !isNaN(parseFloat(v.toString().replace(/[,$%]/g, ''))));
      });
      
      return (varIndices.length > 0 || (hasTextCol && hasNumericCol)) && headers.length >= 2;
    });
  }, [insights.dashboardViews, headers, rows]);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard 
          icon={<Rows3 className="w-5 h-5" />}
          label="Total Records"
          value={rows.length.toLocaleString()}
          color="primary"
        />
        <StatCard 
          icon={<Columns className="w-5 h-5" />}
          label="Fields"
          value={headers.length.toString()}
          color="accent"
        />
        <StatCard 
          icon={<Hash className="w-5 h-5" />}
          label="Numeric Fields"
          value={numericColumns.toString()}
          color="primary"
        />
        <StatCard 
          icon={<Database className="w-5 h-5" />}
          label="Data Completeness"
          value={`${completeness}%`}
          color={completeness > 90 ? 'primary' : 'accent'}
        />
        {cleaningReport && (
          <StatCard 
            icon={<Sparkles className="w-5 h-5" />}
            label="Rows Cleaned"
            value={cleaningReport.cleanedRows.toLocaleString()}
            color="persona-accountant"
          />
        )}
      </div>

      {/* Warning Banner */}
      {insights.warning && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-persona-common/10 border border-persona-common/30">
          <AlertTriangle className="w-5 h-5 text-persona-common flex-shrink-0 mt-0.5" />
          <p className="text-sm text-persona-common">{insights.warning}</p>
        </div>
      )}

      {/* Custom Persona Info */}
      {persona === 'custom' && customPersona && (
        <div className="glass-card rounded-xl p-4 border-l-4 border-accent">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="font-display font-semibold text-foreground">{customPersona.name}</span>
          </div>
          {customPersona.description && (
            <p className="text-sm text-muted-foreground mb-1">{customPersona.description}</p>
          )}
          <p className="text-xs text-accent">Focus: {customPersona.analyticalFocus}</p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Data Summary */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground">Data Summary</h3>
          </div>
          <ul className="space-y-2">
            {insights.dataSummary.slice(0, 5).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-1 flex-shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Key Patterns */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground">Key Patterns</h3>
          </div>
          <ul className="space-y-2">
            {insights.patterns.slice(0, 5).map((pattern, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-accent mt-1 flex-shrink-0">•</span>
                <span>{pattern}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Insights */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-persona-accountant/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-persona-accountant" />
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              {displayPersonaName} View
            </h3>
          </div>
          <ul className="space-y-2">
            {insights.insights.slice(0, 4).map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-5 h-5 rounded-full bg-persona-accountant/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-persona-accountant">
                  {idx + 1}
                </span>
                <span className="line-clamp-2">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Charts Preview - Only show if we have valid charts */}
      {validMiniCharts.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg text-foreground">Quick Visualizations</h3>
                <p className="text-xs text-muted-foreground">AI-suggested charts based on data patterns</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="w-4 h-4" />
              <span>Hover for details</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validMiniCharts.slice(0, 3).map((view, idx) => (
              <MiniChart key={idx} view={view} data={data} index={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  color: string;
}) => (
  <div className="glass-card rounded-xl p-4">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg bg-${color}/20 flex items-center justify-center text-${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  </div>
);