import { Lightbulb, AlertTriangle, TrendingUp, BarChart3, LineChart, PieChart, Table2 } from "lucide-react";
import { PersonaType } from "./PersonaSelector";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InsightsPanelProps {
  insights: AnalysisResult | null;
  persona: PersonaType;
  isLoading: boolean;
}

export interface AnalysisResult {
  dataSummary: string[];
  patterns: string[];
  insights: string[];
  dashboardViews: DashboardView[];
  warning?: string;
}

interface DashboardView {
  title: string;
  purpose: string;
  chartType: 'line' | 'bar' | 'scatter' | 'table' | 'pie';
  variables: string[];
}

const personaColors: Record<PersonaType, string> = {
  common: 'persona-common',
  accountant: 'persona-accountant',
  engineer: 'persona-engineer',
  policy: 'persona-policy',
  lawyer: 'accent',
  business: 'primary',
  data_scientist: 'persona-engineer',
  product_manager: 'persona-policy',
  custom: 'accent',
};

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

const ChartIcon = ({ type }: { type: DashboardView['chartType'] }) => {
  switch (type) {
    case 'line': return <LineChart className="w-5 h-5" />;
    case 'bar': return <BarChart3 className="w-5 h-5" />;
    case 'pie': return <PieChart className="w-5 h-5" />;
    case 'table': return <Table2 className="w-5 h-5" />;
    default: return <BarChart3 className="w-5 h-5" />;
  }
};

export const InsightsPanel = ({ insights, persona, isLoading }: InsightsPanelProps) => {
  const color = personaColors[persona];
  
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary" />
            <div className="h-6 w-48 bg-secondary rounded" />
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-secondary rounded w-full" style={{ width: `${85 - i * 10}%` }} />
            ))}
          </div>
        </div>
        
        <div className="glass-card rounded-2xl p-6">
          <div className="h-6 w-36 bg-secondary rounded mb-4" />
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-secondary rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!insights) return null;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Data Preparation Summary */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg text-foreground">Data Preparation Summary</h3>
        </div>
        <ul className="space-y-2">
          {insights.dataSummary.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Key Patterns */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-accent" />
          </div>
          <h3 className="font-display font-semibold text-lg text-foreground">Key Patterns Observed</h3>
        </div>
        <ul className="space-y-2">
          {insights.patterns.map((pattern, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
              <span className="text-accent mt-1">•</span>
              <span>{pattern}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Warning if applicable */}
      {insights.warning && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-persona-common/10 border border-persona-common/30">
          <AlertTriangle className="w-5 h-5 text-persona-common flex-shrink-0 mt-0.5" />
          <p className="text-sm text-persona-common">{insights.warning}</p>
        </div>
      )}
      
      {/* Persona-Specific Insights */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl bg-${color}/20 flex items-center justify-center`}>
            <Lightbulb className={`w-5 h-5 text-${color}`} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              {personaNames[persona]} Insights
            </h3>
            <p className="text-xs text-muted-foreground">Hypotheses framed from this perspective</p>
          </div>
        </div>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {insights.insights.map((insight, idx) => (
              <div
                key={idx}
                className="insight-card border border-border"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full bg-${color}/20 flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-xs font-bold text-${color}`}>{idx + 1}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{insight}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {/* Dashboard Suggestions */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg text-foreground">Suggested Dashboard Views</h3>
        </div>
        
        <div className="grid gap-4">
          {insights.dashboardViews.map((view, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <ChartIcon type={view.chartType} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-display font-semibold text-foreground">{view.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary uppercase">
                      {view.chartType}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{view.purpose}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {view.variables.map((variable, vIdx) => (
                      <span
                        key={vIdx}
                        className="px-2 py-0.5 rounded-md text-xs bg-card border border-border text-foreground"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground italic">
          "These outputs are exploratory and intended to support human judgment, not replace it."
        </p>
      </div>
    </div>
  );
};
