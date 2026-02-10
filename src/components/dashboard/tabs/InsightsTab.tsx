import { PersonaType, CustomPersonaData } from "@/components/PersonaSelector";
import { Lightbulb, AlertTriangle, Brain, Target, TrendingUp, Zap, Sparkles, Eye, CheckCircle } from "lucide-react";

interface InsightsTabProps {
  insights: string[];
  persona: PersonaType;
  warning?: string;
  customPersona?: CustomPersonaData;
}

const personaConfig: Record<PersonaType, { 
  name: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  description: string;
}> = {
  common: { 
    name: 'Common Citizen', 
    color: 'text-persona-common',
    bgColor: 'bg-persona-common',
    borderColor: 'border-persona-common',
    icon: <Target className="w-6 h-6" />,
    description: 'Practical insights focused on everyday impact and accessibility'
  },
  accountant: { 
    name: 'Chartered Accountant', 
    color: 'text-persona-accountant',
    bgColor: 'bg-persona-accountant',
    borderColor: 'border-persona-accountant',
    icon: <TrendingUp className="w-6 h-6" />,
    description: 'Financial analysis with focus on compliance and fiscal patterns'
  },
  engineer: { 
    name: 'Systems Engineer', 
    color: 'text-persona-engineer',
    bgColor: 'bg-persona-engineer',
    borderColor: 'border-persona-engineer',
    icon: <Zap className="w-6 h-6" />,
    description: 'Technical analysis emphasizing efficiency and scalability'
  },
  policy: { 
    name: 'Policy Strategist', 
    color: 'text-persona-policy',
    bgColor: 'bg-persona-policy',
    borderColor: 'border-persona-policy',
    icon: <Brain className="w-6 h-6" />,
    description: 'Strategic perspective focused on governance and long-term impact'
  },
  lawyer: { 
    name: 'Legal Advisor', 
    color: 'text-accent',
    bgColor: 'bg-accent',
    borderColor: 'border-accent',
    icon: <Eye className="w-6 h-6" />,
    description: 'Legal compliance and regulatory risk assessment'
  },
  business: { 
    name: 'Business Analyst', 
    color: 'text-primary',
    bgColor: 'bg-primary',
    borderColor: 'border-primary',
    icon: <TrendingUp className="w-6 h-6" />,
    description: 'Business strategy and market opportunity analysis'
  },
  data_scientist: { 
    name: 'Data Scientist', 
    color: 'text-persona-engineer',
    bgColor: 'bg-persona-engineer',
    borderColor: 'border-persona-engineer',
    icon: <Brain className="w-6 h-6" />,
    description: 'Statistical patterns and predictive insights'
  },
  product_manager: { 
    name: 'Product Manager', 
    color: 'text-persona-policy',
    bgColor: 'bg-persona-policy',
    borderColor: 'border-persona-policy',
    icon: <Target className="w-6 h-6" />,
    description: 'User-centric product and feature opportunities'
  },
  custom: { 
    name: 'Custom Persona', 
    color: 'text-accent',
    bgColor: 'bg-accent',
    borderColor: 'border-accent',
    icon: <Sparkles className="w-6 h-6" />,
    description: 'Your custom analytical perspective'
  },
};

export const InsightsTab = ({ insights, persona, warning, customPersona }: InsightsTabProps) => {
  const config = personaConfig[persona] || personaConfig.custom;
  
  const displayName = persona === 'custom' && customPersona?.name 
    ? customPersona.name 
    : config.name;
  
  const displayDescription = persona === 'custom' && customPersona?.description 
    ? customPersona.description 
    : config.description;

  return (
    <div className="space-y-6">
      {/* Persona Header */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl ${config.bgColor} flex items-center justify-center text-white shadow-lg`}>
            {config.icon}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold text-foreground">{displayName} Perspective</h2>
            <p className="text-sm text-muted-foreground mt-1">{displayDescription}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <Lightbulb className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">{insights.length} Insights</span>
          </div>
        </div>
      </div>

      {/* Warning */}
      {warning && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-persona-common/10 border border-persona-common/30">
          <AlertTriangle className="w-5 h-5 text-persona-common flex-shrink-0 mt-0.5" />
          <p className="text-sm text-persona-common">{warning}</p>
        </div>
      )}

      {/* Insights List - Simple Point-wise Display */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">Key Findings</h3>
            <p className="text-xs text-muted-foreground">AI-generated insights based on {displayName.toLowerCase()} perspective</p>
          </div>
        </div>

        <div className="space-y-4">
          {insights.map((insight, idx) => (
            <div 
              key={idx}
              className="flex items-start gap-4 p-4 rounded-xl bg-secondary/40 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className={`w-8 h-8 rounded-lg ${config.bgColor}/20 flex items-center justify-center flex-shrink-0`}>
                <span className={`text-sm font-bold ${config.color}`}>{idx + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground leading-relaxed">{insight}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-primary/40 flex-shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Custom Persona Details */}
      {persona === 'custom' && customPersona && (
        <div className="glass-card rounded-xl p-5 border-l-4 border-accent">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-display font-semibold text-foreground mb-1">Custom Analysis Focus</h4>
              <p className="text-sm text-muted-foreground">{customPersona.analyticalFocus}</p>
              {customPersona.customPrompt && (
                <p className="text-xs text-accent mt-2 italic">"{customPersona.customPrompt}"</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-center py-4 border-t border-border">
        <p className="text-xs text-muted-foreground italic max-w-xl mx-auto">
          "These outputs are exploratory and intended to support human judgment, not replace it."
        </p>
      </div>
    </div>
  );
};