import { useState } from "react";
import { TrendingUp, Database, CheckCircle, ChevronDown, Layers, Zap, BarChart3, GitBranch, AlertTriangle, Target } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface PatternsTabProps {
  patterns: string[];
  dataSummary: string[];
}

export const PatternsTab = ({ patterns, dataSummary }: PatternsTabProps) => {
  const [expandedSection, setExpandedSection] = useState<'preparation' | 'patterns' | 'both'>('both');

  // Categorize patterns by type with icons
  const categorizePattern = (pattern: string) => {
    const lowerPattern = pattern.toLowerCase();
    if (lowerPattern.includes('correlation') || lowerPattern.includes('relationship')) return 'correlation';
    if (lowerPattern.includes('trend') || lowerPattern.includes('increase') || lowerPattern.includes('decrease') || lowerPattern.includes('growth')) return 'trend';
    if (lowerPattern.includes('distribution') || lowerPattern.includes('concentrated') || lowerPattern.includes('spread')) return 'distribution';
    if (lowerPattern.includes('outlier') || lowerPattern.includes('anomal') || lowerPattern.includes('unusual')) return 'anomaly';
    if (lowerPattern.includes('cluster') || lowerPattern.includes('group') || lowerPattern.includes('segment')) return 'cluster';
    return 'general';
  };

  const patternCategories: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    trend: { label: 'Trend', color: 'bg-primary/20 text-primary', icon: <TrendingUp className="w-3 h-3" /> },
    correlation: { label: 'Correlation', color: 'bg-accent/20 text-accent', icon: <GitBranch className="w-3 h-3" /> },
    distribution: { label: 'Distribution', color: 'bg-persona-engineer/20 text-persona-engineer', icon: <BarChart3 className="w-3 h-3" /> },
    anomaly: { label: 'Anomaly', color: 'bg-destructive/20 text-destructive', icon: <AlertTriangle className="w-3 h-3" /> },
    cluster: { label: 'Cluster', color: 'bg-persona-policy/20 text-persona-policy', icon: <Target className="w-3 h-3" /> },
    general: { label: 'Insight', color: 'bg-secondary text-muted-foreground', icon: <Zap className="w-3 h-3" /> },
  };

  return (
    <div className="space-y-6">
      {/* Two Column Layout on Large Screens */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Data Preparation Summary */}
        <Collapsible 
          open={expandedSection === 'preparation' || expandedSection === 'both'}
          onOpenChange={() => setExpandedSection(prev => 
            prev === 'preparation' ? 'both' : prev === 'both' ? 'patterns' : 'preparation'
          )}
        >
          <div className="glass-card rounded-2xl overflow-hidden">
            <CollapsibleTrigger className="w-full p-5 flex items-center justify-between hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-semibold text-lg text-foreground">Data Preparation</h3>
                  <p className="text-xs text-muted-foreground">{dataSummary.length} operations completed</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                (expandedSection === 'preparation' || expandedSection === 'both') ? 'rotate-180' : ''
              }`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-5 pb-5 space-y-2">
                {dataSummary.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
                  >
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Discovered Patterns */}
        <Collapsible 
          open={expandedSection === 'patterns' || expandedSection === 'both'}
          onOpenChange={() => setExpandedSection(prev => 
            prev === 'patterns' ? 'both' : prev === 'both' ? 'preparation' : 'patterns'
          )}
        >
          <div className="glass-card rounded-2xl overflow-hidden">
            <CollapsibleTrigger className="w-full p-5 flex items-center justify-between hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-accent/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-semibold text-lg text-foreground">Discovered Patterns</h3>
                  <p className="text-xs text-muted-foreground">{patterns.length} patterns identified</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${
                (expandedSection === 'patterns' || expandedSection === 'both') ? 'rotate-180' : ''
              }`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-5 pb-5 space-y-3">
                {patterns.map((pattern, idx) => {
                  const category = categorizePattern(pattern);
                  const categoryConfig = patternCategories[category];
                  
                  return (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-secondary/40 border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-accent">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className={`text-[10px] gap-1 ${categoryConfig.color}`}>
                              {categoryConfig.icon}
                              {categoryConfig.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{pattern}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center justify-center gap-8 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">{dataSummary.length} Prep Steps</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span className="text-sm text-muted-foreground">{patterns.length} Patterns Found</span>
        </div>
      </div>
    </div>
  );
};